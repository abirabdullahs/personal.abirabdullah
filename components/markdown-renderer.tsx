import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary-url';
// VS Code's dark editor color scheme (#1E1E1E background, #DCDCDC text) for
// fenced code blocks. Imported once here so code blocks always look the
// same regardless of the site's light/dark theme.
import 'highlight.js/styles/vs2015.css';

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
  // behind auth — never untrusted user input. rehypeHighlight runs after it
  // so fenced code blocks get real syntax-highlighted tokens (keywords,
  // strings, comments, etc.), not just a flat text color.
  return (
    <div className={className ?? 'prose dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary'}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          code({ className, children, ...props }) {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground" {...props}>
                  {children}
                </code>
              );
            }
            // No color/background utility classes here on purpose — the
            // imported vs2015.css theme (via the "hljs" class rehypeHighlight
            // adds automatically) supplies the fixed dark background,
            // padding, and per-token syntax colors. Only structural classes
            // (rounded corners, border, horizontal overflow) live here.
            return (
              <pre className="overflow-hidden rounded-lg border border-border">
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
