/* ───────────────────────────────────────────────────────
 * WebAnnotator — Rectangle & Circle Drawing
 * ─────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var overlay     = null;   // full-page container for shapes
  var isDrawing   = false;
  var startX      = 0;
  var startY      = 0;
  var previewEl   = null;

  WA.shapes = {

    /* Create container once per frame */
    init: function () {
      if (overlay) return;
      overlay = document.createElement('div');
      overlay.className = 'wa-shapes-overlay';
      overlay.setAttribute(WA.UI_ATTR, 'true');
      overlay.style.cssText =
        'position:absolute;top:0;left:0;width:100%;min-height:100%;' +
        'pointer-events:none;z-index:' + WA.Z_SHAPE + ';';
      document.body.appendChild(overlay);

      /* Keep overlay sized to full document */
      function resize() {
        overlay.style.height = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight
        ) + 'px';
      }
      resize();
      window.addEventListener('resize', resize);
      new MutationObserver(resize).observe(document.body, { childList: true, subtree: true });
    },

    /* Enable pointer capture on the overlay (during draw modes) */
    enableDrawing: function () {
      if (!overlay) return;
      overlay.style.pointerEvents = 'auto';
      overlay.style.cursor = 'crosshair';
    },

    disableDrawing: function () {
      if (!overlay) return;
      overlay.style.pointerEvents = 'none';
      overlay.style.cursor = '';
    },

    /* ── mouse handlers (called from main.js) ─────── */
    onMouseDown: function (e) {
      if (WA.currentMode !== 'rectangle' && WA.currentMode !== 'circle') return;
      isDrawing = true;
      startX = e.pageX;
      startY = e.pageY;

      previewEl = document.createElement('div');
      previewEl.className = 'wa-shape wa-shape-' + WA.currentMode;
      previewEl.setAttribute(WA.UI_ATTR, 'true');
      previewEl.style.position  = 'absolute';
      previewEl.style.border    = '2px solid ' + WA.currentColor;
      previewEl.style.boxSizing = 'border-box';
      previewEl.style.pointerEvents = 'none';
      if (WA.currentMode === 'circle') previewEl.style.borderRadius = '50%';
      overlay.appendChild(previewEl);

      e.preventDefault();
      e.stopPropagation();
    },

    onMouseMove: function (e) {
      if (!isDrawing || !previewEl) return;
      var x = Math.min(startX, e.pageX);
      var y = Math.min(startY, e.pageY);
      var w = Math.abs(e.pageX - startX);
      var h = Math.abs(e.pageY - startY);
      previewEl.style.left   = x + 'px';
      previewEl.style.top    = y + 'px';
      previewEl.style.width  = w + 'px';
      previewEl.style.height = h + 'px';
      e.preventDefault();
      e.stopPropagation();
    },

    onMouseUp: function (e) {
      if (!isDrawing || !previewEl) return;
      isDrawing = false;

      var x = Math.min(startX, e.pageX);
      var y = Math.min(startY, e.pageY);
      var w = Math.abs(e.pageX - startX);
      var h = Math.abs(e.pageY - startY);

      /* ignore tiny accidental drags */
      if (w < 5 && h < 5) { previewEl.remove(); previewEl = null; return; }

      var id    = WA.generateId();
      var type  = WA.currentMode;      // 'rectangle' | 'circle'
      previewEl.setAttribute('data-wa-id', id);

      var shape = {
        id:        id,
        type:      type,
        x:         x,
        y:         y,
        width:     w,
        height:    h,
        color:     WA.currentColor,
        timestamp: Date.now()
      };

      WA.annotations.shapes.push(shape);
      WA.storage.save();
      previewEl = null;
      e.preventDefault();
      e.stopPropagation();
    },

    /* ── render a saved shape ─────────────────────── */
    render: function (shape) {
      if (!overlay) WA.shapes.init();
      var el = document.createElement('div');
      el.className = 'wa-shape wa-shape-' + shape.type;
      el.setAttribute(WA.UI_ATTR, 'true');
      el.setAttribute('data-wa-id', shape.id);
      el.style.position    = 'absolute';
      el.style.left        = shape.x + 'px';
      el.style.top         = shape.y + 'px';
      el.style.width       = shape.width + 'px';
      el.style.height      = shape.height + 'px';
      el.style.border      = '2px solid ' + shape.color;
      el.style.boxSizing   = 'border-box';
      el.style.pointerEvents = 'none';
      if (shape.type === 'circle') el.style.borderRadius = '50%';
      overlay.appendChild(el);
    },

    remove: function (id) {
      if (!overlay) return;
      var el = overlay.querySelector('[data-wa-id="' + id + '"]');
      if (el) el.remove();
      WA.annotations.shapes = WA.annotations.shapes.filter(function (s) { return s.id !== id; });
      WA.storage.save();
    },

    restoreAll: function () {
      for (var i = 0; i < WA.annotations.shapes.length; i++) {
        WA.shapes.render(WA.annotations.shapes[i]);
      }
    },

    removeAllDOM: function () {
      if (!overlay) return;
      overlay.querySelectorAll('.wa-shape').forEach(function (el) { el.remove(); });
    },

    /** Check if (px, py) hits any shape border (within tolerance) */
    hitTest: function (px, py) {
      if (!overlay) return null;
      var shapes = overlay.querySelectorAll('.wa-shape');
      var tolerance = 8;

      for (var i = shapes.length - 1; i >= 0; i--) {
        var el = shapes[i];
        var sx = parseFloat(el.style.left);
        var sy = parseFloat(el.style.top);
        var sw = parseFloat(el.style.width);
        var sh = parseFloat(el.style.height);

        /* check proximity to border edges */
        var nearLeft   = Math.abs(px - sx) <= tolerance && py >= sy - tolerance && py <= sy + sh + tolerance;
        var nearRight  = Math.abs(px - (sx + sw)) <= tolerance && py >= sy - tolerance && py <= sy + sh + tolerance;
        var nearTop    = Math.abs(py - sy) <= tolerance && px >= sx - tolerance && px <= sx + sw + tolerance;
        var nearBottom = Math.abs(py - (sy + sh)) <= tolerance && px >= sx - tolerance && px <= sx + sw + tolerance;

        if (nearLeft || nearRight || nearTop || nearBottom) {
          return el.getAttribute('data-wa-id');
        }
      }
      return null;
    }
  };
})();
