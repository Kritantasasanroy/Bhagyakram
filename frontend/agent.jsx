/* global React */
/* Agent transport , connects to the FastAPI SSE endpoint at /chat.

   SSE events handled:
     token               - streamed text chunk  (field: content)
     replace             - swap the message for an edited version (field: content)
     tool_start          - tool activity badge  (field: tool)
     tool_end            - dismiss badge
     confirmation_needed - pause for a human-in-the-loop confirmation
     done                - stream complete
     error               - surface error to user
*/

const ENDPOINT = "/chat";

const TOOL_LABELS = {
  geocode_place: "locating your birthplace",
  compute_birth_chart: "computing your birth chart",
  get_daily_transits: "reading today's sky",
  knowledge_lookup: "consulting the stars",
};

function prettifyTool(name) {
  return TOOL_LABELS[name] || (name || "working").replace(/_/g, " ");
}

async function drainSSE(url, body, h, signal) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    if (signal.cancelled) { reader.cancel(); return; }
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split("\n\n");
    buffer = frames.pop();

    for (const frame of frames) {
      const line = frame.split("\n").find(l => l.startsWith("data:"));
      if (!line) continue;
      let evt;
      try { evt = JSON.parse(line.slice(5).trim()); } catch { continue; }

      if (evt.type === "token") {
        h.onToken(evt.content ?? evt.value ?? evt.token ?? "");
      } else if (evt.type === "replace") {
        if (h.onReplace) h.onReplace(evt.content ?? "");
      } else if (evt.type === "chart_start") {
        if (h.onChartStart) h.onChartStart();
      } else if (evt.type === "chart") {
        if (h.onChart) h.onChart(evt.chart);
      } else if (evt.type === "tool_start") {
        h.onToolStart(prettifyTool(evt.tool || evt.label || evt.name));
      } else if (evt.type === "tool_end") {
        h.onToolEnd();
      } else if (evt.type === "confirmation_needed") {
        if (h.onConfirmationNeeded) h.onConfirmationNeeded(evt);
      } else if (evt.type === "done") {
        h.onDone();
        return;
      } else if (evt.type === "error") {
        h.onError(evt.message || "Something went wrong. Please try again.");
        return;
      }
    }
  }
  h.onDone();
}

function runResume(resumePayload, handlers) {
  const signal = { cancelled: false };
  (async () => {
    try {
      await drainSSE("/resume", {
        thread_id: resumePayload.thread_id,
        session_id: resumePayload.session_id,
        confirmed: resumePayload.confirmed,
        birth_details: resumePayload.birth_details,
      }, handlers, signal);
    } catch {
      handlers.onError("Could not resume the reading. Please try again.");
    }
  })();
  return () => { signal.cancelled = true; };
}

function runAgent(payload, handlers) {
  const signal = { cancelled: false };
  (async () => {
    try {
      await drainSSE(ENDPOINT, {
        message: payload.message,
        session_id: payload.session_id,
        birth_details: payload.birth_details,
      }, handlers, signal);
    } catch {
      handlers.onError("Unable to reach the server. Please check your connection and try again.");
    }
  })();
  return () => { signal.cancelled = true; };
}

window.runAgent = runAgent;
window.runResume = runResume;
