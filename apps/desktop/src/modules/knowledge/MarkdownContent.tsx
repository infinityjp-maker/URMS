type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'code'; text: string };

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';

    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !(lines[index] ?? '').startsWith('```')) {
        codeLines.push(lines[index] ?? '');
        index += 1;
      }
      blocks.push({ type: 'code', text: codeLines.join('\n') });
      index += 1;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1]?.length ?? 1, text: heading[2]?.trim() ?? '' });
      index += 1;
      continue;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = [];
      while (index < lines.length) {
        const current = lines[index] ?? '';
        if (!current.startsWith('- ') && !current.startsWith('* ')) break;
        items.push(current.slice(2).trim());
        index += 1;
      }
      blocks.push({ type: 'list', items });
      continue;
    }

    if (line.trim().length === 0) {
      index += 1;
      continue;
    }

    const paragraph: string[] = [line.trim()];
    index += 1;
    while (index < lines.length) {
      const current = lines[index] ?? '';
      if (
        current.trim().length === 0 ||
        current.startsWith('#') ||
        current.startsWith('- ') ||
        current.startsWith('* ') ||
        current.startsWith('```')
      ) {
        break;
      }
      paragraph.push(current.trim());
      index += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
  }

  return blocks;
}

type Props = {
  markdown: string;
};

export function MarkdownContent({ markdown }: Props) {
  const blocks = parseBlocks(markdown);

  return (
    <article className="markdown-body">
      {blocks.map((block, blockIndex) => {
        if (block.type === 'heading') {
          if (block.level === 1) return <h1 key={blockIndex}>{block.text}</h1>;
          if (block.level === 2) return <h2 key={blockIndex}>{block.text}</h2>;
          return <h3 key={blockIndex}>{block.text}</h3>;
        }
        if (block.type === 'list') {
          return (
            <ul key={blockIndex}>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        if (block.type === 'code') {
          return (
            <pre key={blockIndex} className="markdown-body__code">
              <code>{block.text}</code>
            </pre>
          );
        }
        return <p key={blockIndex}>{block.text}</p>;
      })}
    </article>
  );
}
