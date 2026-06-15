export const UI_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI Gateway Demo &middot; Cloudflare</title>
<style>
:root {
  --orange:   #FF4801;
  --orange-h: #FF7038;
  --orange-l: rgba(255,72,1,0.10);
  --text:     #521000;
  --muted:    rgba(82,16,0,0.60);
  --subtle:   rgba(82,16,0,0.38);
  --bg:       #FFFBF5;
  --bg-card:  #FFFDFB;
  --bg-hover: #FEF7ED;
  --border:   #EBD5C1;
  --border-l: rgba(235,213,193,0.50);
  --success:  #16A34A;
  --warn:     #CA8A04;
  --error:    #DC2626;
  --font:     "FT Kunst Grotesk",-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
  --mono:     "Apercu Mono Pro",ui-monospace,"SF Mono",Consolas,monospace;
  --shadow:   0 1px 3px rgba(82,16,0,0.04),0 4px 12px rgba(82,16,0,0.02);
  --focus:    0 0 0 3px rgba(255,72,1,0.15);
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;font-family:var(--font);background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}
body{display:flex;flex-direction:column;height:100dvh;overflow:hidden}
::selection{background:rgba(255,72,1,0.15);color:var(--text)}
:focus-visible{outline:2px solid var(--orange);outline-offset:2px}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--orange)!important;box-shadow:var(--focus)}

/* ── Header ── */
.hdr{display:flex;align-items:center;gap:14px;padding:0 20px;height:54px;background:var(--bg);border-bottom:1px solid var(--border);flex-shrink:0}
.logo{display:flex;align-items:center;gap:9px;text-decoration:none}
.logo svg{color:var(--orange);flex-shrink:0}
.logo-text{display:flex;flex-direction:column;gap:0}
.logo-eye{font-size:9px;font-weight:500;color:var(--subtle);text-transform:uppercase;letter-spacing:.06em;line-height:1}
.logo-name{font-size:17px;font-weight:500;color:var(--text);letter-spacing:-.46px;line-height:1.1}
.hdr-spacer{flex:1}
.badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:9999px;font-size:11px;font-family:var(--mono);font-weight:500;background:rgba(22,163,74,0.10);color:var(--success);border:1px solid rgba(22,163,74,0.25)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:7px 16px;border-radius:9999px;font-family:var(--font);font-size:13px;font-weight:500;cursor:pointer;border:1px solid var(--border);background:var(--bg-card);color:var(--text);transition:all .15s ease;white-space:nowrap}
.btn:hover{background:var(--bg-hover);border-color:var(--orange)}
.btn:active{transform:translateY(1px);scale:.98}
.btn-primary{background:var(--orange);color:#fff;border-color:var(--orange)}
.btn-primary:hover{background:var(--orange-h);border-color:var(--orange-h)}
.btn-ghost{background:transparent;color:var(--orange);border-color:var(--border)}
.btn-ghost:hover{border-style:dashed;border-color:var(--orange);background:var(--orange-l)}
.btn-sm{padding:5px 12px;font-size:12px}

/* ── Layout ── */
.layout{display:grid;grid-template-columns:252px 5px minmax(300px,1fr) 5px 292px;flex:1;min-height:0;overflow:hidden}
.panel{display:flex;flex-direction:column;overflow:hidden}
/* ── Resize handles ── */
.resizer{cursor:col-resize;position:relative;z-index:20;background:transparent;flex-shrink:0}
.resizer::before{content:'';position:absolute;top:0;bottom:0;left:50%;width:1px;background:var(--border);transform:translateX(-50%);transition:width .12s,background .12s}
.resizer:hover::before,.resizer.is-dragging::before{width:2px;background:var(--orange)}
.resizer:hover{background:rgba(255,72,1,0.04)}
.panel-head{display:flex;align-items:center;justify-content:space-between;padding:10px 14px 8px;border-bottom:1px solid var(--border-l);flex-shrink:0}
.panel-title{font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.08em;color:var(--subtle);font-family:var(--mono)}
.panel-body{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px}
.panel-body::-webkit-scrollbar{width:3px}
.panel-body::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}

/* ── Forms ── */
.field{display:flex;flex-direction:column;gap:4px}
.field-label{font-size:11px;font-weight:500;color:var(--muted)}
.field-sub{font-size:10px;color:var(--subtle);font-family:var(--mono);margin-top:2px}
input,select,textarea{background:var(--bg-card);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:13px;font-family:var(--font);padding:7px 10px;width:100%;transition:border-color .15s,box-shadow .15s}
input::placeholder,textarea::placeholder{color:var(--subtle)}
select{cursor:pointer}
.meta-row{display:grid;grid-template-columns:1fr 1fr auto;gap:4px;align-items:center}
.meta-row input{font-size:12px;padding:5px 8px}
.meta-del{background:none;border:none;color:var(--subtle);cursor:pointer;font-size:18px;line-height:1;padding:2px 5px;border-radius:6px;transition:all .15s;display:flex;align-items:center;justify-content:center}
.meta-del:hover{color:var(--error);background:rgba(220,38,38,.08)}
.divider{height:1px;background:var(--border-l);margin:2px 0}

/* ── Scenario cards ── */
.sc-card{position:relative;display:block;width:100%;text-align:left;padding:9px 11px;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;cursor:pointer;transition:all .15s;font-family:var(--font)}
.sc-card:hover{background:var(--bg-hover);border-style:dashed;border-color:var(--orange)}
.sc-card:active{scale:.99}
.sc-card-name{font-size:12px;font-weight:500;color:var(--text);line-height:1.3;margin-bottom:2px}
.sc-card-desc{font-size:11px;color:var(--muted);line-height:1.4}


/* ── Model chips ── */
.chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
.chip{padding:3px 9px;background:var(--bg-card);border:1px solid var(--border);border-radius:9999px;font-size:11px;font-family:var(--mono);cursor:pointer;color:var(--muted);transition:all .15s}
.chip:hover{border-color:var(--orange);color:var(--text);background:var(--orange-l)}

/* ── Gen controls ── */
.gen-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.gen-row input[type=number]{width:54px;font-size:12px}
.gen-row span{font-size:11px;color:var(--muted)}
.gen-log{font-size:11px;font-family:var(--mono);color:var(--muted);max-height:90px;overflow-y:auto;line-height:1.7;background:var(--bg-card);border:1px solid var(--border-l);border-radius:7px;padding:7px 9px;margin-top:4px;white-space:pre-wrap}

