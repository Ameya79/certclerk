"""
CertClerk — Test configuration and shared fixtures.
"""

import os
import sys
import tempfile
from pathlib import Path
from unittest.mock import MagicMock

import pytest

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest.fixture
def temp_dir():
    """Provide a temporary directory for test data."""
    with tempfile.TemporaryDirectory() as d:
        yield d


@pytest.fixture
def store(temp_dir):
    """Provide a JobStore with a temporary directory."""
    from core.store import JobStore
    return JobStore(os.path.join(temp_dir, "jobs"))


@pytest.fixture
def sample_csv_bytes():
    """Sample CSV file bytes for testing."""
    return b"Name,Email\nRahul Sharma,rahul@gmail.com\nPriya Iyer,priya@yahoo.com\nAmit Kumar,amit@hotmail.com\n"


@pytest.fixture
def messy_csv_bytes():
    """Messy CSV file with various issues."""
    return (
        b"Full Name,E-mail ID,Phone\n"
        b"rahul SHARMA,rahul@gmail.com,1234567890\n"
        b"  amit  ,amit@gmial.com,0987654321\n"
        b"Dr. priya iyer,priya@yahoo.com,1122334455\n"
        b"MCDONALD,mcdonald@outlook.com,5566778899\n"
        b"d'souza,dsouza@hotmail.com,9988776655\n"
        b"A. P. J. kumar,kumar@gmail.com,4433221100\n"
    )


@pytest.fixture
def sample_xlsx_bytes():
    """Create a minimal XLSX file for testing."""
    import io
    import pandas as pd

    df = pd.DataFrame({
        "Name": ["Rahul Sharma", "Priya Iyer", "Amit Kumar"],
        "Email": ["rahul@gmail.com", "priya@yahoo.com", "amit@hotmail.com"],
    })
    buf = io.BytesIO()
    df.to_excel(buf, index=False, engine="openpyxl")
    return buf.getvalue()


class FakeLLM:
    """
    Fake LLM for testing.

    Scripted responses, including failures, for reproducible tests
    without real API calls.
    """

    def __init__(self, responses=None):
        self.responses = responses or []
        self.calls = []
        self._idx = 0

    def __call__(self, system, user, schema, retries=2):
        self.calls.append({"system": system, "user": user, "schema": schema})
        if self._idx < len(self.responses):
            resp = self.responses[self._idx]
            self._idx += 1
            if resp is None:
                return None  # Simulate LLM unavailable
            if isinstance(resp, Exception):
                raise resp
            return resp
        return None  # Default: unavailable


@pytest.fixture
def fake_llm():
    """Provide a FakeLLM instance."""
    return FakeLLM()


@pytest.fixture
def mock_audit():
    """Provide a mock audit function."""
    return MagicMock()


@pytest.fixture
def simple_template_pdf():
    """
    Create a simple PDF with the word AGENT as selectable text.
    This is a synthetic test fixture.
    """
    import pymupdf

    doc = pymupdf.open()
    page = doc.new_page(width=842, height=595)  # A4 landscape

    # Add a title
    page.insert_text(
        (300, 100),
        "Certificate of Achievement",
        fontsize=24,
        fontname="helv",
        color=(0, 0, 0),
    )

    # Add placeholder text (this is what analyze_template looks for)
    page.insert_text(
        (350, 300),
        "AGENT",
        fontsize=36,
        fontname="helv",
        color=(0, 0, 0),
    )

    # Add some other text
    page.insert_text(
        (250, 400),
        "is hereby awarded this certificate",
        fontsize=14,
        fontname="helv",
        color=(0.3, 0.3, 0.3),
    )

    page.insert_text(
        (300, 500),
        "Date: November 2026",
        fontsize=12,
        fontname="helv",
        color=(0.5, 0.5, 0.5),
    )

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

