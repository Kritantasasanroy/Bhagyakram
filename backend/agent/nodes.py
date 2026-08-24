from __future__ import annotations

import re
import time
from collections import Counter
from datetime import date
from typing import Literal

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from agent.llm import get_llm, rotate_key, key_count
from agent.prompts import build_system_prompt
from agent.state import AgentState
from agent.tools.birth_chart import compute_birth_chart
from agent.tools.geocode import geocode_place
from agent.tools.knowledge import knowledge_lookup
from agent.tools.transits import get_daily_transits

try:
    from langgraph.types import interrupt
    _HITL_AVAILABLE = True
except ImportError:
    _HITL_AVAILABLE = False

TOOLS = [geocode_place, compute_birth_chart, get_daily_transits, knowledge_lookup]

STEP_LIMIT = 6

# Per-tool ceilings. Without these the model tends to call knowledge_lookup once
# per placement (Sun, Moon, rising, MC…), looping until the step limit and leaving
# no room to actually write the reading. One combined lookup is enough.
_TOOL_CAPS = {
    "geocode_place": 1,
    "compute_birth_chart": 1,
    "get_daily_transits": 1,
    "knowledge_lookup": 1,
}


def _allowed_tools(used: list[str]) -> list:
    """Return the subset of tools that haven't hit their per-tool cap yet."""
    counts = Counter(used)
    return [t for t in TOOLS if counts[t.name] < _TOOL_CAPS.get(t.name, 1)]


def _text_of(content) -> str:
    """Normalise a message's content to a plain string.

    Some LLM providers return content as a list of typed parts, e.g.
    [{"type": "text", "text": "…"}], rather than a plain string.
    Treating the list form as 'empty' is what made finished readings vanish into
    the rate-limit fallback, so every consumer must normalise first.
    """
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(
            p.get("text", "") if isinstance(p, dict) else str(p) for p in content
        )
    return ""


# A real chart needs a real date and place. The form sometimes posts empty strings
# (an untouched form), so an empty-but-present dict still counts as "no details".
def _has_usable_birth_details(bd) -> bool:
    if not bd:
        return False
    date = (bd.get("date") or "").strip()
    place = (bd.get("place") or "").strip()
    return bool(date and place)


# Phrases that signal a request for the user's OWN reading ("read ME"), as opposed
# to a general astrology question ("what is a rising sign?"). The router's intent
# is too coarse to use here , it tags any mention of "sign"/"house" as chart_request,
# which would wrongly trip on definitional questions. We require a personal anchor.
_PERSONAL_CHART_RE = re.compile(
    r"\bmy\b[^.?!]{0,40}\b("
    r"chart|rising|ascendant|sun|moon|placements?|natal|signs?|horoscope|houses?|"
    r"big three|venus|mars|mercury|saturn|jupiter|pluto|career|love life|"
    r"relationship|marriage|future|destiny|personality"
    r")\b"
    r"|\bread (me|my chart|my birth)\b"
    r"|\bwhat'?s my (sign|rising|moon|sun|chart|horoscope)\b",
    re.IGNORECASE,
)

# If the message itself carries birth info (a year, a date, or "born …"), the agent
# can resolve it with the geocode/compute tools , so don't short-circuit on it.
_BIRTH_INFO_RE = re.compile(
    r"\b(18|19|20)\d{2}\b"
    r"|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b"
    r"|\bborn\b",
    re.IGNORECASE,
)


def _needs_birth_data(state: AgentState) -> bool:
    """True when the user is asking for their own reading but supplied nothing to read."""
    last_human = next(
        (m for m in reversed(state["messages"]) if m.type == "human"), None
    )
    text = _text_of(last_human.content) if last_human else ""
    if _BIRTH_INFO_RE.search(text):
        return False  # details are in the message itself; let the tools handle it
    return bool(_PERSONAL_CHART_RE.search(text))


_NEED_DETAILS = (
    "I'd love to read your chart, but I don't have your birth details yet, so I "
    "can't see your actual sky. Share your date of birth and the place you were "
    "born (and the time, if you know it) in the birth details form, and I'll "
    "compute your real chart and answer this properly. Without them I'd only be "
    "guessing at your placements, and I won't do that to you."
)