/* ── Chat ── */
.chat-msgs{flex:1;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:14px}
.chat-msgs::-webkit-scrollbar{width:3px}
.chat-msgs::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
.empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:32px 16px;color:var(--subtle)}
.empty-icon{width:44px;height:44px;border-radius:10px;background:var(--bg-hover);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--orange)}
.empty-t{font-size:13px;font-weight:500;color:var(--muted)}
.empty-s{font-size:12px;color:var(--subtle);line-height:1.5;max-width:200px}
.msg{display:flex;flex-direction:column;gap:3px;max-width:82%}
.msg-u{align-self:flex-end;align-items:flex-end}
.msg-a{align-self:flex-start}
.bubble{padding:10px 14px;font-size:14px;line-height:1.55;word-break:break-word;white-space:pre-wrap}
.msg-u .bubble{background:var(--orange);color:#fff;border-radius:18px 18px 4px 18px}
.msg-a .bubble{background:var(--bg-card);border:1px solid var(--border);border-radius:4px 18px 18px 18px;box-shadow:var(--shadow)}
.bubble-thinking{color:var(--muted);font-style:italic;animation:pulse 1.3s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
.msg-meta{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--subtle);padding:0 4px;font-family:var(--mono)}
.cbadge{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:9999px;font-size:10px;font-weight:700;font-family:var(--mono);letter-spacing:.04em}
.c-HIT{background:rgba(22,163,74,.10);color:#16A34A}
.c-MISS{background:rgba(82,16,0,.06);color:var(--muted)}
.c-BYPASS{background:rgba(202,138,4,.10);color:var(--warn)}
.c-EXPIRED{background:rgba(220,38,38,.10);color:var(--error)}
.c-UNKNOWN{background:rgba(82,16,0,.06);color:var(--subtle)}
.msg-err{font-size:12px;color:var(--error);background:rgba(220,38,38,.06);border:1px solid rgba(220,38,38,.18);border-radius:10px;padding:10px 14px;align-self:stretch}
.msg-info{font-size:12px;background:var(--bg-card);border:1px solid var(--border);border-left:3px solid var(--orange);border-radius:3px 10px 10px 3px;padding:10px 14px;color:var(--muted);line-height:1.5;align-self:stretch}
.msg-info strong{color:var(--orange)}

/* ── Input bar ── */
.input-bar{border-top:1px solid var(--border);padding:12px 14px;display:flex;gap:10px;flex-shrink:0}
.chat-in{flex:1;resize:none;min-height:40px;max-height:120px;padding:9px 12px;font-size:14px;line-height:1.5;border-radius:20px;font-family:var(--font);background:var(--bg-card);border:1px solid var(--border);color:var(--text);overflow-y:auto;transition:border-color .15s,box-shadow .15s}
.chat-in::placeholder{color:var(--subtle)}
.send-btn{align-self:flex-end;padding:10px 18px;border-radius:9999px;border:none;background:var(--orange);color:#fff;font-family:var(--font);font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;flex-shrink:0;display:flex;align-items:center;gap:5px}
.send-btn:hover:not(:disabled){background:var(--orange-h)}
.send-btn:active:not(:disabled){transform:translateY(1px);scale:.98}
.send-btn:disabled{opacity:.45;cursor:not-allowed}
.burst-btn{align-self:flex-end;padding:9px 14px;border-radius:9999px;border:1px solid var(--border);background:var(--bg-card);color:var(--muted);font-family:var(--font);font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;flex-shrink:0;display:flex;align-items:center;gap:5px}
.burst-btn:hover:not(:disabled){border-color:var(--orange);color:var(--orange)}
.burst-btn:active:not(:disabled){transform:translateY(1px)}
.burst-btn:disabled{opacity:.45;cursor:not-allowed}
.burst-lines{display:flex;flex-direction:column;gap:2px;margin-top:6px;font-family:var(--mono);font-size:11px;line-height:1.6}

/* ── Gateway info ── */
.info-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--subtle);padding:20px;text-align:center;font-size:12px}
.info-card{background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:14px 16px;box-shadow:var(--shadow);display:flex;flex-direction:column;gap:12px}
/* stacked layout: label above value — more readable than 2-col grid */
.info-row{display:flex;flex-direction:column;gap:3px}
.info-k{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--subtle);font-family:var(--mono)}
.info-v{font-family:var(--mono);font-size:13px;color:var(--text);overflow-wrap:anywhere;line-height:1.4}
.info-click{cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:color .15s}
.info-click:hover{color:var(--orange)}
.info-tag{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:9999px;font-size:12px;font-weight:700;font-family:var(--mono)}
.copied{font-size:10px;color:var(--success);font-family:var(--mono)}

