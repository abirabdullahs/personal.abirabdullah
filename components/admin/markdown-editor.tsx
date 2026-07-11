'use client';

import * as React from 'react';
import { Bold, Code, Eye, Heading2, Italic, Link as LinkIcon, List, ListOrdered, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownRenderer } from '@/components/markdown-renderer';

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
};

type WrapOption = {
  icon: React.ElementType;
  label: string;
  before: string;
  after?: string;
  placeholder?: string;
  block?: boolean;
};

const toolbarItems: WrapOption[] = [
  { icon: Bold, label: 'Bold', before: '**', after: '**', placeholder: 'bold text' },
  { icon: Italic, label: 'Italic', before: '_', after: '_', placeholder: 'italic text' },
  { icon: Heading2, label: 'Heading', before: '### ', placeholder: 'Heading', block: true },
  { icon: LinkIcon, label: 'Link', before: '[', after: '](https://)', placeholder: 'link text' },
  { icon: List, label: 'Bullet list', before: '- ', placeholder: 'list item', block: true },
  { icon: ListOrdered, label: 'Numbered list', before: '1. ', placeholder: 'list item', block: true },
  { icon: Code, label: 'Code block', before: '```\n', after: '\n```', placeholder: 'code here', block: true },
];

export function MarkdownEditor({ value, onChange, rows = 8, placeholder }: MarkdownEditorProps) {
  const [mode, setMode] = React.useState<'write' | 'preview'>('write');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const applyWrap = (option: WrapOption) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || option.placeholder || '';
    const after = option.after ?? '';

    // Block-level markers (headings/lists/code fences) should start on their own line.
    const needsLeadingNewline = option.block && start > 0 && value[start - 1] !== '\n';
    const prefix = needsLeadingNewline ? '\n' : '';

    const insertion = `${prefix}${option.before}${selected}${after}`;
    const nextValue = value.slice(0, start) + insertion + value.slice(end);
    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorStart = start + prefix.length + option.before.length;
      const cursorEnd = cursorStart + selected.length;
      textarea.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  return (
    <div className="rounded-md border border-input bg-muted/10 overflow-hidden">
      <div className="flex items-center justify-between border-b bg-muted/20 px-2 py-1.5">
        <div className="flex items-center gap-0.5">
          {toolbarItems.map((item) => (
            <Button
              key={item.label}
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title={item.label}
              disabled={mode === 'preview'}
              onClick={() => applyWrap(item)}
            >
              <item.icon className="h-3.5 w-3.5" />
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={mode === 'write' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setMode('write')}
          >
            <Pencil className="h-3 w-3" /> Write
          </Button>
          <Button
            type="button"
            variant={mode === 'preview' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setMode('preview')}
          >
            <Eye className="h-3 w-3" /> Preview
          </Button>
        </div>
      </div>

      {mode === 'write' ? (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="border-0 rounded-none bg-transparent font-mono text-sm focus-visible:ring-0"
        />
      ) : (
        <div className="p-4 min-h-[10rem]">
          <MarkdownRenderer content={value} className="prose prose-sm dark:prose-invert max-w-none" />
        </div>
      )}
    </div>
  );
}
