from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock, patch

from app.pipeline.google_image import (
    _extract_image_bytes,
    generate_scene_preview_image_sync,
)


def test_extract_image_bytes_from_inline_data():
    part = MagicMock()
    part.inline_data.data = b"image-bytes"
    candidate = MagicMock()
    candidate.content.parts = [part]
    response = MagicMock(candidates=[candidate])
    assert _extract_image_bytes(response) == b"image-bytes"


def test_extract_image_bytes_raises_when_missing():
    response = MagicMock(candidates=[])
    try:
        _extract_image_bytes(response)
    except RuntimeError as exc:
        assert "no image bytes" in str(exc).lower()
    else:
        raise AssertionError("expected RuntimeError")


def test_generate_scene_preview_image_sync_writes_file(tmp_path, monkeypatch):
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    monkeypatch.setenv("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image")

    inline = MagicMock()
    inline.data = b"png-data"
    part = MagicMock(inline_data=inline)
    candidate = MagicMock()
    candidate.content.parts = [part]
    response = MagicMock(candidates=[candidate])

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = response

    out = tmp_path / "act-02.png"
    with patch("google.genai.Client", return_value=mock_client):
        result = generate_scene_preview_image_sync(
            "A kitchen morning scene",
            out,
            act_num=2,
            persona_id="demo",
            world_slug="kitchen-morning",
        )

    assert result == out
    assert out.read_bytes() == b"png-data"
    meta = out.parent / ".act-02-preview-request.json"
    assert meta.is_file()
    assert "google-gemini" in meta.read_text(encoding="utf-8")
