import pdfplumber


class PDFExtractionError(Exception):
    pass


def extract_text(file_bytes: bytes) -> str:
    """Extract raw text from a PDF. Raises PDFExtractionError if no text is found
    (e.g. a scanned/image-only PDF), rather than silently returning an empty string."""
    import io

    text_parts: list[str] = []
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
    except Exception as exc:
        raise PDFExtractionError(f"Could not read PDF: {exc}") from exc

    full_text = "\n".join(text_parts).strip()
    if not full_text:
        raise PDFExtractionError(
            "No extractable text found. The PDF may be a scanned image with no text layer."
        )
    return full_text
