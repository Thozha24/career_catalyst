import type { ReactNode } from "react";

/**
 * Minimal, safe markdown renderer for lesson content.
 * Builds React nodes directly — never uses dangerouslySetInnerHTML, so
 * user/seed content cannot inject HTML (XSS-safe by construction).
 * Supported: headings (#, ##, ###), bullet/ordered lists, paragraphs,
 * inline `code`, **bold**, and blank-line separation.
 */

function inline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    return <span key={key}>{part}</span>;
  });
}

export function renderMarkdown(source: string): ReactNode {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let paragraph: string[] = [];
  let key = 0;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push(<p key={`p-${key++}`}>{inline(paragraph.join(" "), `pp-${key}`)}</p>);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      const L = list;
      blocks.push(
        L.ordered ? (
          <ol key={`l-${key++}`}>{L.items.map((item, i) => <li key={i}>{inline(item, `li-${key}-${i}`)}</li>)}</ol>
        ) : (
          <ul key={`l-${key++}`}>{L.items.map((item, i) => <li key={i}>{inline(item, `li-${key}-${i}`)}</li>)}</ul>
        )
      );
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const text = inline(heading[2], `h-${key}`);
      blocks.push(
        level <= 1 ? <h2 key={`h-${key++}`}>{text}</h2>
        : level === 2 ? <h3 key={`h-${key++}`}>{text}</h3>
        : <h3 key={`h-${key++}`}>{text}</h3>
      );
      continue;
    }
    const bullet = /^[-*]\s+(.*)$/.exec(line.trim());
    if (bullet) {
      flushParagraph();
      if (!list || list.ordered) { flushList(); list = { ordered: false, items: [] }; }
      list.items.push(bullet[1]);
      continue;
    }
    const ordered = /^\d+[.)]\s+(.*)$/.exec(line.trim());
    if (ordered) {
      flushParagraph();
      if (!list || !list.ordered) { flushList(); list = { ordered: true, items: [] }; }
      list.items.push(ordered[1]);
      continue;
    }
    flushList();
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushList();

  return blocks;
}
