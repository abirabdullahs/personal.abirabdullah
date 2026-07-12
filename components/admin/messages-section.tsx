import { Mail, MailOpen, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { ContactMessage } from '@/lib/portfolio-data';

type MessagesSectionProps = {
  messages: ContactMessage[];
  filteredMessages: ContactMessage[];
  onToggleRead: (message: ContactMessage) => void;
  onDelete: (id: number | string, name: string) => void;
};

export function MessagesSection({ messages, filteredMessages, onToggleRead, onDelete }: MessagesSectionProps) {
  const sorted = [...filteredMessages].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );

  return (
    <div className="space-y-6">
      {messages.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">
          No messages yet. Submissions from the Contact page form will show up here.
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">
          No messages matched the current search.
        </div>
      ) : (
        <div className="grid gap-4">
          {sorted.map((msg) => (
            <Card
              key={msg.id}
              className={`border-border p-4 shadow-none ${msg.read ? 'bg-card' : 'bg-primary/5 border-primary/30'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {!msg.read && <Badge className="gap-1">New</Badge>}
                    <p className="font-semibold">{msg.name}</p>
                    <a href={`mailto:${msg.email}`} className="text-sm text-muted-foreground hover:text-primary hover:underline">
                      {msg.email}
                    </a>
                    <p className="text-xs text-muted-foreground ml-auto shrink-0">
                      {msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{msg.message}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => onToggleRead(msg)} title={msg.read ? 'Mark unread' : 'Mark read'}>
                    {msg.read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => onDelete(msg.id, msg.name)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
