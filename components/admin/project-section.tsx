import { Briefcase, Edit3, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PortfolioProject } from '@/lib/portfolio-data';

type ProjectSectionProps = {
  projects: PortfolioProject[];
  filteredProjects: PortfolioProject[];
  onAdd: () => void;
  onEdit: (project: PortfolioProject) => void;
  onDelete: (id: number | string, name: string) => void;
};

export function ProjectSection({ projects, filteredProjects, onAdd, onEdit, onDelete }: ProjectSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={onAdd} className="gap-1.5 text-xs">
          <Briefcase className="h-4 w-4" /> Add Project Showcase
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">
          No projects have been added yet. Create one from the panel above to populate the public projects page.
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">
          No projects matched the current search.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="flex h-full flex-col overflow-hidden border-border bg-card shadow-none transition-all duration-200 hover:border-primary/50">
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                {project.image_url ? (
                  <Image src={project.image_url} alt={project.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{project.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => onEdit(project)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onDelete(project.id, project.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="mt-auto flex flex-col gap-3 border-t border-border/50 pt-4">
                <p className="text-sm text-muted-foreground">{project.short_description}</p>
                <div className="flex flex-wrap gap-2">
                  {project.tech_stack?.map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
