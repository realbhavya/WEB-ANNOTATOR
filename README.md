# ✏️ WebAnnotator

**Highlight text, write sticky notes, and draw shapes on any webpage** — like marking up a printed page with a highlighter and sticky notes, but in your browser.

Annotations save automatically and reappear when you revisit the page, even after closing the browser.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🖍️ **Highlight** | Select any text to highlight it — works across bold, italic, code blocks, lists, and nested elements |
| 📝 **Sticky Notes** | Click anywhere to place a draggable, editable note card |
| ▭ **Rectangles** | Click and drag to draw a rectangle outline over any area |
| ⭕ **Circles** | Click and drag to draw an ellipse outline over any area |
| 🎨 **Color Picker** | Choose any color for new annotations |
| 💾 **Persistent** | All annotations auto-save and restore on page revisit |
| 🗑️ **Delete** | Right-click any annotation → "Delete annotation" |
| 🧹 **Clear All** | One-click removal of all annotations on the current page |
| 📌 **Draggable Toolbar** | Drag the toolbar freely in all directions — X and Y |
| ➖ **Collapsible** | Collapse to a small circular icon; drag it without accidentally expanding |
| 🖼️ **iframe Support** | Annotations work inside embedded iframes and frames |

---

## 🚀 Installation

1. **Download** or clone this repository
2. Open **Chrome** and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `web-annotator` folder
6. ✅ The extension is now active on all pages!

---

## 🎯 Usage

A dark floating toolbar appears in the top-right corner of every webpage.

### Toolbar Modes

| Icon | Mode | How to Use |
|------|------|------------|
| 🖱️ | **Cursor** | Browse normally — no annotations are created |
| ✏️ | **Highlight** | Select (click-drag) any text to highlight it |
| 📋 | **Note** | Click anywhere on the page to place a sticky note |
| ▭ | **Rectangle** | Click and drag to draw a rectangle outline |
| ⭕ | **Circle** | Click and drag to draw an ellipse outline |

### Controls

- **Color dot** — Open the color picker to change annotation color
- **🗑️ Trash** — Clear all annotations on the current page
- **➖ Collapse** — Shrink toolbar into a small circular icon
- **Click the icon** — Expand the toolbar back (dragging won't accidentally trigger expand)
- **⠿ Grip** — Drag the toolbar anywhere on the screen (moves freely in both X and Y)

### Deleting Annotations

**Right-click** any highlight, note, or shape border → click **"Delete annotation"** to remove it.

---

## 🏗️ Architecture

```
web-annotator/
├── manifest.json            # Chrome Extension Manifest V3
├── background.js            # Service worker (cross-frame messaging)
├── content/
│   ├── utils.js             # Global namespace, constants, frame detection
│   ├── storage.js           # Persistence via chrome.storage.local
│   ├── highlights.js        # Text highlighting engine
│   ├── notes.js             # Draggable sticky note cards
│   ├── shapes.js            # Rectangle & circle drawing overlay
│   ├── context-menu.js      # Right-click "Delete" custom menu
│   ├── toolbar.js           # Floating glassmorphic toolbar
│   ├── main.js              # Initialization & event wiring
│   └── styles.css           # Dark theme with !important isolation
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---

## 🔧 Technical Details

| Aspect | Detail |
|--------|--------|
| **Manifest** | Version 3 |
| **Permissions** | `storage` |
| **Injection** | `document_idle`, all frames (`all_frames: true`) |
| **Event phase** | Capture phase — prevents page JS from blocking annotation events |
| **CSS isolation** | All rules use `!important`; specificity tricks prevent page override |
| **Highlight persistence** | Text-based matching with prefix/suffix context (~100 chars) |
| **Save strategy** | Debounced writes + flush on `beforeunload` and `visibilitychange` |
| **Toolbar** | Top frame only; mode/color broadcast to iframes via background worker |
| **Drag system** | Move-threshold (4px) distinguishes clicks from drags; drag flag prevents accidental expand |
| **Dynamic pages** | Retry restoration up to 5× with increasing delays for late-loading content |

---

## 🌐 Compatibility

- Works on any standard webpage (articles, documentation, blogs)
- Handles text across multiple styled blocks — bold, italic, code, lists
- Supports pages with embedded iframes (textbook readers, AI platforms)
- Tested on **Perplexity.ai** and **Wikipedia**

---

## 📄 License

MIT