_SAFETY_PATTERNS = [
    r"you will (get|develop|have) (cancer|diabetes|a disease|an illness|a tumor)",
    r"you (have|will have) (cancer|a terminal|a fatal)",
    r"you will die (on|at|in|from|of)",
    r"(your death|death will occur|time of death)",
    r"(guaranteed (return|profit|income)|you should (buy|sell|invest) (on|at) \w+ \d)",
]

_DISCLAIMER = (
    "\n\n*A note: astrology offers reflection and possibility, not certainty. "
    "For medical, legal, or financial decisions, please consult the right professionals.*"
)

_RATE_LIMIT_FALLBACK = (
    "I'm sorry, the stars are a little crowded right now and I couldn't finish "
    "that reading. This is usually a brief rate limit on the free model. Please "
    "give it a few seconds and ask me again."
)

# Short flat refusals are the model's own safety layer firing before our persona can respond.
_FLAT_REFUSAL_PHRASES = [
    "i'm sorry, but i can't",
    "i cannot provide",
    "i'm not able to provide",
    "sorry, i can't",
    "i apologize, but i can't",
]

# The model often writes typographic quotes (’) instead of straight ones (') , normalise
# before matching _FLAT_REFUSAL_PHRASES so a curly apostrophe doesn't defeat the check.
_QUOTE_NORMALIZE = str.maketrans({"’": "'", "‘": "'", "“": '"', "”": '"'})


def _normalize_quotes(text: str) -> str:
    return text.translate(_QUOTE_NORMALIZE)

_INJECTION_REPLY = (
    "That framing isn't one I can step into , I read the sky as it is, for reflection "
    "and pattern, not for guarantees. If you'd like to look at what your birth chart "
    "actually says about finances, opportunity, or the year ahead, I'm genuinely here "
    "for that kind of reading."
)

# HITL gate: fire on explicit death-timing questions before the reading begins.
_DEATH_GATE_RE = re.compile(
    r"\b(when|how long|at what age|predict|tell.*when|time of death)\b.*\b(die|death|dying)\b"
    r"|\b(die|death)\b.*\b(when|how long|at what age|predict|timing)\b",
    re.IGNORECASE | re.DOTALL,
)

_EDITOR_SYSTEM = """\
You are reviewing a response you wrote as Bhagyakram AI, a warm astrology companion. \
If any part sounds cold, overly definitive about uncertain outcomes, or potentially \
alarming, gently rephrase just that part , keep all chart facts, planetary positions, \
degree values, and specific insights exactly as they are. If the tone is already warm \
and grounded, return the response unchanged. Return only the response text, no commentary.\
"""


def router_node(state: AgentState) -> dict:
    last_human = next(
        (m for m in reversed(state["messages"]) if m.type == "human"), None
    )
    text = last_human.content.lower() if last_human else ""

    # off-topic is checked first , "what's the weather today?" contains "today"
    # but should not be classified as a horoscope request
    if any(w in text for w in ["recipe", "weather", "sports", "news", "movie", "code", "program"]):
        intent = "off_topic"
    elif any(w in text for w in ["chart", "birth", "natal", "rising", "ascendant", "house", "sign", "placement"]):
        intent = "chart_request"
    elif any(w in text for w in ["today", "horoscope", "transit", "energy", "retrograde", "this week", "right now"]):
        intent = "daily_horoscope"
    else:
        intent = "freeform"

    return {"intent": intent}


def sensitivity_gate_node(state: AgentState) -> dict:
    """HITL: pause before readings that touch on death or life-timing questions.

    Uses LangGraph's interrupt() to pause graph execution and wait for the user
    to confirm they want a reading framed around transformation rather than literal
    death timing. If the user declines, a warm redirect is returned instead.
    """
    if not _HITL_AVAILABLE:
        return {}

    last_human = next(
        (m for m in reversed(state["messages"]) if m.type == "human"), None
    )
    text = last_human.content if last_human else ""

    if _DEATH_GATE_RE.search(text):
        decision = interrupt({
            "question": (
                "Your question touches on endings and timing. Before I read your chart "
                "around this, I want to be clear: what I can offer is reflection on themes "
                "of transformation and cycles , not literal predictions of when. "
                "Shall I read it in that spirit?"
            ),
        })
        if not decision.get("confirmed", True):
            return {"messages": [AIMessage(
                content=(
                    "Of course , no pressure at all. I'm here whenever you're ready. "
                    "You can ask about your chart, today's transits, or any other part "
                    "of your sky."
                )
            )]}
    return {}


