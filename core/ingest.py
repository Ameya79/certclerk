"""
CertClerk — Ingestion module.

Parses CSV and XLSX files into a normalized (headers, rows) structure.
Handles encoding detection, delimiter sniffing, header detection, and
zip-bomb defense.
"""

from __future__ import annotations

import csv
import io
import zipfile

import pandas as pd
from charset_normalizer import from_bytes

MAX_ROWS = 2000
MAX_COLS = 50


class IngestError(Exception):
    """Raised when the input file cannot be parsed or is invalid."""
    pass


def _check_xlsx_zip(
    data: bytes,
    max_uncompressed: int = 50_000_000,
    max_entries: int = 200,
) -> None:
    """Check an XLSX file (ZIP archive) for suspicious content."""
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            infos = z.infolist()
            if len(infos) > max_entries:
                raise IngestError(
                    f"Spreadsheet has too many internal files ({len(infos)}). "
                    "This might be a malicious file."
                )
            total = sum(i.file_size for i in infos)
            if total > max_uncompressed:
                raise IngestError(
                    f"Spreadsheet uncompressed size ({total:,} bytes) exceeds the limit. "
                    "This might be a zip bomb."
                )
    except zipfile.BadZipFile:
        raise IngestError("Not a valid .xlsx file.")


def _find_header_row(df: pd.DataFrame, scan: int = 10) -> int:
    """
    Find the most likely header row.

    Looks for a row where ≥60% of cells are non-empty strings and
    none are pure numbers (headers are usually text).
    """
    for i in range(min(scan, len(df) - 1)):
        row = df.iloc[i]
        nonempty = sum(1 for c in row if str(c).strip())
        if nonempty >= max(2, 0.6 * df.shape[1]):
            # Check if this looks like headers (not all numeric)
            if not all(str(c).strip().replace(".", "").isdigit() for c in row if str(c).strip()):
                return i
    return 0


def _dedupe(headers: list[str]) -> list[str]:
    """Make header names unique by appending _N for duplicates."""
    seen: dict[str, int] = {}
    out: list[str] = []
    for h in headers:
        seen[h] = seen.get(h, 0) + 1
        out.append(h if seen[h] == 1 else f"{h}_{seen[h]}")
    return out


def read_table(
    data: bytes,
    filename_ext: str,
) -> tuple[list[str], list[dict]]:
    """
    Parse a CSV or XLSX file into (headers, rows).

    Each row is a dict: {"row_id": int, "cells": {header: value}}.
    row_id preserves the original line number from the file.

    Raises IngestError with a human-readable message on failure.
    """
    filename_ext = filename_ext.lower()

    if filename_ext == ".xlsx":
        if not data.startswith(b"PK"):
            raise IngestError(
                "File does not appear to be a real .xlsx file "
                "(expected ZIP format)."
            )
        _check_xlsx_zip(data)
        try:
            df = pd.read_excel(
                io.BytesIO(data),
                header=None,
                dtype=str,
                engine="openpyxl",
            )
        except Exception as e:
            raise IngestError(f"Failed to read Excel file: {e}")

    elif filename_ext == ".csv":
        # Detect encoding
        detection = from_bytes(data).best()
        encoding = detection.encoding if detection else "cp1252"
        text = data.decode(encoding, errors="replace")

        # Handle BOM
        if text.startswith("\ufeff"):
            text = text[1:]

        # Detect delimiter
        try:
            dialect = csv.Sniffer().sniff(text[:5000], delimiters=",;\t|")
            sep = dialect.delimiter
        except csv.Error:
            sep = ","

        # Filter out empty or delimiter-only lines
        lines = [line for line in text.splitlines() if line.strip() and set(line.strip()) != {sep}]
        cleaned_text = "\n".join(lines)

        try:
            df = pd.read_csv(
                io.StringIO(cleaned_text),
                sep=sep,
                header=None,
                dtype=str,
                keep_default_na=False,
                on_bad_lines="skip",
                nrows=MAX_ROWS + 10,
            )
        except Exception as e:
            raise IngestError(f"Failed to read CSV file: {e}")
    else:
        raise IngestError(
            f"Unsupported file format '{filename_ext}'. "
            "Only .csv and .xlsx are supported."
        )

    # Clean up
    df = df.fillna("").astype(str)

    # Drop completely empty rows
    df = df.loc[~(df.apply(lambda r: "".join(str(c) for c in r).strip() == "", axis=1))]

    if df.empty:
        raise IngestError("The file has no data.")

    if df.shape[1] > MAX_COLS:
        raise IngestError(
            f"Too many columns ({df.shape[1]}). Limit is {MAX_COLS}."
        )

    if df.shape[0] > MAX_ROWS + 1:
        raise IngestError(
            f"Too many rows ({df.shape[0]}). Limit is {MAX_ROWS} data rows."
        )

    # Find header row
    header_idx = _find_header_row(df)
    headers_raw = [str(h).strip() or f"column_{i+1}" for i, h in enumerate(df.iloc[header_idx])]
    headers = _dedupe(headers_raw)

    # Build rows
    rows: list[dict] = []
    for idx, r in df.iloc[header_idx + 1:].iterrows():
        row_cells = dict(zip(headers, [str(c) for c in r]))
        # Skip completely empty data rows
        if all(v.strip() == "" for v in row_cells.values()):
            continue
        rows.append({"row_id": int(idx) + 1, "cells": row_cells})

    if not rows:
        raise IngestError("Found headers but no data rows.")

    return headers, rows

