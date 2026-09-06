export interface BlogFrontmatter {
  id: string;
  title: string;
  created: string;
  lastUpdated: string;
  tags: string[];
}

export interface GlossaryItem {
  term: string;
  definitionHtml: string;
}

export interface ReferenceItem {
  id: string;
  label: string;
  contentHtml: string;
}

export interface ParsedBlogPost {
  frontmatter: BlogFrontmatter;
  html: string;
  glossary: GlossaryItem[];
  references: ReferenceItem[];
  rawMarkdown: string;
}
