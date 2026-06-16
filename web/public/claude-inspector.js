/* Claude Inspector — a dev-only visual picker.
 *
 * Activate it on a running localhost page (see CLAUDE-INSPECTOR.md), click any
 * element, type what you want changed, and it hands Claude a precise descriptor
 * (selector + classes + text + computed styles) so Claude can edit the real
 * source. Writes to .claude/selection.json via /api/__claude_inspect when
 * available, and always copies a paste-ready block to your clipboard.
 *
 * Not bundled into the app. Nothing here ships to production.
 */
(() => {
  if (window.__claudeInspector) {
    window.__claudeInspector.toggle();
    return;
  }

  const IGNORE = "data-claude-ui";
  let active = false;
  let hovered = null;

  // ---- UI -----------------------------------------------------------------
  const ui = (tag, css, parent) => {
    const el = document.createElement(tag);
    el.setAttribute(IGNORE, "");
    el.style.cssText = css;
    (parent || document.body).appendChild(el);
    return el;
  };

  const box = ui(
    "div",
    "position:fixed;z-index:2147483646;pointer-events:none;border:2px solid #6366f1;background:rgba(99,102,241,.12);border-radius:2px;display:none;transition:all .03s linear;",
  );
  const tip = ui(
    "div",
    "position:fixed;z-index:2147483647;pointer-events:none;background:#111;color:#fff;font:11px/1.4 ui-monospace,monospace;padding:3px 6px;border-radius:4px;display:none;max-width:340px;",
  );
  const btn = ui(
    "button",
    "position:fixed;bottom:16px;left:16px;z-index:2147483647;background:#111;color:#fff;border:0;border-radius:999px;font:600 13px/1 system-ui;padding:10px 16px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.3);",
  );
  btn.textContent = "🎯 Inspect: off";
  btn.onclick = () => api.toggle();

  // ---- selector + descriptor ---------------------------------------------
  const isOurs = (el) => !el || el.hasAttribute?.(IGNORE);

  const cssPath = (el) => {
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node !== document.body && parts.length < 6) {
      let sel = node.tagName.toLowerCase();
      if (node.id) {
        sel = `#${CSS.escape(node.id)}`;
        parts.unshift(sel);
        break;
      }
      const sibs = node.parentNode
        ? [...node.parentNode.children].filter((c) => c.tagName === node.tagName)
        : [];
      if (sibs.length > 1) sel += `:nth-of-type(${sibs.indexOf(node) + 1})`;
      parts.unshift(sel);
      node = node.parentElement;
    }
    return parts.join(" > ");
  };

  const STYLE_KEYS = [
    "color", "backgroundColor", "fontSize", "fontWeight", "fontFamily",
    "lineHeight", "letterSpacing", "textAlign", "display", "flexDirection",
    "justifyContent", "alignItems", "gap", "padding", "margin", "width",
    "height", "borderRadius", "border", "boxShadow", "opacity", "position",
  ];

  const describe = (el) => {
    const cs = getComputedStyle(el);
    const styles = {};
    for (const k of STYLE_KEYS) {
      const v = cs[k];
      if (v && v !== "none" && v !== "normal" && v !== "auto" && v !== "0px")
        styles[k] = v;
    }
    const attrs = {};
    for (const a of el.attributes) {
      if (/^(href|src|alt|title|aria-|data-)/.test(a.name) && a.name !== IGNORE)
        attrs[a.name] = a.value.slice(0, 120);
    }
    const r = el.getBoundingClientRect();
    return {
      selector: cssPath(el),
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: el.className?.toString?.() || "",
      text: (el.innerText || "").trim().slice(0, 160),
      attrs,
      styles,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      outerHTML: el.outerHTML.slice(0, 200),
      url: location.pathname,
    };
  };

  const toBlock = (d, request) =>
    `[claude-inspect] ${location.pathname}\n` +
    `request: ${request || "(describe the change you want)"}\n` +
    `selector: ${d.selector}\n` +
    `tag: ${d.tag}${d.id ? "  id: " + d.id : ""}\n` +
    `classes: ${d.classes}\n` +
    `text: ${JSON.stringify(d.text)}\n` +
    `styles: ${Object.entries(d.styles).map(([k, v]) => `${k}:${v}`).join("; ")}\n` +
    `rect: ${d.rect.x},${d.rect.y} ${d.rect.w}x${d.rect.h}`;

  // ---- selection panel ----------------------------------------------------
  const select = (el) => {
    const d = describe(el);
    const panel = ui(
      "div",
      "position:fixed;bottom:64px;left:16px;z-index:2147483647;width:340px;background:#fff;color:#111;border:1px solid #e4e4e7;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.25);font:13px/1.5 system-ui;overflow:hidden;",
    );
    panel.innerHTML =
      `<div ${IGNORE} style="background:#111;color:#fff;padding:8px 12px;font-weight:600;display:flex;justify-content:space-between;align-items:center">` +
      `<span>&lt;${d.tag}&gt; ${d.classes ? d.classes.split(" ")[0] + "…" : ""}</span>` +
      `<span ${IGNORE} data-x style="cursor:pointer;opacity:.7">✕</span></div>` +
      `<div ${IGNORE} style="padding:12px">` +
      `<div ${IGNORE} style="font:11px/1.4 ui-monospace,monospace;color:#71717a;background:#f4f4f5;padding:6px 8px;border-radius:6px;margin-bottom:8px;word-break:break-all">${d.selector}</div>` +
      `<textarea ${IGNORE} data-req placeholder="What do you want changed? e.g. 'make this heading larger and red'" style="width:100%;box-sizing:border-box;height:64px;border:1px solid #e4e4e7;border-radius:8px;padding:8px;font:13px system-ui;resize:vertical"></textarea>` +
      `<button ${IGNORE} data-send style="margin-top:8px;width:100%;background:#111;color:#fff;border:0;border-radius:8px;padding:9px;font-weight:600;cursor:pointer">Save selection for Claude</button>` +
      `<div ${IGNORE} data-status style="margin-top:8px;font-size:12px;color:#16a34a;min-height:16px"></div>` +
      `</div>`;

    const status = panel.querySelector("[data-status]");
    panel.querySelector("[data-x]").onclick = () => panel.remove();
    panel.querySelector("[data-send]").onclick = async () => {
      const request = panel.querySelector("[data-req]").value.trim();
      const block = toBlock(d, request);
      let saved = false;
      try {
        const res = await fetch("/api/claude-inspect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...d, request, ts: new Date().toISOString() }),
        });
        saved = res.ok;
      } catch {}
      try {
        await navigator.clipboard.writeText(block);
      } catch {}
      status.textContent = saved
        ? "✓ Saved to .claude/selection.json + clipboard. Tell Claude to go."
        : "✓ Copied to clipboard. Paste it to Claude.";
    };
    panel.querySelector("[data-req]").focus();
  };

  // ---- events -------------------------------------------------------------
  const onMove = (e) => {
    if (!active) return;
    const el = e.target;
    if (isOurs(el)) {
      box.style.display = tip.style.display = "none";
      hovered = null;
      return;
    }
    hovered = el;
    const r = el.getBoundingClientRect();
    box.style.cssText += `;display:block;left:${r.x}px;top:${r.y}px;width:${r.width}px;height:${r.height}px`;
    tip.style.display = "block";
    tip.textContent = `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).join(".") : ""}`;
    tip.style.left = r.x + "px";
    tip.style.top = Math.max(0, r.y - 24) + "px";
  };

  const onClick = (e) => {
    if (!active || isOurs(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    select(hovered || e.target);
  };

  // ---- public API ---------------------------------------------------------
  const api = {
    toggle() {
      active = !active;
      btn.textContent = `🎯 Inspect: ${active ? "on" : "off"}`;
      btn.style.background = active ? "#6366f1" : "#111";
      document.body.style.cursor = active ? "crosshair" : "";
      if (!active) box.style.display = tip.style.display = "none";
    },
  };
  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("click", onClick, true);
  window.__claudeInspector = api;
  api.toggle();
  console.log("%cClaude Inspector ready", "color:#6366f1;font-weight:bold");
})();
