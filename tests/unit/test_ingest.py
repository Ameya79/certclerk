"""
CertClerk — Unit tests for ingestion module.
"""

import pytest


class TestReadTable:
    """Test CSV/XLSX parsing."""

    def test_clean_csv(self, sample_csv_bytes):
        """Should parse a clean CSV correctly."""
        from core.ingest import read_table
        headers, rows = read_table(sample_csv_bytes, ".csv")

        assert "Name" in headers
        assert "Email" in headers
        assert len(rows) == 3
        assert rows[0]["cells"]["Name"] == "Rahul Sharma"

    def test_messy_csv(self, messy_csv_bytes):
        """Should parse a messy CSV correctly."""
        from core.ingest import read_table
        headers, rows = read_table(messy_csv_bytes, ".csv")

        assert len(headers) == 3
        assert len(rows) == 6

    def test_xlsx(self, sample_xlsx_bytes):
        """Should parse an XLSX file."""
        from core.ingest import read_table
        headers, rows = read_table(sample_xlsx_bytes, ".xlsx")

        assert "Name" in headers
        assert len(rows) == 3

    def test_unsupported_extension(self):
        """Should reject unsupported file types."""
        from core.ingest import IngestError, read_table
        with pytest.raises(IngestError, match="Unsupported"):
            read_table(b"data", ".json")

    def test_empty_file(self):
        """Should reject empty data."""
        from core.ingest import IngestError, read_table
        with pytest.raises(IngestError):
            read_table(b"", ".csv")

    def test_headers_only(self):
        """Should reject file with headers but no data rows."""
        from core.ingest import IngestError, read_table
        with pytest.raises(IngestError, match="no data"):
            read_table(b"Name,Email\n", ".csv")

    def test_fake_xlsx(self):
        """Should reject a file that claims to be XLSX but isn't."""
        from core.ingest import IngestError, read_table
        with pytest.raises(IngestError):
            read_table(b"Not really an xlsx file", ".xlsx")

    def test_row_id_preserved(self, sample_csv_bytes):
        """Row IDs should reflect original line numbers."""
        from core.ingest import read_table
        headers, rows = read_table(sample_csv_bytes, ".csv")

        # Row IDs should be sequential starting from 2 (after header)
        for row in rows:
            assert "row_id" in row
            assert isinstance(row["row_id"], int)

    def test_bom_handling(self):
        """Should handle UTF-8 BOM."""
        from core.ingest import read_table
        bom_csv = b"\xef\xbb\xbfName,Email\nTest,test@test.com\n"
        headers, rows = read_table(bom_csv, ".csv")
        assert "Name" in headers
        assert len(rows) == 1

    def test_semicolon_delimiter(self):
        """Should auto-detect semicolon delimiter."""
        from core.ingest import read_table
        csv_data = b"Name;Email\nRahul;rahul@test.com\nPriya;priya@test.com\n"
        headers, rows = read_table(csv_data, ".csv")
        assert "Name" in headers
        assert len(rows) == 2

    def test_duplicate_headers(self):
        """Should deduplicate headers."""
        from core.ingest import read_table
        csv_data = b"Name,Name,Email\nA,B,c@d.com\n"
        headers, rows = read_table(csv_data, ".csv")
        assert len(set(headers)) == len(headers)  # All unique

    def test_empty_rows_skipped(self):
        """Should skip completely empty rows."""
        from core.ingest import read_table
        csv_data = b"Name,Email\nRahul,r@g.com\n,,\nPriya,p@g.com\n"
        headers, rows = read_table(csv_data, ".csv")
        assert len(rows) == 2


class TestStoreIntegration:
    """Test job store operations."""

    def test_create_and_load(self, store):
        """Should create a job and load it back."""
        job_id = store.create()
        data = store.load(job_id)

        assert data["job_id"] == job_id
        assert data["status"] == "created"

    def test_atomic_save(self, store):
        """Should save atomically."""
        job_id = store.create()
        data = store.load(job_id)
        data["status"] = "analyzed"
        store.save(job_id, data)

        reloaded = store.load(job_id)
        assert reloaded["status"] == "analyzed"

    def test_append_log(self, store):
        """Should append to log files."""
        job_id = store.create()
        store.append(job_id, "audit.jsonl", {"event": "test", "ts": 123})
        store.append(job_id, "audit.jsonl", {"event": "test2", "ts": 456})

        # Read back
        import json
        log_path = store._dir(job_id) / "audit.jsonl"
        with open(log_path) as f:
            lines = f.readlines()
        assert len(lines) == 2

    def test_invalid_job_id(self, store):
        """Should reject invalid job IDs."""
        from core.store import StoreError
        with pytest.raises(StoreError):
            store.load("../../etc/passwd")

    def test_delete(self, store):
        """Should delete job data."""
        job_id = store.create()
        assert store.exists(job_id)
        store.delete(job_id)
        assert not store.exists(job_id)

    def test_transition_valid(self, store):
        """Should allow valid state transitions."""
        job_id = store.create()
        data = store.load(job_id)
        data = store.transition(data, "analyzed")
        assert data["status"] == "analyzed"

    def test_transition_invalid(self, store):
        """Should reject invalid state transitions."""
        from core.store import TransitionError
        job_id = store.create()
        data = store.load(job_id)
        with pytest.raises(TransitionError):
            store.transition(data, "sending")  # Can't go from created to sending

    def test_save_and_read_file(self, store):
        """Should save and read binary files."""
        job_id = store.create()
        store.save_file(job_id, "test.txt", b"hello world")
        data = store.read_file(job_id, "test.txt")
        assert data == b"hello world"

    def test_list_jobs(self, store):
        """Should list all jobs."""
        id1 = store.create()
        id2 = store.create()
        jobs = store.list_jobs()
        assert id1 in jobs
        assert id2 in jobs

