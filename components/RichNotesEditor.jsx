'use client';
import { useEffect, useRef } from 'react';

export default function RichNotesEditor({ value, onChange, placeholder = 'Type your notes here...' }) {
  const editorRef = useRef(null);

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

  function sanitizeHtml(html) {
    // Basic sanitizer to normalize pasted content and strip unwanted markup
    const allowed = new Set(['A','B','STRONG','I','EM','U','S','P','BR','UL','OL','LI','BLOCKQUOTE','PRE','CODE','H1','H2','H3','MARK']);
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
        // Convert <span style="background..."> to semantic <mark>
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
        // Strip style/class/id and other presentational attrs
        Array.from(node.attributes).forEach((attr) => {
          const name = attr.name.toLowerCase();
          if (node.tagName === 'A' && name === 'href') {
            // keep only http(s) links
            const href = node.getAttribute('href') || '';
            if (!/^https?:\/\//i.test(href)) node.removeAttribute('href');
          } else if (name === 'href') {
            // only A is allowed to have href
            node.removeAttribute(name);
          } else if (name !== 'href') {
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
    // If selection intersects any existing <mark>, unwrap all those marks (toggle off)
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
    // Otherwise, wrap selection in <mark> (toggle on)
    try {
      const mark = document.createElement('mark');
      range.surroundContents(mark);
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(mark);
      sel.addRange(newRange);
      handleInput();
    } catch {
      // Fallback to browser highlight command
      exec('hiliteColor', '#fff59d');
      handleInput();
    }
  }

  function exec(cmd, arg) {
    document.execCommand(cmd, false, arg);
    editorRef.current?.focus();
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
    // Keep focus on editor when clicking toolbar
    e.preventDefault();
  }

  return (
    <div className="rte">
      <div className="rte-toolbar" onMouseDown={preventBlur}>
        <button className="rte-button" type="button" title="Bold" onClick={() => exec('bold')}>B</button>
        <button className="rte-button" type="button" title="Italic" onClick={() => exec('italic')}><em>I</em></button>
        <button className="rte-button" type="button" title="Underline" onClick={() => exec('underline')}><u>U</u></button>
        <button className="rte-button" type="button" title="Strikethrough" onClick={() => exec('strikeThrough')}>S</button>
        <span className="rte-sep" />
        <button className="rte-button" type="button" title="Bulleted list" onClick={() => exec('insertUnorderedList')}>• List</button>
        <button className="rte-button" type="button" title="Numbered list" onClick={() => exec('insertOrderedList')}>1. List</button>
        <button className="rte-button" type="button" title="Quote" onClick={() => exec('formatBlock', 'BLOCKQUOTE')}>❝</button>
        <span className="rte-sep" />
        <button className="rte-button" type="button" title="Heading 1" onClick={() => exec('formatBlock', 'H1')}>H1</button>
        <button className="rte-button" type="button" title="Heading 2" onClick={() => exec('formatBlock', 'H2')}>H2</button>
        <button className="rte-button" type="button" title="Heading 3" onClick={() => exec('formatBlock', 'H3')}>H3</button>
        <span className="rte-sep" />
          <button className="rte-button" type="button" title="Code block" onClick={() => exec('formatBlock', 'PRE')}>{'{ }'}</button>
          <button className="rte-button" type="button" title="Highlight" onClick={toggleHighlight}>HL</button>
        <button className="rte-button" type="button" title="Left" onClick={() => exec('justifyLeft')}>⟸</button>
        <button className="rte-button" type="button" title="Center" onClick={() => exec('justifyCenter')}>⇔</button>
        <button className="rte-button" type="button" title="Right" onClick={() => exec('justifyRight')}>⟹</button>
        <span className="rte-sep" />
        <button className="rte-button" type="button" title="Link" onClick={() => {
          const url = prompt('Enter URL');
          if (url) exec('createLink', url);
        }}>🔗</button>
        <button className="rte-button" type="button" title="Remove link" onClick={() => exec('unlink')}>✖︎</button>
        <span className="rte-sep" />
        <button className="rte-button" type="button" title="Undo" onClick={() => exec('undo')}>↶</button>
        <button className="rte-button" type="button" title="Redo" onClick={() => exec('redo')}>↷</button>
        <span className="rte-sep" />
        <button className="rte-button" type="button" title="Clear formatting" onClick={() => exec('removeFormat')}>Clear</button>
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


