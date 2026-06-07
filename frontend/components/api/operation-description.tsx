import { compileMarkdownSegment } from '@/lib/mdx-compile';

interface OperationDescriptionProps {
  markdown: string;
}

export async function OperationDescription({ markdown }: OperationDescriptionProps) {
  const content = await compileMarkdownSegment(markdown);
  if (!content) {
    return null;
  }

  return (
    <div className="prose prose-slate mt-4 max-w-none text-foreground dark:prose-invert prose-headings:scroll-mt-24 prose-p:text-foreground prose-li:text-foreground prose-td:text-foreground prose-th:text-foreground prose-strong:text-foreground">
      {content}
    </div>
  );
}
