import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

function verifySignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signatureHeader);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

/**
 * Extracts "owner/repo" (lowercase) from any reasonable way a GitHub repo
 * URL might be written: https://github.com/owner/repo, with or without
 * .git/trailing slash, http://, no protocol at all (github.com/owner/repo),
 * www.github.com, or the SSH form git@github.com:owner/repo.git. Returns
 * null if it doesn't look like a GitHub URL at all.
 */
function extractRepoPath(url: string): string | null {
  if (!url) return null;
  const cleaned = url.trim().toLowerCase();

  const sshMatch = cleaned.match(/^git@github\.com:([^/]+\/[^/]+?)(\.git)?\/?$/);
  if (sshMatch) return sshMatch[1];

  const httpMatch = cleaned.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+\/[^/]+?)(\.git)?\/?$/);
  if (httpMatch) return httpMatch[1];

  return null;
}

function buildPrompt(commits: any[], repoName: string): string {
  const commitLines = commits
    .map((c) => {
      const files = [...(c.added || []), ...(c.modified || []), ...(c.removed || [])];
      const fileList = files.slice(0, 12).join(', ');
      return `- "${c.message.split('\n')[0]}"${fileList ? ` (files: ${fileList})` : ''}`;
    })
    .join('\n');

  return `You're writing a short, casual "project update" post for a developer's personal portfolio site (a running log readers can follow — think a devlog entry, not a press release).

Repo: ${repoName}
Recent commits:
${commitLines}

Write a 2-4 sentence first-person update describing what was built, fixed, or changed. Plain text only — no markdown formatting, no hashtags, no emoji, no "Introducing..." style hype. Sound like a real developer casually noting progress. Preserve natural paragraph breaks if the update covers more than one distinct change.`;
}

/**
 * Deterministic, no-AI fallback — used when both OpenAI and Gemini fail
 * (out of quota, rate-limited, network issue, etc). Guarantees a post
 * still gets created from the push instead of losing it entirely; it's
 * just a plain commit list instead of an AI-written summary.
 */
function buildFallbackSummary(commits: any[], repoName: string): string {
  const messages = commits.map((c) => c.message.split('\n')[0]).filter(Boolean);
  const bullets = messages.map((m) => `- ${m}`).join('\n');
  const plural = messages.length === 1 ? 'commit' : 'commits';
  return `Pushed ${messages.length} ${plural} to ${repoName}:\n${bullets}`;
}

class QuotaExceededError extends Error {}

async function summarizeWithOpenAI(prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    // 429 covers both rate-limit and quota-exhausted; OpenAI also uses the
    // 'insufficient_quota' error code specifically for billing/quota issues.
    if (res.status === 429 || errText.includes('insufficient_quota')) {
      throw new QuotaExceededError(`OpenAI quota/rate-limit hit (${res.status}): ${errText}`);
    }
    throw new Error(`OpenAI request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('OpenAI returned an empty response.');
  return text;
}

async function summarizeWithGemini(prompt: string): Promise<string> {
  const model = 'gemini-2.0-flash';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 300 },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error('Gemini returned an empty response.');
  return text;
}

/**
 * Tries OpenAI first, falls back to Gemini if OpenAI is specifically out of
 * quota/rate-limited, and falls back further to a plain-text commit list if
 * every configured AI provider fails for any reason. This function never
 * throws — there's always *some* summary to post, even under free-tier
 * rate limits on every provider at once.
 */
async function generateSummary(commits: any[], repoName: string): Promise<{ text: string; source: 'openai' | 'gemini' | 'fallback' }> {
  const prompt = buildPrompt(commits, repoName);
  const errors: string[] = [];

  if (process.env.OPENAI_API_KEY) {
    try {
      return { text: await summarizeWithOpenAI(prompt), source: 'openai' };
    } catch (err: any) {
      errors.push(`OpenAI: ${err.message}`);
      if (!(err instanceof QuotaExceededError)) {
        console.error('OpenAI failed (non-quota error):', err.message);
      }
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      return { text: await summarizeWithGemini(prompt), source: 'gemini' };
    } catch (err: any) {
      errors.push(`Gemini: ${err.message}`);
      console.error('Gemini failed:', err.message);
    }
  }

  if (errors.length > 0) {
    console.warn('All AI providers failed, using plain-text fallback summary:', errors.join(' | '));
  }
  return { text: buildFallbackSummary(commits, repoName), source: 'fallback' };
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error('GITHUB_WEBHOOK_SECRET is not set — rejecting webhook.');
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 500 });
  }

  const signature = request.headers.get('x-hub-signature-256');
  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  const event = request.headers.get('x-github-event');
  if (event === 'ping') {
    return NextResponse.json({ success: true, message: 'pong' });
  }
  if (event !== 'push') {
    return NextResponse.json({ success: true, message: `Ignored event: ${event}` });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  try {
    const defaultBranch = payload.repository?.default_branch;
    if (defaultBranch && payload.ref !== `refs/heads/${defaultBranch}`) {
      return NextResponse.json({
        success: true,
        message: 'Ignored: push was not to the default branch.',
        debug: { pushedRef: payload.ref, defaultBranch },
      });
    }

    const commits = (payload.commits || []).filter((c: any) => !c.message?.startsWith('Merge '));
    if (commits.length === 0) {
      return NextResponse.json({ success: true, message: 'No non-merge commits to summarize.' });
    }

    const repoUrl = payload.repository?.html_url;
    if (!repoUrl) {
      return NextResponse.json({ success: true, message: 'No repository URL in payload.' });
    }

    const client = getSupabaseAdmin();
    const { data: projects, error: projectsError } = await client.from('projects').select('*');
    if (projectsError) throw projectsError;

    const incomingPath = extractRepoPath(repoUrl);
    const matchedProject = (projects || []).find(
      (p: any) => p.github_repo && extractRepoPath(p.github_repo) === incomingPath
    );

    console.log('GitHub webhook: incoming repo', repoUrl, '-> path', incomingPath);
    console.log(
      'GitHub webhook: tracked project repos ->',
      (projects || []).map((p: any) => ({ name: p.name, github_repo: p.github_repo, path: extractRepoPath(p.github_repo) }))
    );

    if (!matchedProject) {
      return NextResponse.json({
        success: true,
        message: 'Repo is not linked to any tracked project — skipped.',
        debug: {
          incomingRepoUrl: repoUrl,
          incomingRepoPath: incomingPath,
          trackedProjectRepos: (projects || []).map((p: any) => ({ name: p.name, github_repo: p.github_repo })),
        },
      });
    }

    if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      console.warn('Neither OPENAI_API_KEY nor GEMINI_API_KEY is set — using plain-text fallback summary.');
    }

    const { text: summary, source } = await generateSummary(commits, matchedProject.name);

    const { error: insertError } = await client.from('posts').insert({
      text: summary,
      visibility: 'public',
      pinned: false,
      project_id: matchedProject.id,
      created_at: new Date().toISOString(),
    });
    if (insertError) throw insertError;

    return NextResponse.json({ success: true, project: matchedProject.name, postCreated: true, summarySource: source });
  } catch (err: any) {
    console.error('GitHub webhook processing failed:', err);
    return NextResponse.json({ error: err.message || 'Webhook processing failed.' }, { status: 500 });
  }
}
