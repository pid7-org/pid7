import fs from 'node:fs/promises';
import path from 'node:path';
import { parseMarkdownBlog } from './parser';
import type { ParsedBlogPost } from './parser/types';

const BLOG_DIR = path.resolve(process.cwd(), 'src/content/blog');

export async function getAllBlogPosts(): Promise<ParsedBlogPost[]> {
  try {
    const files = await fs.readdir(BLOG_DIR);
    const mdFiles = files.filter((f) => f.endsWith('.md'));

    const posts: ParsedBlogPost[] = [];
    for (const file of mdFiles) {
      const filePath = path.join(BLOG_DIR, file);
      const rawContent = await fs.readFile(filePath, 'utf-8');
      const parsed = await parseMarkdownBlog(rawContent);
      posts.push(parsed);
    }

    // Sort by created date descending (assuming DD-MM-YYYY format)
    return posts.sort((a, b) => {
      const parseDate = (dStr: string) => {
        const parts = dStr.split('-');
        if (parts.length === 3) {
          return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
        }
        return 0;
      };
      return parseDate(b.frontmatter.created) - parseDate(a.frontmatter.created);
    });
  } catch {
    return [];
  }
}

export async function getBlogPostById(id: string): Promise<ParsedBlogPost | undefined> {
  const posts = await getAllBlogPosts();
  return posts.find((p) => p.frontmatter.id === id || p.frontmatter.id.toLowerCase() === id.toLowerCase());
}
