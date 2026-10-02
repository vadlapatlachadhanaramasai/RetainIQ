
"""Optional Google Cloud Storage backup of uploaded customer CSVs.

Every POST /analyze upload is already processed entirely in-memory (see
pipeline.analyze_dataframe) and never required to touch disk or the cloud.
This module adds an optional side-channel copy of the raw upload to a GCS
bucket for audit/backup purposes. If no bucket is configured (or the GCS
call fails for any reason — missing credentials, no network, etc.), uploads
are skipped silently and logged; the analyze flow must never depend on this
succeeding.
"""
import logging
import os
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

_BUCKET_NAME = os.environ.get("RETAINIQ_GCS_BUCKET")
_client = None


def _get_bucket():
    global _client
    if not _BUCKET_NAME:
        return None
    if _client is None:
        from google.cloud import storage

        _client = storage.Client()
    return _client.bucket(_BUCKET_NAME)


def upload_csv(filename: str, raw_bytes: bytes) -> str | None:
    """Upload raw CSV bytes to gs://<bucket>/uploads/<timestamp>_<filename>.

    Returns the gs:// URI on success, or None if GCS isn't configured or
    the upload failed (never raises).
    """
    try:
        bucket = _get_bucket()
        if bucket is None:
            return None
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        blob_name = f"uploads/{timestamp}_{filename}"
        bucket.blob(blob_name).upload_from_string(raw_bytes, content_type="text/csv")
        return f"gs://{_BUCKET_NAME}/{blob_name}"
    except Exception:
        logger.exception("GCS upload failed for %s; continuing without backup", filename)
        return None