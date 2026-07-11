import type { LucideIcon } from 'lucide-react';
import { FileQuestion } from 'lucide-react';

type EmptyStateProps = {
  title: string;
  message: string;
  icon?: LucideIcon;
};

export function EmptyState({ title, message, icon: Icon = FileQuestion }: EmptyStateProps) {
  return (
    <div className="border border-dashed border-border px-6 py-12 text-center">
      <Icon className="h-6 w-6 mx-auto mb-3 text-muted-foreground" strokeWidth={1.5} />
      <p className="font-medium mb-1">{title}</p>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
