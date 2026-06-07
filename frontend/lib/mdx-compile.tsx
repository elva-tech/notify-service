import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { API_BASE_URL } from './config';
import { splitMermaidSegments } from './docs-parser';
import { MermaidDiagram } from '@/components/docs/mermaid-diagram';
import { CodeBlock } from '@/components/docs/code-block';

function extractPreCode(child: React.ReactNode): { code: string; language?: string } | null {
  if (typeof child === 'string') {
    return { code: child.trim() };
  }
  if (typeof child === 'object' && child && 'props' in child) {
    const element = child as React.ReactElement<{ className?: string; children?: React.ReactNode }>;
    const className = element.props?.className ?? '';
    const language = className.includes('language-')
      ? className.replace(/.*language-/, '').split(/\s/)[0]
      : undefined;
    const code = String(element.props?.children ?? '').trim();
    if (code) {
      return { code, language };
    }
  }
  return null;
}

const mdxComponents = {
  pre: (props: React.ComponentProps<'pre'>) => {
    const extracted = extractPreCode(props.children);
    if (extracted) {
      return <CodeBlock code={extracted.code} language={extracted.language ?? 'text'} />;
    }
    return <pre {...props} />;
  },
  a: (props: React.ComponentProps<'a'>) => (
    <a {...props} className="text-primary underline-offset-4 hover:underline" />
  ),
};

function substituteApiBaseUrlInMarkdown(content: string): string {
  return content
    .replace(/\{\{API_BASE_URL\}\}/g, API_BASE_URL)
    .replace(/https:\/\/notify\.elvatech\.in(?=\/(?:otp|notify|health|platform|ops))/g, API_BASE_URL)
    .replace(/http:\/\/localhost:4000/g, API_BASE_URL);
}

export async function compileMarkdownSegment(content: string) {
  if (!content.trim()) {
    return null;
  }

  const { content: compiled } = await compileMDX({
    source: substituteApiBaseUrlInMarkdown(content),
    components: mdxComponents,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
        ],
      },
    },
  });

  return compiled;
}

export async function compileDocumentBody(body: string, docKey = 'doc') {
  const segments = splitMermaidSegments(body);
  const rendered = await Promise.all(
    segments.map(async (segment, index) => {
      const segmentKey = `${docKey}-${segment.type}-${index}`;
      if (segment.type === 'mermaid') {
        return <MermaidDiagram key={segmentKey} chart={segment.content} />;
      }
      const content = await compileMarkdownSegment(segment.content);
      return content ? <div key={segmentKey}>{content}</div> : null;
    }),
  );

  return <>{rendered.filter(Boolean)}</>;
}