def after_gate(state: AgentState) -> Literal["reasoning", "safety"]:
    """If sensitivity_gate produced a cancellation message, route to safety. Otherwise reason."""
    last = state["messages"][-1] if state["messages"] else None
    if last and getattr(last, "type", None) == "ai":
        return "safety"
    return "reasoning"


def _is_rate_limit(e: Exception) -> bool:
    s = str(e).lower()
    return (
        "429" in str(e)
        or "rate" in s
        or "quota" in s
        or "capacity" in s
        or "overloaded" in s
        or "ratelimit" in type(e).__name__.lower()
        or "toomanyrequests" in type(e).__name__.lower()
    )


def _invoke_with_backoff(llm_factory, messages, attempts: int | None = None):
    """Retry on any error: rotate to the next API key on every failure.

    Rotates on ALL errors (not just 429s) so that auth failures, model
    unavailability, and connection errors are all healed by trying the next key.
    Defaults to trying every key in the pool at least once (min 3 attempts).

    On a confirmed rate-limit, sleeps briefly even when rotating to a different
    key. Groq's per-key TPM budget is small enough (8K on the free tier) that a
    short burst of verbose readings can exhaust several keys' windows within the
    same minute; the token bucket itself refills in well under a second, so a
    short pause between attempts recovers a burst that immediate rotation alone
    cannot. The single-key case still gets the longer delays since there's no
    other key to fall back to while it cools down.
    """
    _attempts = attempts if attempts is not None else max(key_count(), 3)
    single_key_delays = [5, 15]
    multi_key_delay = 2
    last_err = None
    for i in range(_attempts):
        try:
            return llm_factory().invoke(messages)
        except Exception as e:
            last_err = e
            rl = _is_rate_limit(e)
            print(f"[llm] attempt {i+1}/{_attempts} failed ({type(e).__name__}): {str(e)[:200]}")
            if i == _attempts - 1:
                raise
            rotate_key()
            if rl:
                if key_count() == 1:
                    time.sleep(single_key_delays[min(i, len(single_key_delays) - 1)])
                else:
                    time.sleep(multi_key_delay)
    raise last_err  # pragma: no cover


def reasoning_node(state: AgentState) -> dict:
    # Hard guard: a personal reading needs real birth data. If we have neither a
    # computed chart nor usable birth details , and the user didn't supply any in
    # the message , never let the model invent a chart. Ask for the details instead.
    if (
        not state.get("birth_chart")
        and not _has_usable_birth_details(state.get("birth_details"))
        and (state.get("intent") == "chart_request" or _needs_birth_data(state))
    ):
        return {
            "messages": [AIMessage(content=_NEED_DETAILS)],
            "step_count": state["step_count"] + 1,
        }

    today = date.today().isoformat()
    system_content = build_system_prompt(
        today=today,
        birth_details=state.get("birth_details"),
        birth_chart=state.get("birth_chart"),
    )

    # Bind only the tools that still have budget. Once geocoding, the chart,
    # transits, and one knowledge lookup are spent , or we're at the last allowed
    # step , we call with NO tools bound, which forces the model to stop gathering
    # and actually write the reading instead of looping into a blank response.
    used = state.get("tool_calls_made", [])
    allowed = _allowed_tools(used)

    # If the chart is already known (pre-computed from the form or cached from an
    # earlier turn), there's nothing to geocode or recompute , drop those tools so
    # the model goes straight to interpreting instead of burning a request on them.
    if state.get("birth_chart"):
        allowed = [t for t in allowed if t.name not in ("geocode_place", "compute_birth_chart")]

    at_last_step = state["step_count"] >= STEP_LIMIT - 1

    def _make_llm():
        llm = get_llm(temperature=0.7)
        if allowed and not at_last_step:
            return llm.bind_tools(allowed)
        return llm

    messages = [SystemMessage(content=system_content)] + list(state["messages"])

    try:
        response = _invoke_with_backoff(_make_llm, messages)
    except Exception as primary_err:
        print(f"[reasoning] primary model exhausted: {primary_err}")
        # Fallback: try the small fast model — no tools, just a plain reading.
        try:
            def _make_small_llm():
                return get_llm(temperature=0.7, model="llama-3.1-8b-instant")
            response = _invoke_with_backoff(_make_small_llm, messages, attempts=max(key_count(), 2))
            print("[reasoning] fallback model succeeded")
        except Exception as fallback_err:
            print(f"[reasoning] fallback model also failed: {fallback_err}")
            fallback = AIMessage(content=_RATE_LIMIT_FALLBACK)
            fallback.additional_kwargs["degraded"] = True
            return {
                "messages": [fallback],
                "step_count": state["step_count"] + 1,
            }

    tool_names = [tc["name"] for tc in (getattr(response, "tool_calls", None) or [])]

    # Coerce list-of-parts content into a plain string so the safety node,
    # session store, and streaming remainder all see real text rather than treating
    # a finished reading as empty.
    if not isinstance(response.content, str):
        response.content = _text_of(response.content)

    return {
        "messages": [response],
        "step_count": state["step_count"] + 1,
        "tool_calls_made": list(state.get("tool_calls_made", [])) + tool_names,
    }


