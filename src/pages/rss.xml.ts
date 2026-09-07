import type { APIRoute } from 'astro';
import { getAllBlogPosts } from '../lib/blog';

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site ? site.href.replace(/\/$/, '') : 'https://pid7.com';
  const posts = await getAllBlogPosts();

  const items = posts.map((post) => {
    const pubDate = new Date(post.frontmatter.created).toUTCString();
    return `    <item>
      <title><![CDATA[${post.frontmatter.title}]]></title>
      <link>${baseUrl}/blog/${post.frontmatter.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${post.frontmatter.slug}</guid>
      <pubDate>${pubDate}</pubDate>
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>pid7 × engineering ideas into reality</title>
    <description>engineering ideas into reality</description>
    <link>${baseUrl}/</link>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <language>en-us</language>
${items}
  </channel>
</rss>`.trim();

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
