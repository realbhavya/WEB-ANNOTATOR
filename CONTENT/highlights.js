/* ───────────────────────────────────────────────────────
 * WebAnnotator — Text Highlighting Engine
 *
 * Creates, restores, and removes highlights.  Restoration
 * is text-based (prefix + suffix context) rather than
 * DOM-path-based so it survives dynamic pages.
 * ─────────────────────────────────────────────────────── */

(function () {
  'use strict';

  /* ── helpers: check if a node is our own UI ────────── */
  function isOwnUI(node) {
    if (!node) return false;
    if (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute(WA.UI_ATTR)) return true;
    if (node.closest) return !!node.closest('[' + WA.UI_ATTR + ']');
    var p = node.parentElement;
    while (p) {
      if (p.hasAttribute(WA.UI_ATTR)) return true;
      p = p.parentElement;
    }
    return false;
  }

  /* ── collect every text node in document order ─────── */
  function collectTextNodes(root) {
    var nodes = [];
    var walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (!isOwnUI(walker.currentNode)) nodes.push(walker.currentNode);
    }
    return nodes;
  }

  /* ── build {fullText, entries[{node, offset, len}]} ── */
  function buildTextMap(root) {
    var nodes   = collectTextNodes(root);
    var text    = '';
    var entries = [];
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      entries.push({ node: n, offset: text.length, len: n.textContent.length });
      text += n.textContent;
    }
    return { fullText: text, entries: entries };
  }

  /* ── get text nodes inside a Range ─────────────────── */
  function getTextNodesInRange(range) {
    if (range.collapsed) return [];

    var root = range.commonAncestorContainer;
    if (root.nodeType === Node.TEXT_NODE) root = root.parentNode;

    var all = collectTextNodes(root);
    var results = [];

    for (var i = 0; i < all.length; i++) {
      var tn = all[i];
      try { if (!range.intersectsNode(tn)) continue; } catch (e) { continue; }

      var s = (tn === range.startContainer) ? range.startOffset : 0;
      var e = (tn === range.endContainer)   ? range.endOffset   : tn.textContent.length;
      if (e > s) results.push({ node: tn, startOffset: s, endOffset: e });
    }
    return results;
  }

  /* ── convert hex (#rrggbb) to rgba with alpha ───────── */
  function hexToRgba(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  /* ── wrap a (portion of a) text node in a highlight span */
  function wrapTextNode(textNode, startOff, endOff, id, color) {
    var doc  = textNode.ownerDocument;
    var span = doc.createElement('span');
    span.className = 'wa-highlight';
    span.setAttribute('data-wa-id', id);
    /* Semi-transparent background so text stays readable */
    span.style.backgroundColor = hexToRgba(color, 0.38);

    var parent = textNode.parentNode;

    if (startOff === 0 && endOff === textNode.textContent.length) {
      parent.insertBefore(span, textNode);
      span.appendChild(textNode);
      return span;
    }

    /* need to split */
    var workNode = textNode;
    if (startOff > 0) {
      workNode = textNode.splitText(startOff);
      endOff  -= startOff;
    }
    if (endOff < workNode.textContent.length) {
      workNode.splitText(endOff);
    }
    parent.insertBefore(span, workNode);
    span.appendChild(workNode);
    return span;
  }

  /* ── extract prefix / suffix context for a Range ───── */
  function getContext(range) {
    var map = buildTextMap(document.body);
    var startPos = 0, endPos = 0;
    var foundStart = false, foundEnd = false;

    for (var i = 0; i < map.entries.length; i++) {
      var e = map.entries[i];
      if (e.node === range.startContainer) {
        startPos = e.offset + (range.startContainer.nodeType === Node.TEXT_NODE ? range.startOffset : 0);
        foundStart = true;
      }
      if (e.node === range.endContainer) {
        endPos = e.offset + (range.endContainer.nodeType === Node.TEXT_NODE ? range.endOffset : 0);
        foundEnd = true;
      }
    }

    if (!foundStart || !foundEnd) return { prefix: '', suffix: '' };

    var L = WA.CONTEXT_LEN;
    return {
      prefix: map.fullText.substring(Math.max(0, startPos - L), startPos),
      suffix: map.fullText.substring(endPos, endPos + L)
    };
  }

  /* ────────────────────────────────────────────────────── */
  /*  PUBLIC API                                            */
  /* ────────────────────────────────────────────────────── */

  WA.highlights = {

    /* Create highlight from the current user selection */
    create: function () {
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;

      var range = sel.getRangeAt(0);
      var text  = range.toString();
      if (!text.trim()) return;

      var id      = WA.generateId();
      var ctx     = getContext(range);
      var nodes   = getTextNodesInRange(range);
      if (!nodes.length) return;

      /* wrap from last to first so earlier splits don't invalidate later indices */
      for (var i = nodes.length - 1; i >= 0; i--) {
        wrapTextNode(nodes[i].node, nodes[i].startOffset, nodes[i].endOffset, id, WA.currentColor);
      }

      WA.annotations.highlights.push({
        id:        id,
        text:      text,
        prefix:    ctx.prefix,
        suffix:    ctx.suffix,
        color:     WA.currentColor,
        timestamp: Date.now()
      });
      WA.storage.save();
      sel.removeAllRanges();
    },

    /* Restore a single saved highlight by searching for its text + context */
    restore: function (data) {
      var map      = buildTextMap(document.body);
      var full     = map.fullText;
      var needle   = data.text;
      var textStart = -1;

      /* 1) try full context match */
      var pattern = data.prefix + needle + data.suffix;
      var idx = full.indexOf(pattern);
      if (idx >= 0) {
        textStart = idx + data.prefix.length;
      } else {
        /* 2) try prefix + text */
        pattern = data.prefix + needle;
        idx = full.indexOf(pattern);
        if (idx >= 0) {
          textStart = idx + data.prefix.length;
        } else {
          /* 3) try text + suffix */
          pattern = needle + data.suffix;
          idx = full.indexOf(pattern);
          if (idx >= 0) {
            textStart = idx;
          } else {
            /* 4) fallback: just the text */
            idx = full.indexOf(needle);
            if (idx >= 0) textStart = idx;
          }
        }
      }

      if (textStart < 0) return false;
      var textEnd = textStart + needle.length;

      /* map character span back to text nodes */
      var toWrap = [];
      for (var i = 0; i < map.entries.length; i++) {
        var e = map.entries[i];
        var nStart = e.offset;
        var nEnd   = e.offset + e.len;
        var oStart = Math.max(textStart, nStart);
        var oEnd   = Math.min(textEnd,   nEnd);
        if (oStart < oEnd) {
          toWrap.push({ node: e.node, startOffset: oStart - nStart, endOffset: oEnd - nStart });
        }
      }

      for (var j = toWrap.length - 1; j >= 0; j--) {
        wrapTextNode(toWrap[j].node, toWrap[j].startOffset, toWrap[j].endOffset, data.id, data.color);
      }
      return true;
    },

    /* Remove a highlight — unwrap spans and normalise */
    remove: function (id) {
      var spans = document.querySelectorAll('.wa-highlight[data-wa-id="' + id + '"]');
      spans.forEach(function (span) {
        var parent = span.parentNode;
        while (span.firstChild) parent.insertBefore(span.firstChild, span);
        parent.removeChild(span);
        parent.normalize();
      });
      WA.annotations.highlights = WA.annotations.highlights.filter(function (h) { return h.id !== id; });
      WA.storage.save();
    },

    /* Restore every saved highlight; returns count of successes */
    restoreAll: function () {
      var count = 0;
      for (var i = 0; i < WA.annotations.highlights.length; i++) {
        if (WA.highlights.restore(WA.annotations.highlights[i])) count++;
      }
      return count;
    },

    /* Remove all highlight DOM elements without touching storage */
    removeAllDOM: function () {
      var spans = document.querySelectorAll('.wa-highlight');
      spans.forEach(function (span) {
        var parent = span.parentNode;
        while (span.firstChild) parent.insertBefore(span.firstChild, span);
        parent.removeChild(span);
        parent.normalize();
      });
    }
  };
})();