def editor_node(state: AgentState) -> dict:
    """Second-agent handoff: a light editor pass that softens tone on full readings.

    Only fires for chart_request and freeform answers longer than 500 characters ,
    short safety refusals and off-topic redirects pass straight through. The editor
    preserves every chart fact and planetary value; it only rewrites phrasing that
    reads cold or overly certain.

    Its model call is tagged "editor" so the API keeps these tokens out of the live
    stream (the reading has already streamed once) and sends the polished version as
    a single replace event instead. The new message reuses the original message id,
    so add_messages swaps it in place rather than appending a second assistant turn.
    """
    if state.get("intent") not in ("chart_request", "freeform"):
        return {}

    last = state["messages"][-1] if state["messages"] else None
    if last is None or getattr(last, "type", None) != "ai":
        return {}

    content = last.content
    if not isinstance(content, str) or len(content) < 500:
        return {}

    messages = [SystemMessage(content=_EDITOR_SYSTEM), HumanMessage(content=content)]
    try:
        response = _invoke_with_backoff(
            lambda: get_llm(temperature=0.2, model="llama-3.1-8b-instant").with_config({"tags": ["editor"]}),
            messages,
            attempts=2,
        )
        polished = _text_of(response.content).strip()
    except Exception:
        return {}

    if polished and polished != content.strip():
        return {"messages": [AIMessage(content=polished, id=getattr(last, "id", None))]}
    return {}


def safety_node(state: AgentState) -> dict:
    if state.get("intent") == "off_topic":
        reply = AIMessage(
            content=(
                "That's a bit outside my world , I'm here as your astrology companion. "
                "If you'd like to explore your birth chart, what the transits are doing, "
                "or what the planets might be saying about any part of your life, I'm all yours."
            )
        )
        return {"messages": [reply]}

    last = state["messages"][-1] if state["messages"] else None
    if last is None or getattr(last, "type", None) != "ai":
        return {}

    content = _text_of(last.content)

    # Last-resort guard: if the reasoning loop ended on a message with no prose
    # (e.g. an unresolved tool call after the step limit), never show a blank
    # bubble , give the person a warm, actionable nudge instead.
    if not content.strip():
        return {"messages": [AIMessage(content=(
            "I gathered your chart but ran out of room to finish the reading in one pass. "
            "Ask me once more , about your career, a specific planet, or today's transits , "
            "and I'll lay it out for you."
        ))]}

    # The underlying model occasionally fires its own content policy with a flat short
    # refusal before our persona can respond. Convert those into an in-character Bhagyakram AI
    # reply so the person still gets a warm response.
    normalized = _normalize_quotes(content).lower()
    if len(content) < 120 and any(p in normalized for p in _FLAT_REFUSAL_PHRASES):
        return {"messages": [AIMessage(content=_INJECTION_REPLY)]}

    flagged = any(re.search(p, content, re.IGNORECASE) for p in _SAFETY_PATTERNS)
    if flagged and _DISCLAIMER not in content:
        return {"messages": [AIMessage(content=content + _DISCLAIMER)]}

    return {}


def should_use_tools(state: AgentState) -> Literal["tools", "safety"]:
    last = state["messages"][-1] if state["messages"] else None
    has_tool_calls = bool(getattr(last, "tool_calls", None))
    over_limit = state["step_count"] >= STEP_LIMIT

    if has_tool_calls and not over_limit:
        return "tools"
    return "safety"
