/* ───────────────────────────────────────────────────────
 * WebAnnotator — Sticky Notes
 * ─────────────────────────────────────────────────────── */

(function () {
  'use strict';

  WA.notes = {

    /* Place a new note at page coordinates (x, y) */
    create: function (x, y) {
      var note = {
        id:        WA.generateId(),
        x:         x,
        y:         y,
        content:   '',
        color:     WA.currentColor,
        timestamp: Date.now()
      };
      WA.annotations.notes.push(note);
      WA.notes.render(note);
      WA.storage.save();
    },

    /* Build & insert the note element */
    render: function (note) {
      var el = document.createElement('div');
      el.className = 'wa-note';
      el.setAttribute(WA.UI_ATTR, 'true');
      el.setAttribute('data-wa-id', note.id);
      el.style.left     = note.x + 'px';
      el.style.top      = note.y + 'px';
      el.style.zIndex   = WA.Z_NOTE;
      el.style.borderTopColor = note.color;

      el.innerHTML =
        '<div class="wa-note-header" ' + WA.UI_ATTR + '="true">' +
          '<span class="wa-note-drag" ' + WA.UI_ATTR + '="true">⠿</span>' +
          '<button class="wa-note-close" ' + WA.UI_ATTR + '="true">×</button>' +
        '</div>' +
        '<textarea class="wa-note-text" ' + WA.UI_ATTR + '="true" placeholder="Type a note…">' +
          escapeHTML(note.content) +
        '</textarea>';

      document.body.appendChild(el);

      /* ── dragging via header ─────────────────────── */
      var header    = el.querySelector('.wa-note-header');
      var dragging  = false;
      var sx, sy, sl, st;

      header.addEventListener('mousedown', function (e) {
        dragging = true;
        sx = e.clientX; sy = e.clientY;
        sl = parseInt(el.style.left) || 0;
        st = parseInt(el.style.top)  || 0;
        e.preventDefault();
        e.stopPropagation();
      }, true);

      document.addEventListener('mousemove', function (e) {
        if (!dragging) return;
        el.style.left = (sl + e.clientX - sx) + 'px';
        el.style.top  = (st + e.clientY - sy) + 'px';
      }, true);

      document.addEventListener('mouseup', function () {
        if (!dragging) return;
        dragging = false;
        note.x = parseInt(el.style.left);
        note.y = parseInt(el.style.top);
        WA.storage.save();
      }, true);

      /* ── save text on input ─────────────────────── */
      var ta = el.querySelector('.wa-note-text');
      ta.addEventListener('input', function () {
        note.content = ta.value;
        WA.storage.save();
      });

      /* ── close button ───────────────────────────── */
      el.querySelector('.wa-note-close').addEventListener('click', function (e) {
        e.stopPropagation();
        WA.notes.remove(note.id);
      });

      /* ── right-click → delete menu ──────────────── */
      el.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        e.stopPropagation();
        WA.contextMenu.show(e.pageX, e.pageY, note.id, 'note');
      }, true);
    },

    /* Remove note from DOM + storage */
    remove: function (id) {
      var el = document.querySelector('.wa-note[data-wa-id="' + id + '"]');
      if (el) el.remove();
      WA.annotations.notes = WA.annotations.notes.filter(function (n) { return n.id !== id; });
      WA.storage.save();
    },

    restoreAll: function () {
      for (var i = 0; i < WA.annotations.notes.length; i++) {
        WA.notes.render(WA.annotations.notes[i]);
      }
    },

    removeAllDOM: function () {
      document.querySelectorAll('.wa-note').forEach(function (el) { el.remove(); });
    }
  };

  function escapeHTML(s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }
})();
