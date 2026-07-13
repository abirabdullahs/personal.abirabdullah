import { FileText, Edit3, Trash2 } from 'lucide-react';
import Image from 'next/image';
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
        <div className="space-y-3">
          {filteredBlogs.map((blog) => (
            <Card key={blog.id} className="border-border bg-card shadow-none p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {blog.featured_image && (
                  <div className="relative w-full sm:w-32 aspect-video sm:aspect-square shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                    <Image src={blog.featured_image} alt={blog.title} fill className="object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={blog.status === 'published' ? 'default' : 'secondary'}>{blog.status}</Badge>
                    {blog.category && <Badge variant="outline">{blog.category}</Badge>}
                  </div>
                  <div>
                    <p className="font-medium leading-snug break-words">{blog.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{blog.excerpt}</p>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 shrink-0 self-start">
                  <Button size="icon" variant="ghost" onClick={() => onEdit(blog)} aria-label="Edit post">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => onDelete(blog.id, blog.title)} aria-label="Delete post">
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
