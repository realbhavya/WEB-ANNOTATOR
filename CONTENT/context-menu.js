/* ───────────────────────────────────────────────────────
 * WebAnnotator — Right-click "Delete annotation" menu
 * ─────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var menuEl = null;

  function ensureMenu() {
    if (menuEl) return menuEl;
    menuEl = document.createElement('div');
    menuEl.className = 'wa-context-menu';
    menuEl.setAttribute(WA.UI_ATTR, 'true');
    menuEl.style.display = 'none';
    menuEl.style.zIndex  = WA.Z_TOP;
    document.body.appendChild(menuEl);

    /* dismiss on any click outside */
    document.addEventListener('mousedown', function (e) {
      if (menuEl.style.display === 'none') return;
      if (menuEl.contains(e.target)) return;
      WA.contextMenu.hide();
    }, true);

    return menuEl;
  }

  WA.contextMenu = {
    show: function (pageX, pageY, annotationId, annotationType) {
      var m = ensureMenu();
      m.innerHTML =
        '<button class="wa-ctx-btn" ' + WA.UI_ATTR + '="true">' +
          '<span class="wa-ctx-icon">🗑</span> Delete annotation' +
        '</button>';
      m.style.left    = pageX + 'px';
      m.style.top     = pageY + 'px';
      m.style.display = 'block';

      m.querySelector('.wa-ctx-btn').onclick = function (e) {
        e.stopPropagation();
        switch (annotationType) {
          case 'highlight': WA.highlights.remove(annotationId); break;
          case 'note':      WA.notes.remove(annotationId);      break;
          case 'shape':     WA.shapes.remove(annotationId);     break;
        }
        WA.contextMenu.hide();
      };
    },

    hide: function () {
      if (menuEl) menuEl.style.display = 'none';
    }
  };
})();
