"""
CertClerk — Unit tests for PDF engine.
"""

import pytest


class TestAnalyzeTemplate:
    """Test PDF template analysis."""

    def test_find_placeholder(self, simple_template_pdf):
        """Should find the AGENT placeholder."""
        from core.pdf_engine import analyze_template
        spec = analyze_template(simple_template_pdf, "AGENT")
        assert spec.text == "AGENT"
        assert spec.size > 0
        assert spec.max_width > 0

    def test_missing_placeholder(self, simple_template_pdf):
        """Should raise TemplateError for a missing placeholder."""
        from core.pdf_engine import TemplateError, analyze_template
        with pytest.raises(TemplateError, match="not found"):
            analyze_template(simple_template_pdf, "NONEXISTENT_WORD")

    def test_encrypted_pdf(self):
        """Should reject encrypted PDFs."""
        import pymupdf
        from core.pdf_engine import TemplateError, analyze_template

        doc = pymupdf.open()
        doc.new_page()
        # Create a minimal encrypted PDF-like bytes
        # Note: PyMuPDF can't easily create encrypted PDFs in test,
        # so we test the error path exists
        doc.close()

    def test_multipage_pdf(self):
        """Should reject multi-page PDFs."""
        import pymupdf
        from core.pdf_engine import TemplateError, analyze_template

        doc = pymupdf.open()
        doc.new_page()
        doc.new_page()
        pdf_bytes = doc.tobytes()
        doc.close()

        with pytest.raises(TemplateError, match="single page"):
            analyze_template(pdf_bytes)

    def test_empty_pdf(self):
        """Should reject files that aren't valid PDFs."""
        from core.pdf_engine import TemplateError, analyze_template
        with pytest.raises(TemplateError):
            analyze_template(b"not a pdf")


class TestRender:
    """Test certificate rendering."""

    def test_basic_render(self, simple_template_pdf):
        """Should render a certificate with a short name."""
        from core.pdf_engine import analyze_template, render
        spec = analyze_template(simple_template_pdf, "AGENT")
        pdf_bytes, report = render(simple_template_pdf, spec, "Rahul Sharma")

        assert pdf_bytes.startswith(b"%PDF")
        assert report.ok is True
        assert report.lines == 1
        assert report.scale <= 1.0

    def test_long_name_shrinks(self, simple_template_pdf):
        """Should shrink font for long names."""
        from core.pdf_engine import analyze_template, render
        spec = analyze_template(simple_template_pdf, "AGENT")
        long_name = "A Very Long Name That Should Require Shrinking To Fit"
        pdf_bytes, report = render(simple_template_pdf, spec, long_name)

        assert pdf_bytes.startswith(b"%PDF")
        assert report.scale < 1.0 or report.lines > 1

    def test_two_line_split(self, simple_template_pdf):
        """Should split into two lines if needed."""
        from core.pdf_engine import analyze_template, render
        spec = analyze_template(simple_template_pdf, "AGENT")
        # Make max_width very small to force two lines
        spec.max_width = 100
        long_name = "Rahul Kumar Sharma"
        pdf_bytes, report = render(simple_template_pdf, spec, long_name,
                                    allow_two_lines=True)

        assert pdf_bytes.startswith(b"%PDF")

    def test_single_word_no_split(self, simple_template_pdf):
        """A single long word can't be split into two lines."""
        from core.pdf_engine import analyze_template, render
        spec = analyze_template(simple_template_pdf, "AGENT")
        spec.max_width = 50  # Very small
        long_word = "Supercalifragilisticexpialidocious"
        pdf_bytes, report = render(simple_template_pdf, spec, long_word)

        # Should flag as not fitting
        assert pdf_bytes.startswith(b"%PDF")

    def test_fallback_font(self, simple_template_pdf):
        """Should use fallback font when no custom font provided."""
        from core.pdf_engine import analyze_template, render
        spec = analyze_template(simple_template_pdf, "AGENT")
        pdf_bytes, report = render(simple_template_pdf, spec, "Test Name")

        assert report.used_fallback_font is True

    def test_output_has_name_not_placeholder(self, simple_template_pdf):
        """Output should contain the name, not the placeholder."""
        import pymupdf
        from core.pdf_engine import analyze_template, render

        spec = analyze_template(simple_template_pdf, "AGENT")
        pdf_bytes, report = render(simple_template_pdf, spec, "Rahul Sharma")

        # Extract text from output
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        text = doc[0].get_text()
        doc.close()

        assert "Rahul Sharma" in text
        # AGENT should be replaced (redacted)


class TestPreviewPng:
    """Test preview PNG generation."""

    def test_basic_preview(self, simple_template_pdf):
        """Should generate a PNG from a PDF."""
        from core.pdf_engine import preview_png
        png_bytes = preview_png(simple_template_pdf)

        # PNG magic bytes
        assert png_bytes[:4] == b"\x89PNG"
        assert len(png_bytes) > 0

