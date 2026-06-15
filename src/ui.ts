export const UI_HTML = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="Cloudflare AI Gateway demo — Dynamic Routing, caching, spend limits, metadata, retries, and observability.">
<title>AI Gateway Demo</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #0d0f17;
    --bg2:       #13162080;
    --bg3:       #1a1e2e;
    --border:    #2a2f45;
    --orange:    #f6821f;
    --orange2:   #f9a85040;
    --text:      #e2e6f3;
    --muted:     #7a8099;
    --hit:       #22c55e;
    --miss:      #6b7280;
    --bypass:    #f59e0b;
    --expired:   #ef4444;
    --radius:    10px;
    --shadow:    0 4px 24px #00000060;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    height: 100dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* ── Header ── */
  header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 20px;
    height: 52px;
    background: #0d0f17;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    z-index: 10;
  }
  .logo { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 15px; }
  .logo svg { color: var(--orange); }
  .logo-sub { font-size: 11px; font-weight: 400; color: var(--muted); margin-left: 4px; }
  header .spacer { flex: 1; }
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg3); color: var(--text); font-size: 13px; cursor: pointer; transition: background .15s, border-color .15s; }
  .btn:hover { background: #22273a; border-color: #3a4060; }
  .btn-orange { background: var(--orange); border-color: var(--orange); color: #fff; font-weight: 600; }
  .btn-orange:hover { background: #e07419; }

  /* ── Layout ── */
  .layout {
    display: grid;
    grid-template-columns: 260px 1fr 300px;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  /* ── Panels ── */
  .panel { display: flex; flex-direction: column; overflow: hidden; }
  .panel-left  { border-right: 1px solid var(--border); }
  .panel-right { border-left:  1px solid var(--border); }
  .panel-title {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: var(--muted);
    padding: 12px 14px 8px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .panel-body { flex: 1; overflow-y: auto; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }
  .panel-body::-webkit-scrollbar { width: 4px; }
  .panel-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  /* ── Left panel ── */
  .field-row { display: flex; flex-direction: column; gap: 4px; }
  .field-label { font-size: 11px; color: var(--muted); font-weight: 500; }
  input, select, textarea {
    background: var(--bg3); border: 1px solid var(--border); border-radius: 6px;
    color: var(--text); font-size: 13px; padding: 6px 9px; width: 100%;
    outline: none; transition: border-color .15s;
    font-family: inherit;
  }
  input:focus, select:focus, textarea:focus { border-color: var(--orange); }
  select { cursor: pointer; }

  .meta-editor { display: flex; flex-direction: column; gap: 6px; }
  .meta-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 4px; align-items: center; }
  .meta-row input { font-size: 12px; padding: 5px 7px; }
  .meta-del { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 16px; line-height: 1; padding: 2px 4px; border-radius: 4px; }
  .meta-del:hover { color: var(--expired); background: #ef444420; }

  .divider { height: 1px; background: var(--border); margin: 4px 0; }

  .scenario-btn {
    display: block; width: 100%; text-align: left; padding: 8px 10px;
    background: var(--bg3); border: 1px solid var(--border); border-radius: 7px;
    color: var(--text); font-size: 12px; cursor: pointer; transition: all .15s;
    line-height: 1.4;
  }
  .scenario-btn:hover { border-color: var(--orange); background: var(--orange2); }
  .scenario-btn strong { display: block; font-size: 12px; margin-bottom: 2px; }
  .scenario-btn span { color: var(--muted); font-size: 11px; }

  /* ── Chat panel ── */
  .chat-messages {
    flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px;
  }
  .chat-messages::-webkit-scrollbar { width: 4px; }
  .chat-messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .msg { display: flex; flex-direction: column; gap: 4px; max-width: 85%; }
  .msg.user { align-self: flex-end; align-items: flex-end; }
  .msg.assistant { align-self: flex-start; }
  .msg-bubble {
    padding: 10px 14px; border-radius: var(--radius); font-size: 14px; line-height: 1.55;
    word-break: break-word; white-space: pre-wrap;
  }
  .msg.user .msg-bubble { background: var(--orange); color: #fff; border-bottom-right-radius: 3px; }
  .msg.assistant .msg-bubble { background: var(--bg3); border: 1px solid var(--border); border-bottom-left-radius: 3px; }
  .msg-meta { font-size: 10px; color: var(--muted); display: flex; gap: 8px; align-items: center; padding: 0 4px; }
  .cache-badge {
    font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 9px; letter-spacing: .04em;
  }
  .cache-HIT     { background: #22c55e20; color: var(--hit); }
  .cache-MISS    { background: #6b728020; color: #9ca3af; }
  .cache-BYPASS  { background: #f59e0b20; color: var(--bypass); }
  .cache-EXPIRED { background: #ef444420; color: var(--expired); }
  .cache-UNKNOWN { background: #6b728020; color: #9ca3af; }

  .msg-thinking { color: var(--muted); font-style: italic; animation: pulse 1.2s ease-in-out infinite; }
  @keyframes pulse { 0%,100% { opacity: .4; } 50% { opacity: 1; } }

  .chat-input-bar {
    border-top: 1px solid var(--border); padding: 12px 16px; display: flex; gap: 8px; flex-shrink: 0;
  }
  .chat-input {
    flex: 1; resize: none; min-height: 40px; max-height: 120px; padding: 9px 12px;
    font-size: 14px; line-height: 1.4; border-radius: 8px; overflow-y: auto;
  }
  .send-btn {
    align-self: flex-end; padding: 9px 16px; background: var(--orange); border: none;
    border-radius: 8px; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer;
    transition: background .15s; flex-shrink: 0;
  }
  .send-btn:hover:not(:disabled) { background: #e07419; }
  .send-btn:disabled { opacity: .45; cursor: not-allowed; }

  /* ── Right panel — Gateway Info ── */
  .info-section { display: flex; flex-direction: column; gap: 6px; }
  .info-kv { display: grid; grid-template-columns: 90px 1fr; gap: 4px 10px; font-size: 12px; }
  .info-k { color: var(--muted); font-size: 11px; align-self: start; padding-top: 1px; }
  .info-v { font-family: ui-monospace, monospace; font-size: 12px; word-break: break-all; }
  .info-v.clickable { cursor: pointer; display: flex; align-items: center; gap: 4px; }
  .info-v.clickable:hover { color: var(--orange); }
  .copy-icon { font-size: 11px; opacity: .6; }

  .latency { font-variant-numeric: tabular-nums; }

  .badge-cache {
    display: inline-flex; align-items: center; gap: 5px; font-weight: 700;
    font-size: 12px; padding: 2px 8px; border-radius: 8px;
  }
  .dot { width: 7px; height: 7px; border-radius: 50%; }

  .feedback-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .fb-btn {
    font-size: 18px; background: var(--bg3); border: 1px solid var(--border);
    border-radius: 7px; padding: 4px 10px; cursor: pointer; transition: all .15s;
  }
  .fb-btn:hover { border-color: var(--orange); }
  .fb-btn.active-pos { border-color: var(--hit); background: #22c55e20; }
  .fb-btn.active-neg { border-color: var(--expired); background: #ef444420; }
  .score-input { width: 56px; }
  .fb-submit { font-size: 12px; padding: 5px 10px; }
  .fb-status { font-size: 11px; color: var(--hit); }

  .empty-state {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    color: var(--muted); gap: 8px; text-align: center; padding: 20px;
  }
  .empty-state svg { opacity: .3; }
  .empty-state p { font-size: 13px; line-height: 1.5; }

  /* ── Settings modal ── */
  .modal-backdrop {
    display: none; position: fixed; inset: 0; background: #00000080;
    z-index: 100; align-items: flex-start; justify-content: flex-end;
  }
  .modal-backdrop.open { display: flex; }
  .modal {
    width: 380px; background: #181c2c; border-left: 1px solid var(--border);
    height: 100dvh; overflow-y: auto; display: flex; flex-direction: column;
  }
  .modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 16px; border-bottom: 1px solid var(--border); flex-shrink: 0;
  }
  .modal-title { font-weight: 700; font-size: 14px; }
  .modal-close { background: none; border: none; color: var(--muted); font-size: 20px; cursor: pointer; padding: 2px 6px; border-radius: 4px; }
  .modal-close:hover { color: var(--text); }
  .modal-body { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
  .modal-section { display: flex; flex-direction: column; gap: 8px; }
  .modal-section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
  .toggle-row { display: flex; align-items: center; justify-content: space-between; font-size: 13px; }
  .toggle { position: relative; width: 36px; height: 20px; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle-slider { position: absolute; inset: 0; background: var(--border); border-radius: 10px; cursor: pointer; transition: .2s; }
  .toggle-slider::before { content: ""; position: absolute; left: 3px; top: 3px; width: 14px; height: 14px; background: #fff; border-radius: 50%; transition: .2s; }
  .toggle input:checked + .toggle-slider { background: var(--orange); }
  .toggle input:checked + .toggle-slider::before { transform: translateX(16px); }

  /* preset chips */
  .presets { display: flex; flex-wrap: wrap; gap: 5px; }
  .preset-chip {
    padding: 3px 9px; background: var(--bg3); border: 1px solid var(--border);
    border-radius: 5px; font-size: 11px; font-family: ui-monospace, monospace;
    cursor: pointer; color: var(--muted); transition: all .15s;
  }
  .preset-chip:hover { border-color: var(--orange); color: var(--text); }

  /* extra headers */
  .extra-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 4px; }
  .extra-row input { font-size: 11px; padding: 5px 7px; }

  /* traffic gen */
  .gen-controls { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .gen-controls input[type=number] { width: 60px; }
  .gen-log { font-size: 11px; font-family: ui-monospace, monospace; color: var(--muted); max-height: 120px; overflow-y: auto; line-height: 1.6; }

  /* ── Tooltip (Log ID copy) ── */
  .copied-tip { font-size: 11px; color: var(--hit); margin-left: 4px; }

  @media (max-width: 900px) {
    .layout { grid-template-columns: 1fr; grid-template-rows: auto 1fr auto; }
    .panel-left, .panel-right { border: none; border-bottom: 1px solid var(--border); max-height: 260px; }
  }
</style>
</head>
<body>

<!-- ── Header ── -->
<header>
  <div class="logo">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
    AI Gateway Demo
    <span class="logo-sub">Cloudflare</span>
  </div>
  <div class="spacer"></div>
  <button class="btn" onclick="openSettings()">⚙ Settings</button>
</header>

<!-- ── Main layout ── -->
<div class="layout">

  <!-- LEFT: metadata + scenarios -->
  <div class="panel panel-left">
    <div class="panel-title">Request Config</div>
    <div class="panel-body">

      <div class="field-row">
        <div class="field-label">Model <span style="color:var(--muted);font-size:10px">(Workers AI — no API key needed)</span></div>
        <input id="model-input" value="workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast" placeholder="workers-ai/@cf/... or dynamic/route-name">
        <div class="presets" id="model-presets" style="margin-top:4px"></div>
      </div>

      <div class="divider"></div>

      <div class="field-label">Metadata <span style="color:var(--muted);font-size:10px">(max 5)</span></div>
      <div class="meta-editor" id="meta-editor"></div>
      <button class="btn" style="font-size:12px" onclick="addMetaRow()">+ Add field</button>

      <div class="divider"></div>

      <div class="field-label">Scenarios</div>
      <div id="scenario-list" style="display:flex;flex-direction:column;gap:6px"></div>

      <div class="divider"></div>

      <!-- Traffic generator -->
      <div class="field-label">Traffic Generator</div>
      <div class="gen-controls">
        <input type="number" id="gen-count" value="5" min="1" max="50" title="Number of requests">
        <span style="font-size:12px;color:var(--muted)">requests,</span>
        <input type="number" id="gen-delay" value="500" min="0" max="5000" title="Delay between requests (ms)">
        <span style="font-size:12px;color:var(--muted)">ms apart</span>
        <button class="btn btn-orange" style="font-size:12px;padding:4px 10px" onclick="runTrafficGen()">Generate</button>
      </div>
      <div class="gen-log" id="gen-log"></div>

    </div>
  </div>

  <!-- CENTER: chat -->
  <div class="panel" style="min-width:0">
    <div class="panel-title">Chat</div>
    <div class="chat-messages" id="chat-messages">
      <div class="empty-state" id="chat-empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        <p>Pick a scenario on the left to demo<br>healthcare compliance, spend limits,<br>rate limiting, caching, failover &amp; more.</p>
      </div>
    </div>
    <div class="chat-input-bar">
      <textarea class="chat-input" id="chat-input" placeholder="Type a message…" rows="1"
        onkeydown="handleKey(event)" oninput="autoResize(this)"></textarea>
      <button class="send-btn" id="send-btn" onclick="sendMessage()">Send ▶</button>
    </div>
  </div>

  <!-- RIGHT: gateway info -->
  <div class="panel panel-right">
    <div class="panel-title">Gateway Info</div>
    <div class="panel-body" id="info-panel">
      <div class="empty-state">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
        </svg>
        <p>Response metadata will<br>appear here after each request.</p>
      </div>
    </div>
  </div>

</div><!-- /.layout -->

<!-- ── Settings modal ── -->
<div class="modal-backdrop" id="settings-modal" onclick="maybeCloseSettings(event)">
  <div class="modal" onclick="event.stopPropagation()">
    <div class="modal-header">
      <span class="modal-title">Settings</span>
      <button class="modal-close" onclick="closeSettings()">✕</button>
    </div>
    <div class="modal-body">

      <div class="modal-section">
        <div class="modal-section-title">Identity</div>
        <div class="field-label">User-Agent <span style="color:var(--muted);font-size:10px">(visible in gateway logs — Jun 2026)</span></div>
        <input id="user-agent" value="ai-gateway-demo/1.0 (cloudflare-worker)">
        <div class="presets" id="ua-presets"></div>
      </div>

      <div class="divider"></div>

      <div class="modal-section">
        <div class="modal-section-title">Caching</div>
        <div class="toggle-row">
          <span>Skip cache</span>
          <label class="toggle"><input type="checkbox" id="skip-cache"><span class="toggle-slider"></span></label>
        </div>
        <div class="field-row">
          <div class="field-label">Cache TTL (seconds)</div>
          <input id="cache-ttl" type="number" placeholder="e.g. 300" min="60">
        </div>
        <div class="field-row">
          <div class="field-label">Cache key override</div>
          <input id="cache-key" placeholder="e.g. my-cache-key">
        </div>
      </div>

      <div class="divider"></div>

      <div class="modal-section">
        <div class="modal-section-title">Logging</div>
        <div class="toggle-row">
          <span>Collect log</span>
          <label class="toggle"><input type="checkbox" id="collect-log" checked><span class="toggle-slider"></span></label>
        </div>
        <div class="toggle-row">
          <span>Store payload <span style="font-size:11px;color:var(--muted)">(prompt + response)</span></span>
          <label class="toggle"><input type="checkbox" id="collect-log-payload" checked><span class="toggle-slider"></span></label>
        </div>
      </div>

      <div class="divider"></div>

      <div class="modal-section">
        <div class="modal-section-title">Retries &amp; Timeouts</div>
        <div class="field-row">
          <div class="field-label">Max attempts (1–5)</div>
          <input id="max-attempts" type="number" min="1" max="5" placeholder="default: 1">
        </div>
        <div class="field-row">
          <div class="field-label">Retry delay (ms)</div>
          <input id="retry-delay" type="number" min="100" max="5000" placeholder="e.g. 500">
        </div>
        <div class="field-row">
          <div class="field-label">Backoff strategy</div>
          <select id="backoff">
            <option value="">default</option>
            <option value="constant">constant</option>
            <option value="linear">linear</option>
            <option value="exponential">exponential</option>
          </select>
        </div>
        <div class="field-row">
          <div class="field-label">Request timeout (ms)</div>
          <input id="request-timeout" type="number" placeholder="e.g. 30000">
        </div>
      </div>

      <div class="divider"></div>

      <div class="modal-section">
        <div class="modal-section-title">Extra Headers <span style="color:var(--muted);font-size:10px">(escape hatch)</span></div>
        <div id="extra-headers" style="display:flex;flex-direction:column;gap:4px"></div>
        <button class="btn" style="font-size:12px" onclick="addExtraHeader()">+ Add header</button>
      </div>

    </div>
  </div>
</div>

<script>
// ── State ────────────────────────────────────────────────────────────────────
let currentLogId = null;
let fbChoice = null;
let isLoading = false;
let scenarios = [];

// ── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  addMetaRow('userId', 'demo-user');
  addMetaRow('tier', 'free');

  // Load scenarios
  try {
    const r = await fetch('/api/scenarios');
    scenarios = await r.json();
    renderScenarios();
  } catch (e) {
    console.error('Failed to load scenarios', e);
  }

  // Workers AI model presets
  const modelPresets = [
    ['Large',  'workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast'],
    ['Medium', 'workers-ai/@cf/meta/llama-3.1-8b-instruct'],
    ['Small',  'workers-ai/@cf/mistral/mistral-7b-instruct-v0.1'],
  ];
  const mpEl = document.getElementById('model-presets');
  modelPresets.forEach(([label, val]) => {
    const chip = document.createElement('button');
    chip.className = 'preset-chip';
    chip.textContent = label;
    chip.title = val;
    chip.onclick = () => { document.getElementById('model-input').value = val; };
    mpEl.appendChild(chip);
  });

  // UA presets (for the user-agent observability scenario)
  const presets = [
    'ai-gateway-demo/1.0 (cloudflare-worker)',
    'internal-summariser/2.1 (finance-team)',
    'compliance-checker/1.0 (legal)',
    'support-bot/3.0 (customer-success)',
    'ci-pipeline/1.0 (github-actions)',
    'curl/8.7.1',
  ];
  const el = document.getElementById('ua-presets');
  presets.forEach(p => {
    const chip = document.createElement('button');
    chip.className = 'preset-chip';
    chip.textContent = p;
    chip.onclick = () => { document.getElementById('user-agent').value = p; };
    el.appendChild(chip);
  });
}

function renderScenarios() {
  const el = document.getElementById('scenario-list');
  el.innerHTML = '';
  scenarios.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'scenario-btn';
    btn.innerHTML = '<strong>' + esc(s.name) + '</strong><span>' + esc(s.description) + '</span>';
    btn.onclick = () => applyScenario(s);
    el.appendChild(btn);
  });
}

function applyScenario(s) {
  if (s.request.model) document.getElementById('model-input').value = s.request.model;
  if (s.request.options?.userAgent) document.getElementById('user-agent').value = s.request.options.userAgent;
  if (s.request.options?.cacheTtl)  document.getElementById('cache-ttl').value = s.request.options.cacheTtl;
  if (s.request.options?.maxAttempts) document.getElementById('max-attempts').value = s.request.options.maxAttempts;
  if (s.request.options?.retryDelay)  document.getElementById('retry-delay').value = s.request.options.retryDelay;
  if (s.request.options?.backoff)     document.getElementById('backoff').value = s.request.options.backoff;
  if (s.request.options?.collectLogPayload === false) document.getElementById('collect-log-payload').checked = false;

  // Metadata
  const editor = document.getElementById('meta-editor');
  editor.innerHTML = '';
  if (s.request.metadata) {
    Object.entries(s.request.metadata).forEach(([k, v]) => addMetaRow(k, String(v)));
  }

  // Pre-fill prompt if scenario has a message
  if (s.request.messages?.[0]?.content) {
    document.getElementById('chat-input').value = s.request.messages[0].content;
    autoResize(document.getElementById('chat-input'));
  }

  // Show explanation
  appendExplanation(s.name, s.explanation);
}

function appendExplanation(name, text) {
  const el = document.getElementById('chat-messages');
  document.getElementById('chat-empty')?.remove();
  const div = document.createElement('div');
  div.style.cssText = 'font-size:12px;color:var(--muted);background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:10px 12px;line-height:1.5;border-left:3px solid var(--orange);';
  div.innerHTML = '<strong style="color:var(--orange)">' + esc(name) + '</strong><br>' + esc(text);
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

// ── Metadata editor ───────────────────────────────────────────────────────────
function addMetaRow(key = '', value = '') {
  const editor = document.getElementById('meta-editor');
  if (editor.children.length >= 5) return;
  const row = document.createElement('div');
  row.className = 'meta-row';
  row.innerHTML =
    '<input placeholder="key" value="' + esc(key) + '">' +
    '<input placeholder="value" value="' + esc(value) + '">' +
    '<button class="meta-del" onclick="this.closest(\'.meta-row\').remove()" title="Remove">×</button>';
  editor.appendChild(row);
}

function getMetadata() {
  const meta = {};
  document.querySelectorAll('.meta-row').forEach(row => {
    const [k, v] = row.querySelectorAll('input');
    if (k.value.trim()) {
      const val = v.value.trim();
      meta[k.value.trim()] = val === 'true' ? true : val === 'false' ? false : isNaN(+val) ? val : +val;
    }
  });
  return Object.keys(meta).length ? meta : undefined;
}

// ── Extra headers ─────────────────────────────────────────────────────────────
function addExtraHeader(k = '', v = '') {
  const el = document.getElementById('extra-headers');
  const row = document.createElement('div');
  row.className = 'extra-row';
  row.innerHTML =
    '<input placeholder="cf-aig-header" value="' + esc(k) + '" style="font-size:11px">' +
    '<input placeholder="value" value="' + esc(v) + '" style="font-size:11px">' +
    '<button class="meta-del" onclick="this.closest(\'.extra-row\').remove()">×</button>';
  el.appendChild(row);
}

function getExtraHeaders() {
  const h = {};
  document.querySelectorAll('.extra-row').forEach(row => {
    const [k, v] = row.querySelectorAll('input');
    if (k.value.trim()) h[k.value.trim()] = v.value;
  });
  return Object.keys(h).length ? h : undefined;
}

// ── Build request body ────────────────────────────────────────────────────────
function buildRequest(userContent) {
  const opts = {};
  const ua = document.getElementById('user-agent').value.trim();
  if (ua) opts.userAgent = ua;
  if (document.getElementById('skip-cache').checked) opts.skipCache = true;
  const cacheTtl = +document.getElementById('cache-ttl').value;
  if (cacheTtl > 0) opts.cacheTtl = cacheTtl;
  const cacheKey = document.getElementById('cache-key').value.trim();
  if (cacheKey) opts.cacheKey = cacheKey;
  opts.collectLog = document.getElementById('collect-log').checked;
  opts.collectLogPayload = document.getElementById('collect-log-payload').checked;
  const maxAttempts = +document.getElementById('max-attempts').value;
  if (maxAttempts >= 1) opts.maxAttempts = maxAttempts;
  const retryDelay = +document.getElementById('retry-delay').value;
  if (retryDelay >= 100) opts.retryDelay = retryDelay;
  const backoff = document.getElementById('backoff').value;
  if (backoff) opts.backoff = backoff;
  const timeout = +document.getElementById('request-timeout').value;
  if (timeout > 0) opts.requestTimeout = timeout;
  const extra = getExtraHeaders();
  if (extra) opts.extraHeaders = extra;

  return {
    model: document.getElementById('model-input').value.trim() || 'workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    messages: [{ role: 'user', content: userContent }],
    metadata: getMetadata(),
    options: opts,
  };
}

// ── Send message ──────────────────────────────────────────────────────────────
async function sendMessage() {
  if (isLoading) return;
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  isLoading = true;
  input.value = '';
  autoResize(input);
  document.getElementById('send-btn').disabled = true;

  const msgs = document.getElementById('chat-messages');
  document.getElementById('chat-empty')?.remove();

  // User bubble
  msgs.appendChild(makeBubble('user', text));
  // Thinking bubble
  const thinking = makeBubble('assistant', null, true);
  msgs.appendChild(thinking);
  msgs.scrollTop = msgs.scrollHeight;

  try {
    const body = buildRequest(text);
    const t0 = Date.now();
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await resp.json();

    thinking.remove();

    if (!resp.ok) {
      msgs.appendChild(makeError(data.message || JSON.stringify(data)));
    } else {
      const bubble = makeBubble('assistant', data.message, false, data.gateway);
      msgs.appendChild(bubble);
      renderInfo(data.gateway);
      currentLogId = data.gateway.logId;
      fbChoice = null;
    }
  } catch (e) {
    thinking.remove();
    msgs.appendChild(makeError(String(e)));
  }

  msgs.scrollTop = msgs.scrollHeight;
  isLoading = false;
  document.getElementById('send-btn').disabled = false;
  input.focus();
}

function makeBubble(role, content, thinking = false, gw = null) {
  const div = document.createElement('div');
  div.className = 'msg ' + role;
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble' + (thinking ? ' msg-thinking' : '');
  bubble.textContent = thinking ? '⋯ thinking' : (content || '');
  div.appendChild(bubble);

  if (gw && role === 'assistant') {
    const meta = document.createElement('div');
    meta.className = 'msg-meta';
    meta.innerHTML =
      '<span class="cache-badge cache-' + gw.cacheStatus + '">' + gw.cacheStatus + '</span>' +
      (gw.model !== document.getElementById('model-input').value ? '<span style="font-family:monospace;font-size:10px">' + esc(gw.model) + '</span>' : '') +
      '<span>' + gw.latencyMs + ' ms</span>' +
      (gw.usage ? '<span>' + gw.usage.totalTokens + ' tok</span>' : '');
    div.appendChild(meta);
  }
  return div;
}

function makeError(msg) {
  const div = document.createElement('div');
  div.style.cssText = 'font-size:12px;color:var(--expired);background:#ef444415;border:1px solid #ef444440;border-radius:8px;padding:10px 12px;';
  div.textContent = '⚠ ' + msg;
  return div;
}

// ── Gateway Info panel ────────────────────────────────────────────────────────
function renderInfo(gw) {
  const panel = document.getElementById('info-panel');
  const cacheClass = 'cache-' + gw.cacheStatus;
  const dotColor = { HIT:'var(--hit)', MISS:'var(--miss)', BYPASS:'var(--bypass)', EXPIRED:'var(--expired)' }[gw.cacheStatus] || '#9ca3af';

  panel.innerHTML = '';

  const section = (html) => {
    const d = document.createElement('div');
    d.className = 'info-section';
    d.innerHTML = html;
    panel.appendChild(d);
  };

  section('<div class="info-kv">' +
    kv('Model', '<span style="font-family:monospace;font-size:11px;word-break:break-all">' + esc(gw.model) + '</span>') +
    kv('Provider', esc(gw.provider || '—')) +
    (gw.step ? kv('Step', '<code style="font-size:11px">' + esc(gw.step) + '</code>') : '') +
    '</div>');

  const cacheBadge = '<span class="badge-cache ' + cacheClass + '"><span class="dot" style="background:' + dotColor + '"></span>' + gw.cacheStatus + '</span>';
  section('<div class="info-kv">' + kv('Cache', cacheBadge) + '</div>');

  const logEl = '<span class="info-v clickable" onclick="copyLogId(\'' + esc(gw.logId) + '\')" title="Click to copy">' +
    '<code style="font-size:11px">' + esc(gw.logId.slice(0, 20)) + '…</code>' +
    '<span class="copy-icon">⧉</span>' +
    '<span class="copied-tip" id="copied-tip" style="display:none">Copied!</span></span>';

  section('<div class="info-kv">' +
    kv('Log ID', logEl) +
    kv('Latency', '<span class="latency">' + gw.latencyMs + ' ms</span>') +
    (gw.usage ? kv('Tokens', gw.usage.promptTokens + ' → ' + gw.usage.completionTokens + ' = ' + gw.usage.totalTokens) : '') +
    (gw.dlp ? kv('DLP', '<span style="color:var(--expired);font-size:11px">' + esc(JSON.stringify(gw.dlp)) + '</span>') : '') +
    '</div>');

  // Feedback
  const fb = document.createElement('div');
  fb.className = 'info-section';
  fb.innerHTML =
    '<div class="field-label">Feedback</div>' +
    '<div class="feedback-row">' +
      '<button class="fb-btn" id="fb-up" onclick="setFb(1)">👍</button>' +
      '<button class="fb-btn" id="fb-down" onclick="setFb(-1)">👎</button>' +
      '<input class="score-input" id="fb-score" type="number" min="0" max="100" placeholder="0-100">' +
      '<button class="btn fb-submit" onclick="submitFeedback()">Submit</button>' +
    '</div>' +
    '<div class="fb-status" id="fb-status"></div>';
  panel.appendChild(fb);
}

function kv(k, vHtml) {
  return '<span class="info-k">' + esc(k) + '</span><span class="info-v">' + vHtml + '</span>';
}

function copyLogId(id) {
  navigator.clipboard.writeText(id).then(() => {
    const tip = document.getElementById('copied-tip');
    if (tip) { tip.style.display = ''; setTimeout(() => tip.style.display = 'none', 1800); }
  });
}

function setFb(val) {
  fbChoice = val;
  document.getElementById('fb-up').classList.toggle('active-pos', val === 1);
  document.getElementById('fb-down').classList.toggle('active-neg', val === -1);
}

async function submitFeedback() {
  if (!currentLogId || fbChoice === null) {
    document.getElementById('fb-status').textContent = 'Pick 👍 or 👎 first';
    return;
  }
  const score = +document.getElementById('fb-score').value;
  try {
    const r = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logId: currentLogId, feedback: fbChoice, ...(score > 0 ? { score } : {}) }),
    });
    const d = await r.json();
    document.getElementById('fb-status').textContent = d.ok ? '✓ Feedback saved' : ('Error: ' + (d.error || JSON.stringify(d)));
  } catch (e) {
    document.getElementById('fb-status').textContent = 'Error: ' + e;
  }
}

// ── Traffic generator ─────────────────────────────────────────────────────────
async function runTrafficGen() {
  const count = Math.min(50, Math.max(1, +document.getElementById('gen-count').value || 5));
  const delay = Math.max(0, +document.getElementById('gen-delay').value || 500);
  const log = document.getElementById('gen-log');
  log.textContent = '';

  for (let i = 0; i < count; i++) {
    const body = buildRequest('Traffic generator request ' + (i + 1));
    log.textContent += '[' + (i + 1) + '/' + count + '] Sending…\n';
    log.scrollTop = log.scrollHeight;
    try {
      const t0 = Date.now();
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      const ms = Date.now() - t0;
      if (resp.ok) {
        log.textContent += '  ✓ ' + data.gateway.cacheStatus + ' | ' + data.gateway.model.split('/').pop() + ' | ' + ms + 'ms | ' + data.gateway.logId.slice(0, 12) + '…\n';
      } else {
        log.textContent += '  ✗ ' + (data.message || resp.status) + '\n';
      }
    } catch (e) {
      log.textContent += '  ✗ ' + e + '\n';
    }
    log.scrollTop = log.scrollHeight;
    if (i < count - 1 && delay > 0) await sleep(delay);
  }
  log.textContent += '─ Done (' + count + ' requests) ─\n';
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }
function autoResize(el) { el.style.height = ''; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }

function openSettings()  { document.getElementById('settings-modal').classList.add('open'); }
function closeSettings() { document.getElementById('settings-modal').classList.remove('open'); }
function maybeCloseSettings(e) { if (e.target === document.getElementById('settings-modal')) closeSettings(); }

init();
</script>
</body>
</html>`;
