/* ───────────────────────────────────────────────────────
 * WebAnnotator — chrome.storage.local persistence
 *
 * Saves immediately on every mutation and flushes on
 * beforeunload so data survives page refreshes.
 * ─────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var _saveTimer = null;

  WA.storage = {

    /* Save annotations — short debounce to coalesce rapid changes,
       but always flush before page unloads (see bottom of file). */
    save: function () {
      clearTimeout(_saveTimer);
      _saveTimer = setTimeout(function () {
        WA.storage._write();
      }, 100);
    },

    /* Immediate, non-debounced write */
    _write: function () {
      clearTimeout(_saveTimer);
      var key  = WA.getStorageKey();
      var data = {};
      try {
        data[key] = JSON.parse(JSON.stringify(WA.annotations));
      } catch (err) {
        console.error('[WebAnnotator] Failed to serialize annotations:', err);
        return;
      }
      chrome.storage.local.set(data, function () {
        if (chrome.runtime.lastError) {
          console.error('[WebAnnotator] Storage write error:', chrome.runtime.lastError.message);
        }
      });
    },

    /* Load annotations for this URL, then invoke callback */
    load: function (callback) {
      var key = WA.getStorageKey();
      chrome.storage.local.get(key, function (result) {
        if (chrome.runtime.lastError) {
          console.error('[WebAnnotator] Storage read error:', chrome.runtime.lastError.message);
        }
        if (result && result[key]) {
          WA.annotations = result[key];
          /* Sanity: make sure sub-arrays exist */
          WA.annotations.highlights = WA.annotations.highlights || [];
          WA.annotations.notes      = WA.annotations.notes      || [];
          WA.annotations.shapes     = WA.annotations.shapes     || [];
        }
        if (callback) callback();
      });
    },

    /* Wipe everything for this URL */
    clear: function () {
      WA.annotations = { highlights: [], notes: [], shapes: [] };
      WA.storage._write();   // immediate, not debounced
    }
  };

  /* ── Flush pending save before the page unloads ─────── */
  window.addEventListener('beforeunload', function () {
    WA.storage._write();
  });

  /* Also flush on visibilitychange (covers mobile tab-switching) */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      WA.storage._write();
    }
  });
})();
