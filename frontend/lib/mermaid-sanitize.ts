/**
 * Normalizes common Mermaid syntax issues in authored markdown before render.
 * Mermaid v11 is strict about special characters and multi-word subgraph titles.
 */
export function sanitizeMermaidChart(chart: string): string {
  const lines = chart.split('\n').map((line) => {
    let next = line.replace(/\u2192/g, '->').replace(/<br\s*\/>/gi, '<br>');

    // subgraph Fast2SMS Request Body  →  subgraph fast2sms_body["Fast2SMS Request Body"]
    const openSubgraph = /^(\s*subgraph\s+)([A-Za-z][A-Za-z0-9_]*(?:\s+[A-Za-z][A-Za-z0-9_]*)+)\s*$/.exec(next);
    if (openSubgraph) {
      const title = openSubgraph[2].trim();
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      return `${openSubgraph[1]}${id}["${title}"]`;
    }

    // subgraph id Title-with-spaces  →  subgraph id["Title with spaces"]
    const idWithTitle = /^(\s*subgraph\s+)([A-Za-z][A-Za-z0-9_]*)\s+([^[\]"]+)\s*$/.exec(next);
    if (idWithTitle && !idWithTitle[3].includes('[')) {
      const id = idWithTitle[2];
      const title = idWithTitle[3].trim();
      return `${idWithTitle[1]}${id}["${title}"]`;
    }

    // sequenceDiagram arrow labels with pipes, braces, or slashes
    const seqArrow = /^(\s*\w+\s*(?:->>|-->>|->)\s*\w+\s*:\s*)(.+)$/.exec(next);
    if (seqArrow) {
      const prefix = seqArrow[1];
      const message = seqArrow[2].trim();
      if (/[|{}]/.test(message) && !message.startsWith('"')) {
        return `${prefix}"${message.replace(/"/g, '\\"')}"`;
      }
    }

    // Node labels like DASH[/platform/otp] — leading slash without closing slash is invalid
    // subroutine syntax ([/text/]). Quote as a plain label instead.
    next = next.replace(/\b([A-Za-z][A-Za-z0-9_]*)\[(\/[^\]"]+)\]/g, (match, id, label) => {
      if (label.endsWith('/')) {
        return match;
      }
      return `${id}["${label}"]`;
    });

    return next;
  });

  return lines.join('\n');
}
