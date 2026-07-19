import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary-url';

type MarkdownRendererProps = {
  content: string;
  className?: string;
};

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  if (!content) {
    return <p className="text-muted-foreground italic">No content provided.</p>;
  }

  // rehypeRaw renders HTML embedded in the Markdown (used for formatting with
  // no pure-Markdown equivalent, e.g. text-align, underline, from the Tiptap
  // editor). Safe here because blog content is only ever admin-authored
  // behind auth — never untrusted user input.
  return (
    <div className={className ?? 'prose dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary'}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ className, children, ...props }) {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="overflow-x-auto rounded-lg border bg-muted p-4 font-mono text-sm">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          a({ children, ...props }) {
            return (
              <a {...props} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
          img({ src, alt, ...props }) {
            // eslint-disable-next-line @next/next/no-img-element
            return <img src={optimizeCloudinaryUrl(typeof src === 'string' ? src : '')} alt={alt || ''} {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
