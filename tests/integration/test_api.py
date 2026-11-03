"""
CertClerk — Integration tests for FastAPI endpoints.
"""

import io
import json
import time
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from api.main import app, store


@pytest.fixture
def client(temp_dir):
    """Provide a TestClient with a fresh temporary job store."""
    from core.store import JobStore
    import api.main
    api.main.store = JobStore(temp_dir + "/jobs")
    with TestClient(app) as test_client:
        yield test_client


class TestApiIntegration:
    """End-to-end integration tests for CertClerk API."""

    def test_healthz(self, client):
        """GET /healthz should return 200 ok."""
        response = client.get("/healthz")
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert data["service"] == "galeus"

    def test_full_job_lifecycle(self, client, simple_template_pdf, sample_csv_bytes):
        """
        Complete lifecycle test:
        Upload -> Analyze -> Map -> Set Email -> Generate -> Preview -> Approve -> Download -> Audit -> Delete
        """
        # 1. POST /api/jobs (Create)
        response = client.post(
            "/api/jobs",
            files={
                "template": ("template.pdf", simple_template_pdf, "application/pdf"),
                "data": ("attendees.csv", sample_csv_bytes, "text/csv"),
            },
            data={"placeholder": "AGENT"},
        )
        assert response.status_code == 200
        job_id = response.json()["job_id"]
        assert job_id is not None

        # 2. GET /api/jobs/{id}
        res_get = client.get(f"/api/jobs/{job_id}")
        assert res_get.status_code == 200
        assert res_get.json()["status"] == "created"

        # 3. POST /api/jobs/{id}/analyze
        res_analyze = client.post(f"/api/jobs/{job_id}/analyze")
        assert res_analyze.status_code == 202

        # Poll until mapped (allow up to 8s for live LLM inference if active)
        for _ in range(80):
            res_poll = client.get(f"/api/jobs/{job_id}")
            if res_poll.json()["status"] == "mapped":
                break
            time.sleep(0.1)

        job_state = client.get(f"/api/jobs/{job_id}").json()
        assert job_state["status"] == "mapped"
        assert len(job_state["recipients"]) == 3
        assert job_state["name_column"] == "Name"
        assert job_state["email_column"] == "Email"

        # 4. PUT /api/jobs/{id}/email-template
        res_template = client.put(
            f"/api/jobs/{job_id}/email-template",
            json={"subject": "Your Certificate for {event}", "body": "Hi {name}, congratulations!"},
        )
        assert res_template.status_code == 200

        # 5. POST /api/jobs/{id}/generate
        res_gen = client.post(f"/api/jobs/{job_id}/generate")
        assert res_gen.status_code == 202

        # Poll until generated
        for _ in range(50):
            res_poll = client.get(f"/api/jobs/{job_id}")
            if res_poll.json()["status"] == "generated":
                break
            time.sleep(0.1)

        job_state = client.get(f"/api/jobs/{job_id}").json()
        assert job_state["status"] == "generated"
        assert job_state["progress"] == 3

        # 6. GET /api/jobs/{id}/preview/{row_id}.png
        res_prev = client.get(f"/api/jobs/{job_id}/preview/2.png")
        assert res_prev.status_code == 200
        assert res_prev.headers["content-type"] == "image/png"
        assert res_prev.content[:4] == b"\x89PNG"

        # 7. Gate check: POST /api/jobs/{id}/send before approve -> 409
        smtp_payload = {
            "host": "localhost",
            "port": 587,
            "user": "test",
            "password": "secret_password",
            "sender": "sender@test.com",
        }
        res_unapproved_send = client.post(f"/api/jobs/{job_id}/send", json=smtp_payload)
        assert res_unapproved_send.status_code == 409

        # 8. POST /api/jobs/{id}/approve
        res_approve = client.post(f"/api/jobs/{job_id}/approve")
        assert res_approve.status_code == 200
        assert "hash" in res_approve.json()
        approved_hash = res_approve.json()["hash"]

        # Verify state is approved
        job_state = client.get(f"/api/jobs/{job_id}").json()
        assert job_state["status"] == "approved"
        assert job_state["approved_hash"] == approved_hash

        # 9. Gate check: edit recipient after approve -> hash mismatch on send
        client.patch(f"/api/jobs/{job_id}/recipients/2", json={"clean_name": "Modified Name"})
        res_altered_send = client.post(f"/api/jobs/{job_id}/send", json=smtp_payload)
        # Approval was invalidated or hash mismatch -> returns 409
        assert res_altered_send.status_code == 409

        # Re-approve
        # Re-generate and re-approve
        client.post(f"/api/jobs/{job_id}/generate")
        for _ in range(50):
            if client.get(f"/api/jobs/{job_id}").json()["status"] == "generated":
                break
            time.sleep(0.1)
        res_reapprove = client.post(f"/api/jobs/{job_id}/approve")
        assert res_reapprove.status_code == 200

        # 10. GET /api/jobs/{id}/download.zip
        res_zip = client.get(f"/api/jobs/{job_id}/download.zip")
        assert res_zip.status_code == 200
        assert res_zip.headers["content-type"] == "application/zip"
        assert len(res_zip.content) > 0

        # 11. GET /api/jobs/{id}/audit
        res_audit = client.get(f"/api/jobs/{job_id}/audit")
        assert res_audit.status_code == 200
        entries = res_audit.json()["entries"]
        assert len(entries) > 0
        events = [e["event"] for e in entries]
        assert "job_created" in events
        assert "approved" in events

        # 12. DELETE /api/jobs/{id}
        res_del = client.delete(f"/api/jobs/{job_id}")
        assert res_del.status_code == 200
        # Subsequent GET should return 404
        assert client.get(f"/api/jobs/{job_id}").status_code == 404

    def test_llm_settings_endpoints(self, client):
        """Test GET, POST /api/settings/llm and test ping."""
        # 1. GET /api/settings/llm
        res_get = client.get("/api/settings/llm")
        assert res_get.status_code == 200
        data = res_get.json()
        assert "configured" in data
        assert "provider" in data

        # 2. POST /api/settings/llm (Configure Gemini)
        res_save = client.post(
            "/api/settings/llm",
            json={
                "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
                "api_key": "AIzaSyFakeKey12345678",
                "model": "gemini-2.0-flash",
                "persist": False,
            },
        )
        assert res_save.status_code == 200
        saved = res_save.json()["settings"]
        assert saved["configured"] is True
        assert saved["provider"] == "Google Gemini"
        assert saved["masked_key"] == "AIza...5678"

        # 3. POST /api/settings/llm/test with dummy key (should fail gracefully with clear message, not 500)
        res_test = client.post(
            "/api/settings/llm/test",
            json={
                "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
                "api_key": "dummy_key",
                "model": "gemini-2.0-flash",
            },
        )
        assert res_test.status_code == 200
        test_data = res_test.json()
        assert test_data["ok"] is False
        assert "error" in test_data

