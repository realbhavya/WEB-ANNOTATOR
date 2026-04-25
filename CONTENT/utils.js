/* ───────────────────────────────────────────────────────
 * WebAnnotator — Shared utilities & global state
 * ─────────────────────────────────────────────────────── */

window.WA = window.WA || {};

/* ── Unique ID generator ────────────────────────────── */
WA.generateId = function () {
  return 'wa-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
};

/* ── Storage key — strip hash so anchors share storage */
WA.getStorageKey = function () {
  var url = new URL(window.location.href);
  url.hash = '';
  return 'wa_' + url.toString();
};

/* ── Frame detection ─────────────────────────────────── */
WA.isTopFrame = (function () {
  try { return window.self === window.top; } catch (e) { return false; }
})();

/* ── Shared mutable state ────────────────────────────── */
WA.currentMode  = 'cursor';
WA.currentColor = '#ffd54f';
WA.annotations  = { highlights: [], notes: [], shapes: [] };

/* ── Constants ───────────────────────────────────────── */
WA.UI_ATTR  = 'data-wa-ui';      // marks every DOM node we own
WA.Z_TOP    = 2147483647;         // toolbar / context-menu
WA.Z_SHAPE  = 2147483644;         // shapes overlay
WA.Z_NOTE   = 2147483645;         // notes
WA.CONTEXT_LEN = 100;             // chars of prefix / suffix stored
