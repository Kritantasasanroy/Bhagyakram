from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

# Groq models
_GROQ_DEFAULT = "llama-3.3-70b-versatile"
_GROQ_EDITOR  = "llama-3.1-8b-instant"   # fast, cheap, good enough for tone edits


def get_llm(temperature: float = 0.7, model: str | None = None):
    """Return a Groq-backed ChatLLM."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "GROQ_API_KEY is required. Get a free key at https://console.groq.com"
        )

    from langchain_groq import ChatGroq

    resolved = model or os.getenv("LLM_MODEL", _GROQ_DEFAULT)
    return ChatGroq(
        model=resolved,
        api_key=api_key,
        temperature=temperature,
        max_tokens=2048,
    )
