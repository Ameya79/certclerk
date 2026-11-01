"""
CertClerk — Unit tests for validators module.
"""

import pytest


class TestCheckEmail:
    """Test email validation."""

    @pytest.mark.parametrize("email,expected_status,expected_suggestion", [
        # Valid emails
        ("user@example.com", "ok", None),
        ("first.last+tag@sub.example.org", "ok", None),
        ("a@b.co", "ok", None),

        # Invalid emails
        ("", "missing", None),
        ("a@b", "invalid", None),
        ("@b.com", "invalid", None),
        ("a b@c.com", "invalid", None),
        ("a@b..com", "invalid", None),
        ("a" * 300 + "@b.com", "invalid", None),

        # Header injection attempt
        ("a@b.com\r\nBcc: x@y.com", "invalid", None),

        # Fixable typos
        ("x@gmial.com", "fixable", "x@gmail.com"),
        ("x@gmai.com", "fixable", "x@gmail.com"),
        ("x@gamil.com", "fixable", "x@gmail.com"),
        ("x@yaho.com", "fixable", "x@yahoo.com"),
        ("x@hotmial.com", "fixable", "x@hotmail.com"),
        ("x@outlok.com", "fixable", "x@outlook.com"),
    ])
    def test_check_email(self, email, expected_status, expected_suggestion):
        from core.validators import check_email
        status, suggestion = check_email(email)
        assert status == expected_status
        assert suggestion == expected_suggestion


class TestRulesClean:
    """Test rules-based name cleaning."""

    @pytest.mark.parametrize("raw,expected", [
        # Basic title case
        ("rahul sharma", "Rahul Sharma"),
        ("RAHUL SHARMA", "Rahul Sharma"),

        # Mc prefix
        ("mcdonald", "McDonald"),
        ("MCDONALD", "McDonald"),

        # O' prefix
        ("o'brien", "O'Brien"),

        # D' prefix
        ("d'souza", "D'Souza"),

        # Lowercase particles
        ("maria de la cruz", "Maria de la Cruz"),
        ("hans van der berg", "Hans van der Berg"),

        # Initials
        ("a. p. j. kumar", "A. P. J. Kumar"),
        ("j kumar", "J. Kumar"),

        # Hyphenated names
        ("anne-marie", "Anne-Marie"),

        # Titles
        ("dr. priya iyer", "Dr. Priya Iyer"),
        ("mr smith jr", "Mr. Smith Jr."),

        # Suffixes
        ("james smith iii", "James Smith III"),

        # Whitespace handling
        ("  rahul  sharma  ", "Rahul Sharma"),
    ])
    def test_rules_clean(self, raw, expected):
        from core.validators import rules_clean
        assert rules_clean(raw) == expected


class TestFindDuplicates:
    """Test duplicate detection."""

    def test_duplicate_by_email(self):
        from core.models import Recipient
        from core.validators import find_duplicates

        recipients = [
            Recipient(row_id=1, raw_name="Rahul", email="rahul@gmail.com"),
            Recipient(row_id=2, raw_name="RAHUL", email="rahul@gmail.com"),
            Recipient(row_id=3, raw_name="Priya", email="priya@gmail.com"),
        ]

        dups = find_duplicates(recipients, use_email=True)
        assert 1 in dups
        assert 2 in dups
        assert 3 not in dups

    def test_different_names_same_email(self):
        """Two different people with same email should be flagged."""
        from core.models import Recipient
        from core.validators import find_duplicates

        recipients = [
            Recipient(row_id=1, raw_name="Rahul Sharma", email="shared@gmail.com"),
            Recipient(row_id=2, raw_name="Priya Iyer", email="shared@gmail.com"),
        ]

        dups = find_duplicates(recipients, use_email=True)
        assert 1 in dups
        assert 2 in dups

    def test_same_name_different_email_not_duplicate(self):
        """Same name but different email should NOT be duplicate (when using email)."""
        from core.models import Recipient
        from core.validators import find_duplicates

        recipients = [
            Recipient(row_id=1, raw_name="Rahul Sharma", email="rahul1@gmail.com"),
            Recipient(row_id=2, raw_name="Rahul Sharma", email="rahul2@gmail.com"),
        ]

        dups = find_duplicates(recipients, use_email=True)
        assert len(dups) == 0

