'use client';

import * as React from 'react';
import Link from 'next/link';
import { GitCommit, GitFork, GitPullRequest, Star, FolderPlus, CircleDot, Loader2 } from 'lucide-react';

const GITHUB_USERNAME = 'abirabdullahs';

type GithubEvent = {
  id: string;
  type: string;
  repo: { name: string; url: string };
  payload: any;
  created_at: string;
};

type FeedItem = {
  id: string;
  icon: React.ReactNode;
  text: string;
  repoName: string;
  repoUrl: string;
  createdAt: string;
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const units: [number, string][] = [
    [31536000, 'y'], [2592000, 'mo'], [604800, 'w'], [86400, 'd'], [3600, 'h'], [60, 'm'],
  ];
  for (const [secs, label] of units) {
    const value = Math.floor(seconds / secs);
    if (value >= 1) return `${value}${label} ago`;
  }
  return 'just now';
}

function mapEventToFeedItem(event: GithubEvent): FeedItem | null {
  const repoUrl = `https://github.com/${event.repo.name}`;
  const base = { id: event.id, repoName: event.repo.name, repoUrl, createdAt: event.created_at };

  switch (event.type) {
    case 'PushEvent': {
      const count = event.payload?.commits?.length || 1;
      return { ...base, icon: <GitCommit className="h-3.5 w-3.5" />, text: `Pushed ${count} commit${count > 1 ? 's' : ''} to` };
    }
    case 'CreateEvent':
      if (event.payload?.ref_type === 'repository') {
        return { ...base, icon: <FolderPlus className="h-3.5 w-3.5" />, text: 'Created repository' };
      }
      return null;
    case 'PullRequestEvent':
      return { ...base, icon: <GitPullRequest className="h-3.5 w-3.5" />, text: `${event.payload?.action === 'opened' ? 'Opened' : 'Updated'} a pull request in` };
    case 'IssuesEvent':
      return { ...base, icon: <CircleDot className="h-3.5 w-3.5" />, text: `${event.payload?.action === 'opened' ? 'Opened' : 'Updated'} an issue in` };
    case 'WatchEvent':
      return { ...base, icon: <Star className="h-3.5 w-3.5" />, text: 'Starred' };
    case 'ForkEvent':
      return { ...base, icon: <GitFork className="h-3.5 w-3.5" />, text: 'Forked' };
    default:
      return null;
  }
}

export function GithubActivityFeed() {
  const [items, setItems] = React.useState<FeedItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=30`, {
          headers: { Accept: 'application/vnd.github+json' },
        });
        if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);
        const events: GithubEvent[] = await res.json();

        const mapped = events
          .map(mapEventToFeedItem)
          .filter((item): item is FeedItem => item !== null)
          .slice(0, 5);

        if (!cancelled) setItems(mapped);
      } catch (err) {
        console.warn('GitHub activity feed unavailable:', err);
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed || (!loading && items.length === 0)) return null;

  return (
    <section className="container px-4">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-serif text-3xl tracking-tight">GitHub Activity</h2>
        <Link href={`https://github.com/${GITHUB_USERNAME}`} target="_blank" rel="noopener noreferrer">
          <span className="text-sm text-muted-foreground hover:text-foreground transition-colors">@{GITHUB_USERNAME} →</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="divide-y divide-border border-t border-b border-border max-w-2xl">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 py-4 group hover:bg-accent/40 transition-colors -mx-2 px-2"
            >
              <span className="text-muted-foreground shrink-0">{item.icon}</span>
              <span className="text-sm flex-1 min-w-0">
                <span className="text-muted-foreground">{item.text}</span>{' '}
                <span className="font-medium group-hover:text-primary transition-colors">{item.repoName}</span>
              </span>
              <span className="font-mono text-[11px] text-muted-foreground shrink-0">{timeAgo(item.createdAt)}</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
