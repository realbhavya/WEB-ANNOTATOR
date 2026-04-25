/* ───────────────────────────────────────────────────────
 * WebAnnotator — Main initialisation & event wiring
 * Runs in EVERY frame (top + iframes).
 * ─────────────────────────────────────────────────────── */

(function () {
  'use strict';

  /* ── init ──────────────────────────────────────────── */
  WA.shapes.init();

  /* Toolbar only in top frame */
  WA.toolbar.create();

  /* Load saved annotations, then restore them.
     For dynamic pages the DOM may not have all content yet,
     so we retry highlight restoration a few times. */
  WA.storage.load(function () {
    WA.notes.restoreAll();
    WA.shapes.restoreAll();

    /* restore highlights with retries for dynamic content */
    var restored = WA.highlights.restoreAll();
    var expected = WA.annotations.highlights.length;

    if (restored < expected) {
      var retries = 0;
      var maxRetries = 5;
      var retryDelays = [500, 1000, 2000, 3000, 5000];

      function retryRestore() {
        if (retries >= maxRetries) return;
        setTimeout(function () {
          /* remove previously restored highlights to avoid duplicates */
          WA.highlights.removeAllDOM();
          var count = WA.highlights.restoreAll();
          retries++;
          if (count < expected && retries < maxRetries) {
            retryRestore();
          }
        }, retryDelays[retries] || 2000);
      }
      retryRestore();
    }
  });

  /* ── mode-aware event listeners (capture phase) ──── */

  /* Highlight: listen for mouseup → create highlight from selection */
  document.addEventListener('mouseup', function (e) {
    if (WA.currentMode !== 'highlight') return;
    if (e.target && e.target.closest && e.target.closest('[' + WA.UI_ATTR + ']')) return;
    /* small delay so the selection is finalised */
    setTimeout(function () { WA.highlights.create(); }, 10);
  }, true);

  /* Note: click to place */
  document.addEventListener('click', function (e) {
    if (WA.currentMode !== 'note') return;
    if (e.target && e.target.closest && e.target.closest('[' + WA.UI_ATTR + ']')) return;
    WA.notes.create(e.pageX, e.pageY);
    e.preventDefault();
    e.stopPropagation();
  }, true);

  /* Shapes: mouse events on the overlay */
  document.addEventListener('mousedown', function (e) {
    if (WA.currentMode !== 'rectangle' && WA.currentMode !== 'circle') return;
    if (e.target && e.target.closest && e.target.closest('[' + WA.UI_ATTR + ']:not(.wa-shapes-overlay)')) return;
    WA.shapes.onMouseDown(e);
  }, true);

  document.addEventListener('mousemove', function (e) {
    WA.shapes.onMouseMove(e);
  }, true);

  document.addEventListener('mouseup', function (e) {
    WA.shapes.onMouseUp(e);
  }, true);

  /* Right-click on highlights → context menu */
  document.addEventListener('contextmenu', function (e) {
    /* Check if right-clicked on a highlight span */
    var hlEl = e.target && e.target.closest ? e.target.closest('.wa-highlight') : null;
    if (hlEl) {
      e.preventDefault();
      e.stopPropagation();
      WA.contextMenu.show(e.pageX, e.pageY, hlEl.getAttribute('data-wa-id'), 'highlight');
      return;
    }

    /* Check shapes via hit test */
    var shapeId = WA.shapes.hitTest(e.pageX, e.pageY);
    if (shapeId) {
      e.preventDefault();
      e.stopPropagation();
      WA.contextMenu.show(e.pageX, e.pageY, shapeId, 'shape');
      return;
    }
  }, true);

  /* Update cursor based on current mode */
  function updateCursor() {
    switch (WA.currentMode) {
      case 'highlight':
        document.body.style.cursor = 'text';
        WA.shapes.disableDrawing();
        break;
      case 'note':
        document.body.style.cursor = 'crosshair';
        WA.shapes.disableDrawing();
        break;
      case 'rectangle':
      case 'circle':
        document.body.style.cursor = '';
        WA.shapes.enableDrawing();
        break;
      default:
        document.body.style.cursor = '';
        WA.shapes.disableDrawing();
    }
  }

  /* ── message handling (from background worker) ───── */
  chrome.runtime.onMessage.addListener(function (msg) {
    switch (msg.action) {
      case 'wa-modeChanged':
        WA.currentMode = msg.mode;
        updateCursor();
        /* sync toolbar buttons if we are top frame */
        if (WA.isTopFrame) {
          var btns = document.querySelectorAll('.wa-tb-btn[data-mode]');
          btns.forEach(function (b) {
            b.classList.toggle('wa-active', b.getAttribute('data-mode') === msg.mode);
          });
        }
        break;

      case 'wa-colorChanged':
        WA.currentColor = msg.color;
        if (WA.isTopFrame) {
          var preview = document.querySelector('.wa-color-preview');
          if (preview) preview.style.backgroundColor = msg.color;
          var input = document.querySelector('.wa-color-input');
          if (input) input.value = msg.color;
        }
        break;

      case 'wa-clearAll':
        WA.highlights.removeAllDOM();
        WA.notes.removeAllDOM();
        WA.shapes.removeAllDOM();
        WA.storage.clear();
        break;
    }
  });

  /* Initial cursor state */
  updateCursor();

})();
