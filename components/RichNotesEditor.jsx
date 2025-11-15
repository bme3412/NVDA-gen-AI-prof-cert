'use client';
import { useEffect, useRef } from 'react';

export default function RichNotesEditor({ value, onChange, placeholder = 'Type your notes here...' }) {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null); // remembers last selection inside editor

  useEffect(() => {
    // Sync external value into editor if it differs
    const el = editorRef.current;
    if (!el) return;
    const current = el.innerHTML;
    const incoming = value || '';
    if (current !== incoming) {
      el.innerHTML = incoming;
    }
  }, [value]);

  // Track selection so toolbar actions can restore it after focus changes
  useEffect(() => {
    function captureSelection() {
      const el = editorRef.current;
      const sel = window.getSelection();
      if (!el || !sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (el.contains(range?.startContainer)) {
        savedRangeRef.current = range.cloneRange();
        // saved selection
      }
    }
    document.addEventListener('selectionchange', captureSelection);
    return () => document.removeEventListener('selectionchange', captureSelection);
  }, []);

  function restoreSelection() {
    const r = savedRangeRef.current;
    if (!r) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  }

  function sanitizeHtml(html) {
    // Basic sanitizer to normalize pasted content and strip unwanted markup
    const allowed = new Set(['A','STRONG','P','BR','UL','OL','LI','BLOCKQUOTE','PRE','CODE','H1','H2','H3','H4','H5','H6','MARK']);
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
    const root = doc.body.firstChild;
    // Convert <table> elements to bullet lists to avoid layout issues from wide tables
    Array.from(root.querySelectorAll('table')).forEach((table) => {
      const rows = Array.from(table.querySelectorAll('tr'));
      const headerCells = rows.length > 1 ? Array.from(rows[0].querySelectorAll('th,td')) : [];
      const bodyRows = headerCells.length > 0 ? rows.slice(1) : rows;
      const ul = doc.createElement('ul');
      bodyRows.forEach((tr) => {
        const cells = Array.from(tr.querySelectorAll('th,td')).map((c) => (c.textContent || '').trim());
        const li = doc.createElement('li');
        if (headerCells.length > 0) {
          const headers = headerCells.map((h) => (h.textContent || '').trim());
          const kv = headers.map((h, i) => (h ? `${h}: ${cells[i] || ''}` : (cells[i] || ''))).filter(Boolean);
          li.textContent = kv.join(' • ');
        } else {
          li.textContent = cells.filter(Boolean).join(' • ');
        }
        ul.appendChild(li);
      });
      table.replaceWith(ul);
    });
    const walk = (node) => {
      // Convert <div> to <p> for better paragraph formatting
      if (node.nodeType === 1) {
        // Elements
        if (node.tagName === 'DIV') {
          const p = doc.createElement('p');
          // Move children
          while (node.firstChild) p.appendChild(node.firstChild);
          node.replaceWith(p);
          node = p;
        }
        // Convert <span style="background..."> to semantic <mark> so highlight persists
        if (node.tagName === 'SPAN') {
          const style = node.getAttribute('style') || '';
          if (/background(-color)?\s*:/i.test(style)) {
            const mark = doc.createElement('mark');
            while (node.firstChild) mark.appendChild(node.firstChild);
            node.replaceWith(mark);
            node = mark;
          }
        }
        // Remove disallowed elements but keep their children
        if (!allowed.has(node.tagName)) {
          const frag = doc.createDocumentFragment();
          while (node.firstChild) frag.appendChild(node.firstChild);
          node.replaceWith(frag);
          return;
        }
        // Strip style/class/id and other presentational attrs (keep href on A)
        Array.from(node.attributes).forEach((attr) => {
          const name = attr.name.toLowerCase();
          if (node.tagName === 'A' && name === 'href') {
            // keep only http(s) links
            const href = node.getAttribute('href') || '';
            if (!/^https?:\/\//i.test(href)) node.removeAttribute('href');
          } else if (name === 'href') {
            // only A is allowed to have href
            node.removeAttribute(name);
          } else {
            node.removeAttribute(name);
          }
        });
      }
      // Recurse
      Array.from(node.childNodes).forEach(walk);
    };
    Array.from(root.childNodes).forEach(walk);
    // Ensure paragraphs for plain text blocks
    const wrapper = doc.createElement('div');
    while (root.firstChild) wrapper.appendChild(root.firstChild);
    return wrapper.innerHTML
      .replace(/(\s*<br>\s*){3,}/gi, '<br><br>') // collapse long br runs
      .replace(/&nbsp;/g, ' '); // normalize spaces
  }

  function toggleHighlight() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;
    const root = editorRef.current;
    if (!root) return;
    // If selection intersects any existing <mark>, unwrap them (toggle off)
    const marks = Array.from(root.querySelectorAll('mark'));
    const toUnwrap = marks.filter((m) => {
      try { return range.intersectsNode(m); } catch { return false; }
    });
    if (toUnwrap.length > 0) {
      toUnwrap.forEach((m) => {
        const parent = m.parentNode;
        if (!parent) return;
        while (m.firstChild) parent.insertBefore(m.firstChild, m);
        parent.removeChild(m);
      });
      handleInput();
      return;
    }
    // Otherwise, wrap selection in <mark>
    try {
      const mark = document.createElement('mark');
      range.surroundContents(mark);
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(mark);
      sel.addRange(newRange);
      handleInput();
    } catch {
      // Fallback to browser command
      exec('hiliteColor', '#fff59d');
      handleInput();
    }
  }

  function exec(cmd, arg) {
    document.execCommand(cmd, false, arg);
    editorRef.current?.focus();
  }

  function insertWrappedSelection(styleStr) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return false;
    // Prefer native surroundContents to avoid extra whitespace
    try {
      const span = document.createElement('span');
      if (styleStr) span.setAttribute('style', styleStr);
      range.surroundContents(span);
    } catch {
      // Fallback to HTML insertion
      const frag = range.cloneContents();
      const container = document.createElement('div');
      const span = document.createElement('span');
      if (styleStr) span.setAttribute('style', styleStr);
      span.appendChild(frag);
      container.appendChild(span);
      document.execCommand('insertHTML', false, container.innerHTML);
    }
    handleInput();
    return true;
  }

  function handleInput() {
    const html = editorRef.current?.innerHTML || '';
    onChange?.(html);
  }

  function handlePaste(e) {
    const el = editorRef.current;
    if (!el) return;
    const dt = e.clipboardData;
    if (!dt) return;
    e.preventDefault();
    const html = dt.getData('text/html');
    const text = dt.getData('text/plain');
    let toInsert = '';
    if (html) {
      toInsert = sanitizeHtml(html);
    } else if (text) {
      // Convert plain text to paragraph-safe HTML
      const esc = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      toInsert = esc.split(/\n{2,}/).map(p =>
        `<p>${p.replace(/\t+/g, ' • ').replace(/\n/g, '<br>')}</p>`
      ).join('');
    }
    if (toInsert) {
      document.execCommand('insertHTML', false, toInsert);
      handleInput();
    }
  }

  function preventBlur(e) {
    // Keep focus on editor when clicking toolbar buttons,
    // but allow <select> to open
    const tag = String(e.target?.tagName || '').toUpperCase();
    if (tag === 'SELECT' || tag === 'INPUT') return;
    e.preventDefault();
  }

  return (
    <div className="rte">
      <div className="rte-toolbar" onMouseDown={preventBlur}>
        <button className="rte-button" type="button" title="Bold" onClick={() => exec('bold')}>B</button>
        <span className="rte-sep" />
        <button className="rte-button" type="button" title="Heading 1" onClick={() => exec('formatBlock', 'H1')}>H1</button>
        <button className="rte-button" type="button" title="Heading 2" onClick={() => exec('formatBlock', 'H2')}>H2</button>
        <button className="rte-button" type="button" title="Heading 3" onClick={() => exec('formatBlock', 'H3')}>H3</button>
          <button className="rte-button" type="button" title="Heading 4" onClick={() => exec('formatBlock', 'H4')}>H4</button>
          <button className="rte-button" type="button" title="Heading 5" onClick={() => exec('formatBlock', 'H5')}>H5</button>
          <button className="rte-button" type="button" title="Heading 6" onClick={() => exec('formatBlock', 'H6')}>H6</button>
          <button className="rte-button" type="button" title="Normal paragraph" onClick={() => exec('formatBlock', 'P')}>Normal</button>
        <span className="rte-sep" />
        <button className="rte-button" type="button" title="Highlight" onClick={toggleHighlight}>HL</button>
      </div>
      <div
        className="rte-editor textarea"
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={handleInput}
        onBlur={handleInput}
        onPaste={handlePaste}
        suppressContentEditableWarning
      />
    </div>
  );
}


