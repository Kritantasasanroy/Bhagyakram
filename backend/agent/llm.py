from __future__ import annotations

import os
import threading
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

_GROQ_DEFAULT = "llama-3.3-70b-versatile"
_GROQ_EDITOR  = "llama-3.1-8b-instant"

_lock = threading.Lock()
_keys: list[str] = []
_key_idx: int = 0


def _load_keys() -> list[str]:
    """Collect all Groq keys from env.

    Supports two formats (can be combined):
      - GROQ_API_KEY=key1,key2,key3      (comma-separated, handy for local .env)
      - GROQ_API_KEY=key1                (original single-key form)
        GROQ_API_KEY_2=key2              (numbered, handy for HF Spaces secrets)
        GROQ_API_KEY_3=key3
    """
    keys: list[str] = []
    for k in os.getenv("GROQ_API_KEY", "").split(","):
        k = k.strip()
        if k and k not in keys:
            keys.append(k)
    for i in range(2, 20):
        k = os.getenv(f"GROQ_API_KEY_{i}", "").strip()
        if not k:
            break
        if k not in keys:
            keys.append(k)
    return keys


def _ensure_keys() -> list[str]:
    global _keys
    if not _keys:
        _keys = _load_keys()
        if not _keys:
            raise EnvironmentError(
                "GROQ_API_KEY is required. Get a free key at https://console.groq.com"
            )
    return _keys


def rotate_key() -> None:
    """Advance to the next API key in the pool (called on a 429)."""
    global _key_idx
    with _lock:
        keys = _ensure_keys()
        _key_idx = (_key_idx + 1) % len(keys)


def key_count() -> int:
    """Number of keys available in the pool."""
    return len(_ensure_keys())


def get_llm(temperature: float = 0.7, model: str | None = None):
    """Return a Groq-backed ChatLLM using the current key in the rotation."""
    from langchain_groq import ChatGroq

    keys = _ensure_keys()
    with _lock:
        key = keys[_key_idx]

    resolved = model or os.getenv("LLM_MODEL", _GROQ_DEFAULT)
    return ChatGroq(
        model=resolved,
        api_key=key,
        temperature=temperature,
        max_tokens=2048,
    )
