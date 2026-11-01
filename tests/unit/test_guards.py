"""
CertClerk — Unit tests for guards module.
"""

import pytest
from hypothesis import given, strategies as st


class TestChangeAllowed:
    """Test the name-change invariant guard."""

    @pytest.mark.parametrize("raw,clean,ok", [
        # Basic formatting changes — allowed
        ("rahul SHARMA", "Rahul Sharma", True),
        ("  amit  ", "Amit", True),
        ("a.p.j. kumar", "A. P. J. Kumar", True),
        ("mcdonald", "McDonald", True),
        ("d'souza", "D'Souza", True),
        ("o'brien", "O'Brien", True),
        ("PRIYA IYER", "Priya Iyer", True),
        ("anne-marie", "Anne-Marie", True),

        # Hallucinated changes — blocked
        ("rahul sharma", "Rahul Kumar Sharma", False),  # added "Kumar"
        ("priya", "Priyanka", False),                    # expanded name
        ("amit", "Sumit", False),                        # different name

        # Edge cases — blocked
        ("Amit", "", False),                              # empty
        ("Amit", "A" * 500, False),                      # too long
        ("Amit", "Amit\x00", False),                     # control char
    ])
    def test_change_allowed(self, raw, clean, ok):
        from core.guards import change_allowed
        assert change_allowed(raw, clean) is ok

    @given(st.text(min_size=1, max_size=80))
    def test_identity_always_allowed_if_sane(self, s):
        """Trimming a string should always be allowed (if it's valid and has no control chars)."""
        from core.guards import change_allowed, has_control
        stripped = s.strip()
        if stripped and not has_control(stripped) and len(stripped) <= 120:
            # Identity (trim only) should always be allowed
            assert change_allowed(s, stripped)

    @given(st.text(min_size=1, max_size=60), st.text(min_size=1, max_size=60))
    def test_allowed_implies_same_letters(self, a, b):
        """If a change is allowed, the normalized letters must match."""
        from core.guards import change_allowed, norm
        if change_allowed(a, b):
            assert norm(a) == norm(b)


class TestNeedsReview:
    """Test the name review prefilter."""

    @pytest.mark.parametrize("name,expected", [
        ("Rahul Sharma", False),        # Already clean
        ("Dr. Priya Iyer", False),      # Title with dot
        ("Anne-Marie", False),          # Hyphen
        ("O'Brien", False),             # Apostrophe
        ("rahul SHARMA", True),         # Mixed case issues
        ("  amit  ", True),             # Leading/trailing spaces
        ("RAHUL", True),               # All caps
        ("rahul", True),               # All lower
        ("rahul  sharma", True),       # Double space
        ("rahul123", True),            # Numbers
    ])
    def test_needs_review(self, name, expected):
        from core.guards import needs_review
        assert needs_review(name) is expected


class TestBatchHash:
    """Test the approval hash."""

    def test_same_input_same_hash(self):
        from core.guards import batch_hash
        from core.models import Recipient

        recipients = [
            Recipient(row_id=1, raw_name="Test", clean_name="Test", email="a@b.com", status="ready"),
            Recipient(row_id=2, raw_name="Test2", clean_name="Test2", email="c@d.com", status="ready"),
        ]

        h1 = batch_hash(recipients, "sha1", "sha2", "Subject", "Body")
        h2 = batch_hash(recipients, "sha1", "sha2", "Subject", "Body")
        assert h1 == h2

    def test_name_change_changes_hash(self):
        from core.guards import batch_hash
        from core.models import Recipient

        r1 = [Recipient(row_id=1, raw_name="T", clean_name="Test", email="a@b.com", status="ready")]
        r2 = [Recipient(row_id=1, raw_name="T", clean_name="Test2", email="a@b.com", status="ready")]

        h1 = batch_hash(r1, "sha1", "sha2", "Subject", "Body")
        h2 = batch_hash(r2, "sha1", "sha2", "Subject", "Body")
        assert h1 != h2

    def test_subject_change_changes_hash(self):
        from core.guards import batch_hash
        from core.models import Recipient

        r = [Recipient(row_id=1, raw_name="T", clean_name="Test", email="a@b.com", status="ready")]

        h1 = batch_hash(r, "sha1", "sha2", "Subject A", "Body")
        h2 = batch_hash(r, "sha1", "sha2", "Subject B", "Body")
        assert h1 != h2

    def test_skip_changes_hash(self):
        from core.guards import batch_hash
        from core.models import Recipient

        r1 = [Recipient(row_id=1, raw_name="T", clean_name="Test", email="a@b.com", status="ready")]
        r2 = [Recipient(row_id=1, raw_name="T", clean_name="Test", email="a@b.com", status="skipped")]

        h1 = batch_hash(r1, "sha1", "sha2", "Sub", "Body")
        h2 = batch_hash(r2, "sha1", "sha2", "Sub", "Body")
        assert h1 != h2


class TestSanitizeCsvCell:
    """Test CSV injection prevention."""

    @pytest.mark.parametrize("value,expected_prefix", [
        ("=1+1", "'"),
        ("+1+1", "'"),
        ("-1+1", "'"),
        ("@SUM", "'"),
        ("\tcommand", "'"),
        ("\rcommand", "'"),
        ("Normal text", "N"),
        ("123", "1"),
    ])
    def test_sanitize(self, value, expected_prefix):
        from core.guards import sanitize_csv_cell
        result = sanitize_csv_cell(value)
        assert result[0] == expected_prefix


class TestValidateJobId:
    """Test job ID validation."""

    @pytest.mark.parametrize("job_id,valid", [
        ("abcdef1234567890", True),           # 16 chars
        ("abc_def-123-456789012345", True),    # Mixed with _ and -
        ("short", False),                      # Too short
        ("../../etc/passwd", False),           # Path traversal
        ("abc\x00def1234567890", False),       # Null byte
        ("a" * 33, False),                     # Too long
    ])
    def test_validate(self, job_id, valid):
        from core.guards import validate_job_id
        assert validate_job_id(job_id) is valid

