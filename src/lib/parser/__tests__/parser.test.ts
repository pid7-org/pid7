import { describe, expect, it } from 'vitest';
import { parseFrontmatter, parseMarkdownBlog } from '../index';

const SAMPLE_MARKDOWN = `---
id: test-post
title: Unit Test Post Title
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

{ANIM1: interactive animation to visualize byte-by-byte scan}

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

describe('Custom Markdown Blog Parser Module', () => {
  it('correctly parses frontmatter properties', () => {
    const { frontmatter } = parseFrontmatter(SAMPLE_MARKDOWN);
    expect(frontmatter.id).toBe('test-post');
    expect(frontmatter.title).toBe('Unit Test Post Title');
    expect(frontmatter.created).toBe('01-09-2026');
    expect(frontmatter.lastUpdated).toBe('05-09-2026');
    expect(frontmatter.tags).toEqual(['Rust', 'SIMD', 'Test']);
  });

  it('renders custom angle code blocks <> with captions', async () => {
    const parsed = await parseMarkdownBlog(SAMPLE_MARKDOWN);
    expect(parsed.html).toContain('custom-code-block-angle');
    expect(parsed.html).not.toContain('@desc');
    expect(parsed.html).toContain('Assembly scan code snippet');
  });

  it('renders custom tilde code blocks ~ with @desc captions', async () => {
    const parsed = await parseMarkdownBlog(SAMPLE_MARKDOWN);
    expect(parsed.html).toContain('custom-code-block-tilde');
    expect(parsed.html).toContain('AVX-512 loading snippet');
  });

  it('transforms {ANIM...} placeholders into animation containers', async () => {
    const parsed = await parseMarkdownBlog(SAMPLE_MARKDOWN);
    expect(parsed.html).toContain('data-anim-id="ANIM1"');
    expect(parsed.html).toContain('interactive animation to visualize byte-by-byte scan');
  });

  it('renders callout blocks > [!INFO]', async () => {
    const parsed = await parseMarkdownBlog(SAMPLE_MARKDOWN);
    expect(parsed.html).toContain('callout-info');
    expect(parsed.html).toContain('Hardware extensions info callout');
  });

  it('renders LaTeX math equations using KaTeX', async () => {
    const parsed = await parseMarkdownBlog(SAMPLE_MARKDOWN);
    expect(parsed.html).toContain('katex');
    expect(parsed.html).toContain('Throughput');
  });

  it('extracts glossary terms and definitions', async () => {
    const parsed = await parseMarkdownBlog(SAMPLE_MARKDOWN);
    expect(parsed.glossary.length).toBe(2);
    expect(parsed.glossary[0].term).toBe('GPR');
    expect(parsed.glossary[0].definitionHtml).toContain('General Purpose Registers');
    expect(parsed.glossary[1].term).toBe('DRAM');
  });

  it('extracts references and footnote anchors', async () => {
    const parsed = await parseMarkdownBlog(SAMPLE_MARKDOWN);
    expect(parsed.references.length).toBe(1);
    expect(parsed.references[0].id).toBe('1');
    expect(parsed.references[0].contentHtml).toContain('Footnote details for reference 1');
  });

  it('parses actual 001.md file without errors', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const fileContent = await fs.readFile(path.resolve(process.cwd(), 'src/content/blog/001.md'), 'utf-8');
    const parsed = await parseMarkdownBlog(fileContent);

    expect(parsed.frontmatter.id).toBe('ashwa-devlog');
    expect(parsed.frontmatter.title).toBe('Searching through 150 GiB of Text per Second with SIMD');
    expect(parsed.frontmatter.created).toBe('02-09-2026');
    expect(parsed.frontmatter.lastUpdated).toBe('04-09-2026');
    expect(parsed.frontmatter.tags).toEqual(['Ashwa', 'SIMD', 'Rust', 'Search']);
    expect(parsed.readTimeMinutes).toBeGreaterThan(0);
    expect(parsed.glossary.length).toBe(7);
    expect(parsed.references.length).toBe(4);
    expect(parsed.html).toContain('custom-code-block-angle');
    expect(parsed.html).toContain('custom-code-block-tilde');
    expect(parsed.html).toContain('<em>For completely L1D cache-resident payloads');
    expect(parsed.html).toContain('data-anim-id="ANIM1"');
    expect(parsed.html).toContain('data-anim-id="ANIM2"');
    expect(parsed.html).toContain('data-anim-id="ANIM3"');
  });
});