/* ── Feedback ── */
.fb-row{display:flex;align-items:center;gap:7px}
.fb-btn{font-size:16px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:var(--bg-card);border:1px solid var(--border);border-radius:9999px;cursor:pointer;transition:all .15s}
.fb-btn:hover{border-color:var(--orange);background:var(--bg-hover)}
.fb-pos{border-color:#16A34A;background:rgba(22,163,74,.10)}
.fb-neg{border-color:var(--error);background:rgba(220,38,38,.08)}
.fb-score{width:58px}
.fb-status{font-size:11px;color:var(--success);font-family:var(--mono)}

/* ── Settings overlay / drawer ── */
.overlay{position:fixed;inset:0;background:rgba(82,16,0,0.18);z-index:9999;display:none;justify-content:flex-end;backdrop-filter:blur(2px)}
.drawer{width:380px;max-width:100vw;background:var(--bg);border-left:1px solid var(--border);height:100%;display:flex;flex-direction:column;box-shadow:-8px 0 32px rgba(82,16,0,.08)}
.drawer-hdr{display:flex;align-items:center;justify-content:space-between;padding:15px 18px;border-bottom:1px solid var(--border);flex-shrink:0}
.drawer-title{font-size:15px;font-weight:500;color:var(--text)}
.drawer-close{background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;padding:3px 7px;border-radius:6px;line-height:1;transition:all .15s}
.drawer-close:hover{color:var(--text);background:var(--bg-hover)}
.drawer-body{flex:1;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:18px}
.drawer-body::-webkit-scrollbar{width:3px}
.drawer-body::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
.drawer-sec{display:flex;flex-direction:column;gap:9px}
.drawer-sec-title{font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.08em;color:var(--subtle);font-family:var(--mono)}
.toggle-row{display:flex;align-items:center;justify-content:space-between;font-size:13px;color:var(--text)}
.tog{position:relative;width:40px;height:22px;flex-shrink:0}
.tog input{position:absolute;opacity:0;width:0;height:0}
.tog-track{position:absolute;inset:0;background:var(--border);border-radius:9999px;cursor:pointer;transition:background .2s}
.tog-thumb{position:absolute;top:3px;left:3px;width:16px;height:16px;background:#fff;border-radius:50%;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.15);pointer-events:none}
.tog input:checked + .tog-track{background:var(--orange)}
.tog input:checked ~ .tog-thumb{transform:translateX(18px)}
.extra-row{display:grid;grid-template-columns:1fr 1fr auto;gap:4px}
.extra-row input{font-size:11px;padding:5px 8px}

/* ── Dot pattern bg (decorative) ── */
.dot-bg{position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.35}
</style>
</head>
<body>

<!-- Dot pattern background -->
<div class="dot-bg" aria-hidden="true">
  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="dp" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
        <circle cx="6" cy="6" r="0.75" fill="#EBD5C1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dp)"/>
  </svg>
</div>

<!-- Header -->
<header class="hdr">
  <a class="logo" href="/">
    <svg class="logo-icon" width="28" height="14" viewBox="0 0 66 30" fill="currentColor">
      <path d="M52.688 13.028c-.22 0-.437.008-.654.015a.3.3 0 0 0-.102.024.37.37 0 0 0-.236.255l-.93 3.249c-.401 1.397-.252 2.687.422 3.634.618.876 1.646 1.39 2.894 1.45l5.045.306a.45.45 0 0 1 .435.41.5.5 0 0 1-.025.223.64.64 0 0 1-.547.426l-5.242.306c-2.848.132-5.912 2.456-6.987 5.29l-.378 1a.28.28 0 0 0 .248.382h18.054a.48.48 0 0 0 .464-.35c.32-1.153.482-2.344.48-3.54 0-7.22-5.79-13.072-12.933-13.072M44.807 29.578l.334-1.175c.402-1.397.253-2.687-.42-3.634-.62-.876-1.647-1.39-2.896-1.45l-23.665-.306a.47.47 0 0 1-.374-.199.5.5 0 0 1-.052-.434.64.64 0 0 1 .552-.426l23.886-.306c2.836-.131 5.9-2.456 6.975-5.29l1.362-3.6a.9.9 0 0 0 .04-.477C48.997 5.259 42.789 0 35.367 0c-6.842 0-12.647 4.462-14.73 10.665a6.92 6.92 0 0 0-4.911-1.374c-3.28.33-5.92 3.002-6.246 6.318a7.2 7.2 0 0 0 .18 2.472C4.3 18.241 0 22.679 0 28.133q0 .74.106 1.453a.46.46 0 0 0 .457.402h43.704a.57.57 0 0 0 .54-.418"/>
    </svg>
    <div class="logo-text">
      <span class="logo-eye">Cloudflare</span>
      <span class="logo-name">AI Gateway Demo</span>
    </div>
  </a>
  <div class="hdr-spacer"></div>
  <span class="badge" id="status-badge">Workers AI</span>
  <button class="btn btn-ghost" id="settings-btn">
    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/>
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
    </svg>
    Settings
  </button>
</header>

<!-- Main 3-panel layout -->
<div class="layout" id="main-layout">

  <!-- LEFT: config + scenarios -->
  <div class="panel panel-left">
    <div class="panel-head">
      <span class="panel-title">Request Config</span>
    </div>
    <div class="panel-body">

      <div class="field">
        <div class="field-label">Model</div>
        <input id="inp-model" value="workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast" placeholder="workers-ai/@cf/... or dynamic/route">
        <div class="chips" id="model-chips"></div>
      </div>

      <div class="divider"></div>

      <div class="field">
        <div class="field-label">Metadata <span style="color:var(--subtle);font-size:10px">(max 5)</span></div>
        <div id="meta-editor" style="display:flex;flex-direction:column;gap:5px"></div>
        <button class="btn btn-sm" id="add-meta-btn" style="margin-top:4px;align-self:flex-start">+ Add field</button>
      </div>

      <div class="divider"></div>

      <div class="field">
        <div class="field-label">Scenarios</div>
        <div id="scenario-list" style="display:flex;flex-direction:column;gap:6px"></div>
      </div>

      <div class="divider"></div>

      <div class="field">
        <div class="field-label">Traffic Generator</div>
        <div class="gen-row">
          <input type="number" id="gen-count" value="5" min="1" max="50">
          <span>requests,</span>
          <input type="number" id="gen-delay" value="500" min="0" max="5000">
          <span>ms apart</span>
        </div>
      </div>

    </div>
  </div>

  <!-- Resizer: left ↔ chat -->
  <div class="resizer" id="resizer-left" title="Drag to resize"></div>

  <!-- CENTER: chat -->
  <div class="panel">
    <div class="panel-head">
      <span class="panel-title">Chat</span>
      <button class="btn btn-sm" id="clear-btn" style="font-size:11px">Clear</button>
    </div>
    <div class="chat-msgs" id="chat-msgs">
      <div class="empty" id="chat-empty">
        <div class="empty-icon">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"/>
          </svg>
        </div>
        <div class="empty-t">Pick a scenario or send a message</div>
        <div class="empty-s">Healthcare compliance, spend limits, rate limiting, caching, failover &amp; more</div>
      </div>
    </div>
    <div class="input-bar">
      <textarea class="chat-in" id="chat-input" rows="1" placeholder="Type a message&hellip;"></textarea>
      <button class="burst-btn" id="gen-btn" title="Send multiple requests using Traffic Generator settings">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/>
        </svg>
        Burst
      </button>
      <button class="send-btn" id="send-btn">
        Send
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Resizer: chat ↔ right -->
  <div class="resizer" id="resizer-right" title="Drag to resize"></div>

  <!-- RIGHT: gateway info -->
  <div class="panel panel-right">
    <div class="panel-head">
      <span class="panel-title">Gateway Info</span>
    </div>
    <div class="panel-body" id="info-panel">
      <div class="info-empty">
        <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24" style="opacity:.4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z"/>
        </svg>
        Response metadata will appear here
      </div>
    </div>
  </div>

</div><!-- /.layout -->

<!-- Settings overlay + drawer -->
<div class="overlay" id="settings-overlay">
  <div class="drawer" id="settings-drawer">
    <div class="drawer-hdr">
      <span class="drawer-title">Settings</span>
      <button class="drawer-close" id="close-settings-btn">&#x2715;</button>
    </div>
    <div class="drawer-body">

      <div class="drawer-sec">
        <div class="drawer-sec-title">Identity &amp; User-Agent</div>
        <div class="field-label">User-Agent <span style="color:var(--subtle);font-size:10px">(visible in gateway logs &mdash; Jun 2026)</span></div>
        <input id="inp-ua" value="ai-gateway-demo/1.0 (cloudflare-worker)">
        <div class="chips" id="ua-chips"></div>
      </div>

      <div class="divider"></div>

      <div class="drawer-sec">
        <div class="drawer-sec-title">Caching</div>
        <div class="toggle-row">
          <span>Skip cache</span>
          <div class="tog">
            <input type="checkbox" id="tog-skip-cache">
            <div class="tog-track"></div>
            <div class="tog-thumb"></div>
          </div>
        </div>
        <div class="field">
          <div class="field-label">Cache TTL (seconds)</div>
          <input type="number" id="inp-cache-ttl" placeholder="e.g. 300" min="60">
        </div>
        <div class="field">
          <div class="field-label">Cache key override</div>
          <input id="inp-cache-key" placeholder="e.g. my-key">
        </div>
      </div>

      <div class="divider"></div>

      <div class="drawer-sec">
        <div class="drawer-sec-title">Logging</div>
        <div class="toggle-row">
          <span>Collect log</span>
          <div class="tog">
            <input type="checkbox" id="tog-collect-log" checked>
            <div class="tog-track"></div>
            <div class="tog-thumb"></div>
          </div>
        </div>
        <div class="toggle-row">
          <span>Store payload <span style="font-size:11px;color:var(--subtle)">(prompt + response)</span></span>
          <div class="tog">
            <input type="checkbox" id="tog-payload" checked>
            <div class="tog-track"></div>
            <div class="tog-thumb"></div>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="drawer-sec">
        <div class="drawer-sec-title">Retries &amp; Timeout</div>
        <div class="field">
          <div class="field-label">Max attempts (1&ndash;5)</div>
          <input type="number" id="inp-attempts" min="1" max="5" placeholder="default: 1">
        </div>
        <div class="field">
          <div class="field-label">Retry delay (ms)</div>
          <input type="number" id="inp-retry-delay" min="100" max="5000" placeholder="e.g. 500">
        </div>
        <div class="field">
          <div class="field-label">Backoff</div>
          <select id="sel-backoff">
            <option value="">default</option>
            <option value="constant">constant</option>
            <option value="linear">linear</option>
            <option value="exponential">exponential</option>
          </select>
        </div>
        <div class="field">
          <div class="field-label">Request timeout (ms)</div>
          <input type="number" id="inp-timeout" placeholder="e.g. 10000">
        </div>
      </div>

      <div class="divider"></div>

      <div class="drawer-sec">
        <div class="drawer-sec-title">Extra headers <span style="color:var(--subtle);font-size:10px">(escape hatch)</span></div>
        <div id="extra-hdr-list" style="display:flex;flex-direction:column;gap:4px"></div>
        <button class="btn btn-sm" id="add-extra-btn" style="margin-top:4px;align-self:flex-start">+ Add header</button>
      </div>

    </div>
  </div>
</div>

<script>
(function () {
  'use strict';

  console.log('[ui] script parsing started');

  // ── State ────────────────────────────────────────────────────────────────
  var scenarios = [];
  var currentLogId = null;
  var fbChoice = null;
  var isLoading = false;

  // ── Helpers ──────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function autoResize(el) {
    el.style.height = '';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  function scrollToBottom(el) {
    el.scrollTop = el.scrollHeight;
  }

  // ── DOM shortcuts ─────────────────────────────────────────────────────────
  function el(id) { return document.getElementById(id); }

  // ── Settings open / close ────────────────────────────────────────────────
  function openSettings() {
    console.log('[ui] openSettings()');
    el('settings-overlay').style.display = 'flex';
  }

  function closeSettings() {
    console.log('[ui] closeSettings()');
    el('settings-overlay').style.display = 'none';
  }

  // ── Metadata editor ──────────────────────────────────────────────────────
  function addMetaRow(key, val) {
    var editor = el('meta-editor');
    if (editor.children.length >= 5) { return; }
    var row = document.createElement('div');
    row.className = 'meta-row';
    var k = document.createElement('input');
    k.placeholder = 'key';
    k.value = key || '';
    var v = document.createElement('input');
    v.placeholder = 'value';
    v.value = val || '';
    var d = document.createElement('button');
    d.className = 'meta-del';
    d.innerHTML = '&times;';
    d.title = 'Remove';
    d.onclick = function () { row.remove(); };
    row.appendChild(k);
    row.appendChild(v);
    row.appendChild(d);
    editor.appendChild(row);
  }

  function getMetadata() {
    var meta = {};
    var rows = el('meta-editor').querySelectorAll('.meta-row');
    for (var i = 0; i < rows.length; i++) {
      var inputs = rows[i].querySelectorAll('input');
      var key = inputs[0].value.trim();
      var val = inputs[1].value.trim();
      if (!key) { continue; }
      if (val === 'true')  { meta[key] = true; }
      else if (val === 'false') { meta[key] = false; }
      else if (val !== '' && !isNaN(Number(val))) { meta[key] = Number(val); }
      else { meta[key] = val; }
    }
    return Object.keys(meta).length ? meta : undefined;
  }

  // ── Extra headers ─────────────────────────────────────────────────────────
  function addExtraHeader(k, v) {
    var list = el('extra-hdr-list');
    var row = document.createElement('div');
    row.className = 'extra-row';
    var ki = document.createElement('input');
    ki.placeholder = 'cf-aig-header';
    ki.value = k || '';
    ki.style.fontSize = '11px';
    ki.style.padding = '5px 8px';
    var vi = document.createElement('input');
    vi.placeholder = 'value';
    vi.value = v || '';
    vi.style.fontSize = '11px';
    vi.style.padding = '5px 8px';
    var d = document.createElement('button');
    d.className = 'meta-del';
    d.innerHTML = '&times;';
    d.onclick = function () { row.remove(); };
    row.appendChild(ki);
    row.appendChild(vi);
    row.appendChild(d);
    list.appendChild(row);
  }

  function getExtraHeaders() {
    var h = {};
    var rows = el('extra-hdr-list').querySelectorAll('.extra-row');
    for (var i = 0; i < rows.length; i++) {
      var inputs = rows[i].querySelectorAll('input');
      if (inputs[0].value.trim()) { h[inputs[0].value.trim()] = inputs[1].value; }
    }
    return Object.keys(h).length ? h : undefined;
  }

  // ── Build request body ────────────────────────────────────────────────────
  function buildRequest(userContent) {
    var opts = {};
    var ua = el('inp-ua').value.trim();
    if (ua) { opts.userAgent = ua; }
    if (el('tog-skip-cache').checked) { opts.skipCache = true; }
    var ttl = parseInt(el('inp-cache-ttl').value, 10);
    if (ttl > 0) { opts.cacheTtl = ttl; }
    var ck = el('inp-cache-key').value.trim();
    if (ck) { opts.cacheKey = ck; }
    opts.collectLog = el('tog-collect-log').checked;
    opts.collectLogPayload = el('tog-payload').checked;
    var att = parseInt(el('inp-attempts').value, 10);
    if (att >= 1) { opts.maxAttempts = att; }
    var rd = parseInt(el('inp-retry-delay').value, 10);
    if (rd >= 100) { opts.retryDelay = rd; }
    var bo = el('sel-backoff').value;
    if (bo) { opts.backoff = bo; }
    var to = parseInt(el('inp-timeout').value, 10);
    if (to > 0) { opts.requestTimeout = to; }
    var xh = getExtraHeaders();
    if (xh) { opts.extraHeaders = xh; }

    return {
      model: el('inp-model').value.trim() || 'workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      messages: [{ role: 'user', content: userContent }],
      metadata: getMetadata(),
      options: opts
    };
  }

  // ── Scenario cards ────────────────────────────────────────────────────────
  function renderScenarios() {
    var list = el('scenario-list');
    list.innerHTML = '';
    for (var i = 0; i < scenarios.length; i++) {
      (function (s) {
        var card = document.createElement('button');
        card.className = 'sc-card';
        card.innerHTML =

          '<div class="sc-card-name">' + esc(s.name) + '</div>' +
          '<div class="sc-card-desc">' + esc(s.description) + '</div>';
        card.onclick = function () { applyScenario(s); };
        list.appendChild(card);
      })(scenarios[i]);
    }
  }

  function applyScenario(s) {
    console.log('[ui] applying scenario:', s.id);

    // ── 1. Reset config fields ───────────────────────────────────────────
    if (s.request && s.request.model) { el('inp-model').value = s.request.model; }

    // Reset options to defaults, then apply scenario overrides
    el('inp-ua').value            = 'ai-gateway-demo/1.0 (cloudflare-worker)';
    el('inp-cache-ttl').value     = '';
    el('inp-cache-key').value     = '';
    el('tog-skip-cache').checked  = false;
    el('tog-collect-log').checked = true;
    el('tog-payload').checked     = true;
    el('inp-attempts').value      = '';
    el('inp-retry-delay').value   = '';
    el('sel-backoff').value       = '';
    el('inp-timeout').value       = '';

    if (s.request && s.request.options) {
      var o = s.request.options;
      if (o.userAgent)                    { el('inp-ua').value            = o.userAgent; }
      if (o.cacheTtl)                     { el('inp-cache-ttl').value     = o.cacheTtl; }
      if (o.cacheKey)                     { el('inp-cache-key').value     = o.cacheKey; }
      if (o.skipCache)                    { el('tog-skip-cache').checked  = true; }
      if (o.collectLog === false)         { el('tog-collect-log').checked = false; }
      if (o.collectLogPayload === false)  { el('tog-payload').checked     = false; }
      if (o.maxAttempts)                  { el('inp-attempts').value      = o.maxAttempts; }
      if (o.retryDelay)                   { el('inp-retry-delay').value   = o.retryDelay; }
      if (o.backoff)                      { el('sel-backoff').value       = o.backoff; }
      if (o.requestTimeout)               { el('inp-timeout').value       = o.requestTimeout; }
    }

    // ── 2. Reset metadata editor ─────────────────────────────────────────
    el('meta-editor').innerHTML = '';
    if (s.request && s.request.metadata) {
      var keys = Object.keys(s.request.metadata);
      for (var i = 0; i < keys.length; i++) {
        addMetaRow(keys[i], String(s.request.metadata[keys[i]]));
      }
    }

    // ── 3. Pre-fill message ───────────────────────────────────────────────
    if (s.request && s.request.messages && s.request.messages[0]) {
      var inp = el('chat-input');
      inp.value = s.request.messages[0].content;
      autoResize(inp);
    }

    // ── 4. Clear chat + gateway info, show explanation card ──────────────
    var msgs = el('chat-msgs');
    msgs.innerHTML = '';
    currentLogId = null;
    fbChoice = null;

    el('info-panel').innerHTML = '<div class="info-empty"><svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24" style="opacity:.4"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z"/></svg>Response metadata will appear here</div>';

    var card = document.createElement('div');
    card.className = 'msg-info';
    card.innerHTML = '<strong>' + esc(s.name) + '</strong><br>' + esc(s.explanation);
    msgs.appendChild(card);
    scrollToBottom(msgs);
    el('chat-input').focus();
  }

  // ── Chat helpers ──────────────────────────────────────────────────────────
  function removeEmpty() {
    var e = el('chat-empty');
    if (e) { e.remove(); }
  }

  function appendInfo(name, text) {
    removeEmpty();
    var msgs = el('chat-msgs');
    var d = document.createElement('div');
    d.className = 'msg-info';
    d.innerHTML = '<strong>' + esc(name) + '</strong><br>' + esc(text);
    msgs.appendChild(d);
    scrollToBottom(msgs);
  }

  function appendUserBubble(text) {
    removeEmpty();
    var msgs = el('chat-msgs');
    var wrap = document.createElement('div');
    wrap.className = 'msg msg-u';
    var bub = document.createElement('div');
    bub.className = 'bubble';
    bub.textContent = text;
    wrap.appendChild(bub);
    msgs.appendChild(wrap);
    scrollToBottom(msgs);
    return wrap;
  }

  function appendThinking() {
    var msgs = el('chat-msgs');
    var wrap = document.createElement('div');
    wrap.className = 'msg msg-a';
    var bub = document.createElement('div');
    bub.className = 'bubble bubble-thinking';
    bub.textContent = '\u22ef thinking';
    wrap.appendChild(bub);
    msgs.appendChild(wrap);
    scrollToBottom(msgs);
    return wrap;
  }

  function replaceThinkingWithResponse(thinkEl, data) {
    var msgs = el('chat-msgs');
    thinkEl.remove();

    var wrap = document.createElement('div');
    wrap.className = 'msg msg-a';

    var bub = document.createElement('div');
    bub.className = 'bubble';
    bub.textContent = data.message;
    wrap.appendChild(bub);

    if (data.gateway) {
      var gw = data.gateway;
      var meta = document.createElement('div');
      meta.className = 'msg-meta';
      var cs = gw.cacheStatus || 'UNKNOWN';
      meta.innerHTML =
        '<span class="cbadge c-' + cs + '">' + cs + '</span>' +
        (gw.model && gw.model !== el('inp-model').value
          ? '<span style="font-family:var(--mono);font-size:10px">' + esc(gw.model.split('/').pop()) + '</span>'
          : '') +
        '<span>' + gw.latencyMs + 'ms</span>' +
        (gw.usage ? '<span>' + gw.usage.totalTokens + ' tok</span>' : '');
      wrap.appendChild(meta);
    }

    msgs.appendChild(wrap);
    scrollToBottom(msgs);
  }

  function appendError(msg) {
    var msgs = el('chat-msgs');
    var d = document.createElement('div');
    d.className = 'msg-err';
    d.textContent = '\u26a0 ' + msg;
    msgs.appendChild(d);
    scrollToBottom(msgs);
  }

  // ── Gateway info panel ────────────────────────────────────────────────────
  function renderInfo(gw) {
    console.log('[ui] renderInfo', gw);
    var panel = el('info-panel');
    panel.innerHTML = '';
    currentLogId = gw.logId;
    fbChoice = null;

    var cs = gw.cacheStatus || 'UNKNOWN';
    var csColor = { HIT: '#16A34A', MISS: 'var(--muted)', BYPASS: 'var(--warn)', EXPIRED: 'var(--error)', UNKNOWN: 'var(--subtle)' }[cs] || 'var(--subtle)';

    function makeCard(rows) {
      var card = document.createElement('div');
      card.className = 'info-card';
      card.innerHTML = '';
      var rr = document.createElement('div');
      rr.className = 'info-rows';
      for (var i = 0; i < rows.length; i++) {
        var row = document.createElement('div');
        row.className = 'info-row';
        var k = document.createElement('span');
        k.className = 'info-k';
        k.textContent = rows[i][0];
        var v = document.createElement('span');
        v.className = 'info-v';
        if (typeof rows[i][1] === 'string') { v.textContent = rows[i][1]; }
        else { v.appendChild(rows[i][1]); }
        row.appendChild(k);
        row.appendChild(v);
        rr.appendChild(row);
      }
      card.appendChild(rr);
      return card;
    }

    // Card 1 — model / provider / step
    var cacheTag = document.createElement('span');
    cacheTag.className = 'info-tag cbadge c-' + cs;
    cacheTag.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:' + csColor + ';display:inline-block;flex-shrink:0"></span>' + cs;

    var modelRows = [
      ['Model',    gw.model || '\u2014'],
      ['Provider', gw.provider || '\u2014'],
      ['Cache',    cacheTag],
    ];
    if (gw.step) { modelRows.push(['Step', gw.step]); }
    panel.appendChild(makeCard(modelRows));

    // Card 2 — log ID / latency / tokens
    var logSpan = document.createElement('span');
    logSpan.className = 'info-click';
    logSpan.id = 'log-id-el';
    logSpan.title = 'Click to copy';
    logSpan.innerHTML = '<span style="font-size:11px">' + esc((gw.logId || '').slice(0, 18)) + '\u2026</span>' +
      '<svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>' +
      '<span class="copied" id="copied-tip" style="display:none">Copied!</span>';
    logSpan.onclick = function () {
      navigator.clipboard.writeText(gw.logId || '').then(function () {
        var t = el('copied-tip');
        if (t) { t.style.display = 'inline'; setTimeout(function () { t.style.display = 'none'; }, 1800); }
      });
    };

    var diagRows = [['Log ID', logSpan], ['Latency', gw.latencyMs + ' ms']];
    if (gw.usage) {
      diagRows.push(['Tokens', gw.usage.promptTokens + ' \u2192 ' + gw.usage.completionTokens + ' = ' + gw.usage.totalTokens]);
    }
    if (gw.dlp) {
      var dlpObj = (typeof gw.dlp === 'object' && gw.dlp !== null) ? gw.dlp : {};
      var dlpAction = dlpObj.action || (typeof gw.dlp === 'string' ? gw.dlp : 'TRIGGERED');
      var dlpSpan = document.createElement('span');
      dlpSpan.className = 'info-tag';
      if (dlpAction === 'BLOCK') {
        dlpSpan.style.cssText = 'background:rgba(220,38,38,.12);color:var(--error);border:1px solid rgba(220,38,38,.25)';
      } else {
        dlpSpan.style.cssText = 'background:rgba(202,138,4,.12);color:var(--warn);border:1px solid rgba(202,138,4,.25)';
      }
      dlpSpan.textContent = dlpAction;
      diagRows.push(['DLP', dlpSpan]);
    }
    panel.appendChild(makeCard(diagRows));

    // Feedback card
    var fbCard = document.createElement('div');
    fbCard.className = 'info-card';
    fbCard.innerHTML = '';
    var fbLabel = document.createElement('div');
    fbLabel.className = 'info-k';
    fbLabel.textContent = 'Feedback';
    fbLabel.style.marginBottom = '6px';
    fbCard.appendChild(fbLabel);
    var fbRow = document.createElement('div');
    fbRow.className = 'fb-row';
    var upBtn = document.createElement('button');
    upBtn.className = 'fb-btn';
    upBtn.id = 'fb-up';
    upBtn.textContent = '\uD83D\uDC4D';
    upBtn.onclick = function () { setFb(1); };
    var dnBtn = document.createElement('button');
    dnBtn.className = 'fb-btn';
    dnBtn.id = 'fb-dn';
    dnBtn.textContent = '\uD83D\uDC4E';
    dnBtn.onclick = function () { setFb(-1); };
    var scoreInp = document.createElement('input');
    scoreInp.type = 'number';
    scoreInp.id = 'fb-score-inp';
    scoreInp.className = 'fb-score';
    scoreInp.min = '0';
    scoreInp.max = '100';
    scoreInp.placeholder = '0\u2013100';
    var submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn-sm btn-primary';
    submitBtn.textContent = 'Submit';
    submitBtn.onclick = submitFeedback;
    fbRow.appendChild(upBtn);
    fbRow.appendChild(dnBtn);
    fbRow.appendChild(scoreInp);
    fbRow.appendChild(submitBtn);
    fbCard.appendChild(fbRow);
    var fbStatus = document.createElement('div');
    fbStatus.className = 'fb-status';
    fbStatus.id = 'fb-status';
    fbCard.appendChild(fbStatus);
    panel.appendChild(fbCard);
  }

  function setFb(val) {
    fbChoice = val;
    var up = el('fb-up');
    var dn = el('fb-dn');
    if (up) { up.className = 'fb-btn' + (val === 1 ? ' fb-pos' : ''); }
    if (dn) { dn.className = 'fb-btn' + (val === -1 ? ' fb-neg' : ''); }
  }

  function submitFeedback() {
    if (!currentLogId || fbChoice === null) {
      var s = el('fb-status');
      if (s) { s.textContent = 'Pick \uD83D\uDC4D or \uD83D\uDC4E first'; }
      return;
    }
    var score = parseInt((el('fb-score-inp') || {}).value, 10);
    var body = { logId: currentLogId, feedback: fbChoice };
    if (score > 0) { body.score = score; }
    console.log('[ui] submitting feedback', body);
    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); })
      .then(function (d) {
        var s = el('fb-status');
        if (s) { s.textContent = d.ok ? '\u2713 Saved' : 'Error: ' + (d.error || '?'); }
      })
      .catch(function (e) {
        var s = el('fb-status');
        if (s) { s.textContent = 'Error: ' + e; }
      });
  }

  // ── Send message ──────────────────────────────────────────────────────────
  function sendMessage() {
    console.log('[ui] sendMessage() called, isLoading=' + isLoading);
    if (isLoading) { return; }
    var inp = el('chat-input');
    var text = inp.value.trim();
    if (!text) { console.log('[ui] empty message, ignoring'); return; }

    isLoading = true;
    inp.value = '';
    autoResize(inp);
    el('send-btn').disabled = true;

    appendUserBubble(text);
    var thinkEl = appendThinking();

    var body = buildRequest(text);
    console.log('[ui] POST /api/chat', body);

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(function (r) {
        console.log('[ui] response status', r.status);
        return r.json().then(function (d) { return { status: r.status, data: d }; });
      })
      .then(function (res) {
        console.log('[ui] response data', res.data);
        thinkEl.remove();
        if (res.status !== 200) {
          var d = res.data || {};
          // Show DLP block prominently when the gateway blocked the request
          if (d.error === 'dlp_blocked' || d.dlp) {
            var dlpObj = (d.dlp && typeof d.dlp === 'object') ? d.dlp : {};
            var action = dlpObj.action || 'BLOCKED';
            appendError('DLP ' + action + ' — the gateway intercepted this request before it reached the model. Policy: ' + (dlpObj.policyId || dlpObj.policies || 'Source Code profile') + '. Check the AI Gateway logs for the full DLP event.');
            // Still try to render partial gateway info if we have a log ID
            if (d.logId) {
              renderInfo({ logId: d.logId, cacheStatus: 'BYPASS', model: body.model, provider: '', latencyMs: 0, dlp: d.dlp });
            }
          } else {
            appendError((d.message || d.error) || 'HTTP ' + res.status);
          }
        } else {
          replaceThinkingWithResponse(thinkEl, res.data);
          if (res.data.gateway) { renderInfo(res.data.gateway); }
        }
      })
      .catch(function (e) {
        console.error('[ui] fetch error', e);
        thinkEl.remove();
        appendError(String(e));
      })
      .finally(function () {
        isLoading = false;
        el('send-btn').disabled = false;
        inp.focus();
      });
  }

  // ── Traffic generator ─────────────────────────────────────────────────────
  function runTrafficGen() {
    var count = Math.min(50, Math.max(1, parseInt(el('gen-count').value, 10) || 5));
    var delay = Math.max(0, parseInt(el('gen-delay').value, 10) || 500);
    console.log('[ui] burst start', count, 'requests,', delay, 'ms delay');

    removeEmpty();
    var msgs = el('chat-msgs');
    var btn = el('gen-btn');
    if (btn) { btn.disabled = true; }

    // Insert a single live-updating summary block into the chat history
    var summaryEl = document.createElement('div');
    summaryEl.className = 'msg-info';
    summaryEl.innerHTML =
      '<strong>Traffic Burst</strong> &middot; ' + count + ' request' + (count !== 1 ? 's' : '') +
      ' &middot; ' + delay + 'ms apart';
    var linesEl = document.createElement('div');
    linesEl.className = 'burst-lines';
    summaryEl.appendChild(linesEl);
    msgs.appendChild(summaryEl);
    scrollToBottom(msgs);

    (function run(i) {
      if (i >= count) {
        var doneEl = document.createElement('div');
        doneEl.style.cssText = 'color:var(--subtle);margin-top:4px';
        doneEl.textContent = '\u2500 Done (' + count + ' request' + (count !== 1 ? 's' : '') + ')';
        linesEl.appendChild(doneEl);
        scrollToBottom(msgs);
        if (btn) { btn.disabled = false; }
        return;
      }

      var lineEl = document.createElement('div');
      lineEl.style.color = 'var(--subtle)';
      lineEl.textContent = '[' + (i + 1) + '/' + count + '] \u2026';
      linesEl.appendChild(lineEl);
      scrollToBottom(msgs);

      var body = buildRequest('Burst request ' + (i + 1) + ' of ' + count);
      var t0 = Date.now();

      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
        .then(function (r) { return r.json().then(function (d) { return { s: r.status, d: d }; }); })
        .then(function (res) {
          var ms = Date.now() - t0;
          if (res.s === 200 && res.d.gateway) {
            var gw = res.d.gateway;
            var cs = gw.cacheStatus || 'MISS';
            var model = (gw.model || '').split('/').pop() || '?';
            var logSnip = (gw.logId || '').slice(0, 10);
            lineEl.innerHTML =
              '<span style="color:var(--success)">\u2713</span> ' +
              '<span style="color:var(--text)">' + esc(cs) + '</span>' +
              ' &middot; ' + esc(model) +
              ' &middot; ' + ms + 'ms' +
              (logSnip ? ' &middot; <span style="color:var(--subtle)">' + esc(logSnip) + '\u2026</span>' : '');
          } else {
            var errMsg = (res.d && (res.d.message || res.d.error)) ? String(res.d.message || res.d.error) : String(res.s);
            lineEl.innerHTML = '<span style="color:var(--error)">\u2717</span> ' + esc(errMsg.slice(0, 80));
          }
        })
        .catch(function (e) {
          lineEl.innerHTML = '<span style="color:var(--error)">\u2717</span> ' + esc(String(e));
        })
        .finally(function () {
          scrollToBottom(msgs);
          if (delay > 0) {
            setTimeout(function () { run(i + 1); }, delay);
          } else {
            run(i + 1);
          }
        });
    })(0);
  }

  // ── Resizable panels ─────────────────────────────────────────────────────
  function initResizers() {
    var layout   = el('main-layout');
    var leftW    = 252;
    var rightW   = 292;

    function applyWidths() {
      layout.style.gridTemplateColumns =
        leftW + 'px 5px minmax(300px,1fr) 5px ' + rightW + 'px';
    }

    function makeResizer(resizerId, side) {
      var handle = el(resizerId);
      if (!handle) { return; }

      handle.addEventListener('mousedown', function (e) {
        e.preventDefault();
        var startX   = e.clientX;
        var startLeft  = leftW;
        var startRight = rightW;
        handle.classList.add('is-dragging');
        document.body.style.cursor     = 'col-resize';
        document.body.style.userSelect = 'none';

        function onMove(e) {
          var dx = e.clientX - startX;
          if (side === 'left') {
            leftW = Math.max(160, Math.min(520, startLeft + dx));
          } else {
            rightW = Math.max(180, Math.min(520, startRight - dx));
          }
          applyWidths();
        }

        function onUp() {
          handle.classList.remove('is-dragging');
          document.body.style.cursor     = '';
          document.body.style.userSelect = '';
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup',   onUp);
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onUp);
      });
    }

    makeResizer('resizer-left',  'left');
    makeResizer('resizer-right', 'right');
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    console.log('[ui] init() start');
    initResizers();

    // Default metadata
    addMetaRow('userId', 'demo-user');
    addMetaRow('tier', 'free');

    // Model chips
    var modelChips = el('model-chips');
    var models = [
      ['Large \u2014 Llama 3.3 70B', 'workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast'],
      ['Medium \u2014 Llama 3.1 8B FP8', 'workers-ai/@cf/meta/llama-3.1-8b-instruct-fp8'],
      ['Small \u2014 Mistral 7B',    'workers-ai/@cf/mistral/mistral-7b-instruct-v0.1']
    ];
    for (var i = 0; i < models.length; i++) {
      (function (label, val) {
        var c = document.createElement('button');
        c.className = 'chip';
        c.textContent = label;
        c.title = val;
        c.onclick = function () { el('inp-model').value = val; };
        modelChips.appendChild(c);
      })(models[i][0], models[i][1]);
    }

    // User-Agent chips
    var uaChips = el('ua-chips');
    var agents = [
      'ai-gateway-demo/1.0 (cloudflare-worker)',
      'internal-summariser/2.1 (finance-team)',
      'compliance-checker/1.0 (legal)',
      'support-bot/3.0 (customer-success)',
      'ci-pipeline/1.0 (github-actions)',
      'curl/8.7.1'
    ];
    for (var j = 0; j < agents.length; j++) {
      (function (val) {
        var c = document.createElement('button');
        c.className = 'chip';
        c.textContent = val.length > 28 ? val.slice(0, 26) + '\u2026' : val;
        c.title = val;
        c.onclick = function () { el('inp-ua').value = val; };
        uaChips.appendChild(c);
      })(agents[j]);
    }

    // Settings button
    el('settings-btn').onclick = openSettings;
    el('close-settings-btn').onclick = closeSettings;
    el('settings-overlay').onclick = function (e) {
      if (e.target === el('settings-overlay')) { closeSettings(); }
    };

    // Other controls
    el('add-meta-btn').onclick = function () { addMetaRow('', ''); };
    el('add-extra-btn').onclick = function () { addExtraHeader('', ''); };
    el('gen-btn').onclick = runTrafficGen;
    el('clear-btn').onclick = function () {
      el('chat-msgs').innerHTML = '<div class="empty" id="chat-empty"><div class="empty-icon"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"/></svg></div><div class="empty-t">Pick a scenario or send a message</div><div class="empty-s">Healthcare compliance, spend limits, rate limiting, caching, failover &amp; more</div></div>';
      el('info-panel').innerHTML = '<div class="info-empty"><svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24" style="opacity:.4"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z"/></svg>Response metadata will appear here</div>';
    };

    // Send button & keyboard shortcut
    el('send-btn').onclick = sendMessage;
    el('chat-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    el('chat-input').addEventListener('input', function () { autoResize(this); });

    // Load scenarios
    console.log('[ui] fetching /api/scenarios');
    fetch('/api/scenarios')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        console.log('[ui] scenarios loaded:', data.length);
        scenarios = data;
        renderScenarios();
      })
      .catch(function (e) { console.error('[ui] failed to load scenarios:', e); });

    console.log('[ui] init() complete');
  }

  // DOMContentLoaded fires before a bottom-of-body <script> runs in most
  // cases — so check readyState and fall through to init() directly.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  console.log('[ui] script parse complete');

})();
</script>
</body>
</html>`;
