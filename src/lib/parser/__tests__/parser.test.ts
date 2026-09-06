import { describe, expect, it } from 'vitest';
import { parseFrontmatter, parseMarkdownBlog } from '../index';
import { getAllBlogPosts } from '../../blog';

const DUMMY_MARKDOWN_POST = `---
slug: dummy-unit-test-post
title: Dummy Unit Test Post Title
created: 01-09-2026
last-updated: 05-09-2026
tags: Rust, SIMD, Test
---

Baseline introduction text with inline math $2^{30}$ bytes and citation[^1].

<>
\`\`\`asm
  movzx al, byte [rdi]
\`\`\`
@desc Assembly scan code snippet
</>

{@anim (001) interactive animation to visualize byte-by-byte scan}

> [!INFO]
> Hardware extensions info callout.

~
\`\`\`rust
let v = _mm512_loadu_si512(ptr);
\`\`\`
@desc AVX-512 loading snippet
~

## § SWAR Header

$$
\\text{Throughput} = \\frac{\\text{LFB} \\times 64}{\\text{DRAM Latency}}
$$

@glossary

* GPR: General Purpose Registers are high-speed registers.
* DRAM: Dynamic Random Access Memory system memory.

@references

[^1]: Footnote details for reference 1.
`;

describe('Markdown Parser Unit Tests (Isolated Dummy Post)', () => {
  it('correctly parses frontmatter properties', () => {
    const { frontmatter } = parseFrontmatter(DUMMY_MARKDOWN_POST);
    expect(frontmatter.slug).toBe('dummy-unit-test-post');
    expect(frontmatter.title).toBe('Dummy Unit Test Post Title');
    expect(frontmatter.created).toBe('01-09-2026');
    expect(frontmatter.lastUpdated).toBe('05-09-2026');
    expect(frontmatter.tags).toEqual(['Rust', 'SIMD', 'Test']);
  });

  it('renders custom angle code blocks <> with captions', async () => {
    const parsed = await parseMarkdownBlog(DUMMY_MARKDOWN_POST);
    expect(parsed.html).toContain('custom-code-block-angle');
    expect(parsed.html).not.toContain('@desc');
    expect(parsed.html).toContain('Assembly scan code snippet');
  });

  it('renders custom tilde code blocks ~ with @desc captions', async () => {
    const parsed = await parseMarkdownBlog(DUMMY_MARKDOWN_POST);
    expect(parsed.html).toContain('custom-code-block-tilde');
    expect(parsed.html).toContain('AVX-512 loading snippet');
  });

  it('transforms {@anim (id) desc} placeholders into animation containers', async () => {
    const parsed = await parseMarkdownBlog(DUMMY_MARKDOWN_POST);
    expect(parsed.html).toContain('data-anim-id="001"');
    expect(parsed.html).toContain('interactive animation to visualize byte-by-byte scan');
  });

  it('renders callout blocks > [!INFO]', async () => {
    const parsed = await parseMarkdownBlog(DUMMY_MARKDOWN_POST);
    expect(parsed.html).toContain('callout-info');
    expect(parsed.html).toContain('Hardware extensions info callout');
  });

  it('renders LaTeX math equations using KaTeX', async () => {
    const parsed = await parseMarkdownBlog(DUMMY_MARKDOWN_POST);
    expect(parsed.html).toContain('katex');
    expect(parsed.html).toContain('Throughput');
  });

  it('extracts glossary terms and definitions', async () => {
    const parsed = await parseMarkdownBlog(DUMMY_MARKDOWN_POST);
    expect(parsed.glossary.length).toBe(2);
    expect(parsed.glossary[0].term).toBe('GPR');
    expect(parsed.glossary[0].definitionHtml).toContain('General Purpose Registers');
    expect(parsed.glossary[1].term).toBe('DRAM');
  });

  it('extracts references and footnote anchors', async () => {
    const parsed = await parseMarkdownBlog(DUMMY_MARKDOWN_POST);
    expect(parsed.references.length).toBe(1);
    expect(parsed.references[0].id).toBe('1');
    expect(parsed.references[0].contentHtml).toContain('Footnote details for reference 1');
  });

  it('includes language header and copy button in custom code blocks', async () => {
    const parsed = await parseMarkdownBlog(DUMMY_MARKDOWN_POST);
    expect(parsed.html).toContain('copy-code-btn');
    expect(parsed.html).toContain('aria-label="Copy code"');
  });

  it('preserves raw unescaped code in data-code attribute', async () => {
    const parsed = await parseMarkdownBlog(DUMMY_MARKDOWN_POST);
    const expectedRawAsm = encodeURIComponent('movzx al, byte [rdi]');
    expect(parsed.html).toContain(`data-code="${expectedRawAsm}"`);
    expect(decodeURIComponent(expectedRawAsm)).toBe('movzx al, byte [rdi]');
  });
});

describe('Live Blog Post Content Validator (Dynamic Suite)', () => {
  it('validates all live blog posts in src/content/blog for formatting and structure', async () => {
    const posts = await getAllBlogPosts();
    expect(posts.length).toBeGreaterThan(0);

    for (const post of posts) {
      expect(post.frontmatter.title).toBeTruthy();
      expect(post.frontmatter.slug).toBeTruthy();
      expect(post.frontmatter.created).toMatch(/^\d{2}-\d{2}-\d{4}$|^\d{4}-\d{2}-\d{2}$/);
      expect(Array.isArray(post.frontmatter.tags)).toBe(true);

      expect(post.html).toBeTruthy();
      expect(post.wordCount).toBeGreaterThan(0);
      expect(post.readTimeMinutes).toBeGreaterThanOrEqual(1);

      for (const item of post.glossary) {
        expect(item.term).toBeTruthy();
        expect(item.definitionHtml).toBeTruthy();
      }

      for (const ref of post.references) {
        expect(ref.id).toBeTruthy();
        expect(ref.label).toBeTruthy();
        expect(ref.contentHtml).toBeTruthy();
      }
    }
  });
});
