import { FileText, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { PortfolioPost } from '@/lib/portfolio-data';

type PostsSectionProps = {
  posts: PortfolioPost[];
  onAdd: () => void;
};

export function PostsSection({ posts, onAdd }: PostsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={onAdd} className="gap-1.5 text-xs">
          <Plus className="h-4 w-4" /> Add Project Update
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">
          No project updates or posts have been created yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.id} className="border-border bg-card p-4 shadow-none">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{post.created_at}</p>
                  <p className="mt-1 text-sm">{post.text}</p>
                </div>
                <Badge variant="outline">{post.visibility || 'public'}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
