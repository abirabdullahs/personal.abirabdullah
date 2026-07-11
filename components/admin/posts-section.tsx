import { Plus, Edit3, Trash2, Pin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { PortfolioPost, PortfolioProject } from '@/lib/portfolio-data';

type PostsSectionProps = {
  posts: PortfolioPost[];
  projects: PortfolioProject[];
  onAdd: () => void;
  onEdit: (post: PortfolioPost) => void;
  onDelete: (id: number | string, text: string) => void;
};

export function PostsSection({ posts, projects, onAdd, onEdit, onDelete }: PostsSectionProps) {
  const projectName = (projectId: PortfolioPost['project_id']) => {
    if (!projectId) return null;
    const match = projects.find((p) => String(p.id) === String(projectId));
    return match?.name || null;
  };

  const sortedPosts = [...posts].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) {
      return a.pinned ? -1 : 1;
    }
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={onAdd} className="gap-1.5 text-xs">
          <Plus className="h-4 w-4" /> Add Project Update
        </Button>
      </div>

      {sortedPosts.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">
          No project updates or posts have been created yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedPosts.map((post) => {
            const linkedProject = projectName(post.project_id);
            return (
              <Card key={post.id} className="border-border bg-card p-4 shadow-none">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-muted-foreground">
                        {post.created_at ? new Date(post.created_at).toLocaleString() : ''}
                      </p>
                      {post.pinned && (
                        <Badge variant="default" className="gap-1">
                          <Pin className="h-3 w-3" /> Pinned
                        </Badge>
                      )}
                      {linkedProject && (
                        <Badge variant="outline">part of {linkedProject}</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm">{post.text}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline">{post.visibility || 'public'}</Badge>
                    <Button size="icon" variant="ghost" onClick={() => onEdit(post)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onDelete(post.id, post.text)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
