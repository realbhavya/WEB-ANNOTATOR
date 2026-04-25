/* ───────────────────────────────────────────────────────
 * WebAnnotator — Floating Toolbar (top frame only)
 * ─────────────────────────────────────────────────────── */

(function () {
  'use strict';

  WA.toolbar = {

    el: null,
    collapsed: false,

    create: function () {
      if (!WA.isTopFrame) return;
      if (WA.toolbar.el) return;

      var tb = document.createElement('div');
      tb.className = 'wa-toolbar';
      tb.setAttribute(WA.UI_ATTR, 'true');
      tb.style.zIndex = WA.Z_TOP;

      /* ── SVG icons ──────────────────────────────── */
      var icons = {
        cursor:    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l7 18 2.5-7.5L21 12z"/></svg>',
        highlight: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z"/></svg>',
        note:      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
        rect:      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="1"/></svg>',
        circle:    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>',
        clear:     '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V3h6v3"/></svg>',
        collapse:  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
        expand:    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z"/></svg>'
      };

      /* ── collapsed pill ────────────────────────── */
      var pill = document.createElement('div');
      pill.className = 'wa-toolbar-pill';
      pill.setAttribute(WA.UI_ATTR, 'true');
      pill.innerHTML = icons.expand;
      pill.title = 'Expand WebAnnotator';
      pill.classList.add('wa-hidden');

      /* ── full bar ──────────────────────────────── */
      var bar = document.createElement('div');
      bar.className = 'wa-toolbar-bar';
      bar.setAttribute(WA.UI_ATTR, 'true');

      /* drag handle */
      var drag = document.createElement('div');
      drag.className = 'wa-toolbar-drag';
      drag.setAttribute(WA.UI_ATTR, 'true');
      drag.innerHTML = '⠿';
      drag.title = 'Drag toolbar';
      bar.appendChild(drag);

      /* separator */
      bar.appendChild(makeSep());

      /* mode buttons */
      var modes = [
        { id: 'cursor',    icon: icons.cursor,    tip: 'Cursor (browse normally)' },
        { id: 'highlight', icon: icons.highlight,  tip: 'Highlight text' },
        { id: 'note',      icon: icons.note,      tip: 'Add sticky note' },
        { id: 'rectangle', icon: icons.rect,      tip: 'Draw rectangle' },
        { id: 'circle',    icon: icons.circle,    tip: 'Draw circle' }
      ];

      modes.forEach(function (m) {
        var btn = document.createElement('button');
        btn.className = 'wa-tb-btn' + (m.id === WA.currentMode ? ' wa-active' : '');
        btn.setAttribute(WA.UI_ATTR, 'true');
        btn.setAttribute('data-mode', m.id);
        btn.innerHTML = m.icon;
        btn.title = m.tip;
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          WA.toolbar.setMode(m.id);
        });
        bar.appendChild(btn);
      });

      /* separator */
      bar.appendChild(makeSep());

      /* color picker */
      var colorWrap = document.createElement('div');
      colorWrap.className = 'wa-color-wrap';
      colorWrap.setAttribute(WA.UI_ATTR, 'true');

      var colorPreview = document.createElement('div');
      colorPreview.className = 'wa-color-preview';
      colorPreview.style.backgroundColor = WA.currentColor;
      colorPreview.setAttribute(WA.UI_ATTR, 'true');

      var colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.className = 'wa-color-input';
      colorInput.value = WA.currentColor;
      colorInput.setAttribute(WA.UI_ATTR, 'true');
      colorInput.title = 'Pick annotation color';
      colorInput.addEventListener('input', function () {
        WA.currentColor = colorInput.value;
        colorPreview.style.backgroundColor = colorInput.value;
        chrome.runtime.sendMessage({ action: 'wa-setColor', color: colorInput.value });
      });

      colorWrap.appendChild(colorPreview);
      colorWrap.appendChild(colorInput);
      bar.appendChild(colorWrap);

      /* separator */
      bar.appendChild(makeSep());

      /* clear all */
      var clearBtn = document.createElement('button');
      clearBtn.className = 'wa-tb-btn wa-tb-clear';
      clearBtn.setAttribute(WA.UI_ATTR, 'true');
      clearBtn.innerHTML = icons.clear;
      clearBtn.title = 'Clear all annotations';
      clearBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (confirm('Remove all annotations on this page?')) {
          chrome.runtime.sendMessage({ action: 'wa-clearAll' });
        }
      });
      bar.appendChild(clearBtn);

      /* separator */
      bar.appendChild(makeSep());

      /* collapse */
      var collapseBtn = document.createElement('button');
      collapseBtn.className = 'wa-tb-btn wa-tb-collapse';
      collapseBtn.setAttribute(WA.UI_ATTR, 'true');
      collapseBtn.innerHTML = icons.collapse;
      collapseBtn.title = 'Collapse toolbar';
      collapseBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        bar.classList.add('wa-hidden');
        pill.classList.remove('wa-hidden');
        WA.toolbar.collapsed = true;
      });
      bar.appendChild(collapseBtn);

      /* pill click → expand (but not after a drag) */
      pill.addEventListener('click', function (e) {
        e.stopPropagation();
        if (WA.toolbar._wasDragged) { WA.toolbar._wasDragged = false; return; }
        pill.classList.add('wa-hidden');
        bar.classList.remove('wa-hidden');
        WA.toolbar.collapsed = false;
      });

      tb.appendChild(bar);
      tb.appendChild(pill);
      document.body.appendChild(tb);
      WA.toolbar.el = tb;

      /* ── dragging ─────────────────────────────── */
      makeDraggable(tb, drag, pill);
    },

    /* Switch active mode (visual + broadcast) */
    setMode: function (mode) {
      WA.currentMode = mode;

      /* update active button */
      var btns = document.querySelectorAll('.wa-tb-btn[data-mode]');
      btns.forEach(function (b) {
        b.classList.toggle('wa-active', b.getAttribute('data-mode') === mode);
      });

      /* broadcast to all frames */
      chrome.runtime.sendMessage({ action: 'wa-setMode', mode: mode });
    }
  };

  /* ── helpers ─────────────────────────────────────── */
  function makeSep() {
    var s = document.createElement('div');
    s.className = 'wa-tb-sep';
    s.setAttribute(WA.UI_ATTR, 'true');
    return s;
  }

  function makeDraggable(container, handle1, handle2) {
    var dragging = false, pending = false, sx, sy, sl, st;

    function down(e) {
      pending = true;
      dragging = false;
      sx = e.clientX; sy = e.clientY;
      var rect = container.getBoundingClientRect();
      sl = rect.left; st = rect.top;
      e.preventDefault();
    }
    handle1.addEventListener('mousedown', down, true);
    handle2.addEventListener('mousedown', down, true);

    document.addEventListener('mousemove', function (e) {
      if (!pending && !dragging) return;
      var dx = e.clientX - sx;
      var dy = e.clientY - sy;
      /* only start actual drag after 4px of movement */
      if (!dragging) {
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        dragging = true;
        pending = false;
      }
      var nx = sl + dx;
      var ny = st + dy;
      /* clamp to viewport */
      nx = Math.max(0, Math.min(window.innerWidth  - 40, nx));
      ny = Math.max(0, Math.min(window.innerHeight - 40, ny));
      container.style.left = nx + 'px';
      container.style.top  = ny + 'px';
      container.style.right  = 'auto';
      container.style.bottom = 'auto';
    }, true);

    document.addEventListener('mouseup', function () {
      if (dragging) {
        WA.toolbar._wasDragged = true;  /* tell click handler to skip */
      }
      dragging = false;
      pending = false;
    }, true);
  }
})();
