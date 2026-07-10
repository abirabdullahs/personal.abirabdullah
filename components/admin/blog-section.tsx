import { FileText, Edit3, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { PortfolioBlog } from '@/lib/portfolio-data';

type BlogSectionProps = {
  blogs: PortfolioBlog[];
  filteredBlogs: PortfolioBlog[];
  onAdd: () => void;
  onEdit: (blog: PortfolioBlog) => void;
  onDelete: (id: number | string, title: string) => void;
};

export function BlogSection({ blogs, filteredBlogs, onAdd, onEdit, onDelete }: BlogSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={onAdd} className="gap-1.5 text-xs">
          <FileText className="h-4 w-4" /> Create and Publish Post
        </Button>
      </div>

      {blogs.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">
          No blog posts have been created yet. Publish one to make it visible on the public blog page.
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">
          No blog posts matched the current search.
        </div>
      ) : (
        <Card className="overflow-hidden border-border bg-card shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBlogs.map((blog) => (
                  <tr key={blog.id} className="border-t border-border/60">
                    <td className="px-4 py-3">
                      <div className="font-medium">{blog.title}</div>
                      <div className="text-sm text-muted-foreground">{blog.excerpt}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={blog.status === 'published' ? 'default' : 'secondary'}>{blog.status}</Badge>
                    </td>
                    <td className="px-4 py-3">{blog.category}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => onEdit(blog)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => onDelete(blog.id, blog.title)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
