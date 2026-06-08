from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

# Default models per provider
_GROQ_DEFAULT = "llama-3.3-70b-versatile"
_GROQ_EDITOR  = "llama-3.1-8b-instant"   # fast, cheap , good enough for tone edits
_GEMINI_DEFAULT = "gemini-2.0-flash"


def get_llm(temperature: float = 0.7, model: str | None = None):
    groq_key = os.getenv("GROQ_API_KEY")

    if groq_key:
        from langchain_groq import ChatGroq
        resolved = model or os.getenv("LLM_MODEL", _GROQ_DEFAULT)
        return ChatGroq(
            model=resolved,
            api_key=groq_key,
            temperature=temperature,
            max_tokens=2048,
        )

    # Fallback: Gemini
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "Set GROQ_API_KEY (groq.com) or GEMINI_API_KEY (aistudio.google.com) in backend/.env"
        )
    from langchain_google_genai import ChatGoogleGenerativeAI
    resolved = model or os.getenv("LLM_MODEL", _GEMINI_DEFAULT)
    return ChatGoogleGenerativeAI(
        model=resolved,
        google_api_key=api_key,
        temperature=temperature,
        max_output_tokens=2048,
    )
