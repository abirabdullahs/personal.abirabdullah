import { getSupabase } from '@/lib/supabase';

export type BlogTag = {
  id: number | string;
  name: string;
  slug: string;
};

export function slugifyTagName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Given a comma-separated string of tag names, ensures each exists in the
 * `tags` table (creating any that don't), then syncs the `blog_tags` join
 * rows for this blog so it links to exactly those tags — nothing more,
 * nothing less. Returns the resolved tag names.
 */
export async function syncBlogTags(
  blogId: number | string,
  tagNamesRaw: string,
  allTags: BlogTag[],
  setAllTags: (tags: BlogTag[]) => void
): Promise<string[]> {
  const desiredNames = [...new Set(
    tagNamesRaw.split(',').map((t) => t.trim()).filter(Boolean)
  )];

  try {
    const client = getSupabase();
    let tagsCache = [...allTags];
    const resolvedTagIds: (number | string)[] = [];

    for (const name of desiredNames) {
      const existing = tagsCache.find((t) => t.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        resolvedTagIds.push(existing.id);
        continue;
      }
      const { data, error } = await client
        .from('tags')
        .insert({ name, slug: slugifyTagName(name) })
        .select('*')
        .single();
      if (error) throw error;
      tagsCache = [...tagsCache, data];
      resolvedTagIds.push(data.id);
    }
    setAllTags(tagsCache);

    const { data: existingLinks, error: linksError } = await client
      .from('blog_tags')
      .select('tag_id')
      .eq('blog_id', blogId);
    if (linksError) throw linksError;

    const existingTagIds = (existingLinks || []).map((row: any) => row.tag_id);
    const toRemove = existingTagIds.filter((id: any) => !resolvedTagIds.includes(id));
    const toAdd = resolvedTagIds.filter((id) => !existingTagIds.includes(id));

    for (const tagId of toRemove) {
      await client.from('blog_tags').delete().eq('blog_id', blogId).eq('tag_id', tagId);
    }
    if (toAdd.length > 0) {
      await client.from('blog_tags').insert(toAdd.map((tagId) => ({ blog_id: blogId, tag_id: tagId })));
    }

    return desiredNames;
  } catch (err) {
    console.error('Tag sync failed:', err);
    return desiredNames;
  }
}

/** Fetches the current tag names linked to a blog post, as a comma-joined string. */
export async function fetchBlogTagsInput(blogId: number | string): Promise<string> {
  try {
    const client = getSupabase();
    const { data, error } = await client
      .from('blog_tags')
      .select('tag_id, tags(name)')
      .eq('blog_id', blogId);
    if (error) throw error;
    const names = (data || [])
      .map((row: any) => row.tags?.name)
      .filter(Boolean);
    return names.join(', ');
  } catch (err) {
    console.warn('Could not load tags for this blog:', err);
    return '';
  }
}
