// Automatically scans assets/projects/* folders and links.md files,
// updates research.html, design.html, and tools.html, and optionally pushes to Git.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const pages = ['research.html', 'design.html', 'tools.html'];

function getYouTubeEmbedUrl(url) {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : '';
}

function getField(text, label) {
  const match = text.match(new RegExp(`^[ \\t]*[-*][ \\t]*${label}:[ \\t]*([^\\r\\n]+)$`, 'mi'));
  return match ? match[1].trim() : '';
}

for (const page of pages) {
  let html = readFileSync(page, 'utf8');
  html = html.replace(
    /(<article class="portfolio-entry" id="[^"]+" data-project-folder="([^"]+)">[\s\S]*?<div class="project-links">)([\s\S]*?)(<\/div><div class="project-media">)([\s\S]*?)(<\/div><\/div><\/article>)/g,
    (full, prefix, folder, existingLinks, mid, existingMedia, suffix) => {
      if (!existsSync(folder)) return full;
      const files = readdirSync(folder).filter(f => !/^(links\.md|README\.md|\..*)$/i.test(f));
      const linksPath = join(folder, 'links.md');
      const linksText = existsSync(linksPath) ? readFileSync(linksPath, 'utf8') : '';

      const websiteUrl = getField(linksText, 'Website URL');
      const videoUrl = getField(linksText, 'Video URL');
      const paperUrl = getField(linksText, 'Paper URL');

      const links = [];
      if (websiteUrl && /^https?:\/\//i.test(websiteUrl)) {
        links.push(`<a href="${websiteUrl}" target="_blank" rel="noopener">Project website ↗</a>`);
      }
      if (videoUrl && /^https?:\/\//i.test(videoUrl)) {
        links.push(`<a href="${videoUrl}" target="_blank" rel="noopener">Watch video ↗</a>`);
      }
      if (paperUrl && /^https?:\/\//i.test(paperUrl)) {
        links.push(`<a href="${paperUrl}" target="_blank" rel="noopener">Read paper ↗</a>`);
      }

      const media = [];
      const ytEmbed = getYouTubeEmbedUrl(videoUrl);
      if (ytEmbed) {
        media.push(`<div class="video-embed"><iframe src="${ytEmbed}" title="Project video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe></div>`);
      }

      for (const file of files) {
        const encoded = `${folder}/${encodeURIComponent(file)}`;
        if (/\.pdf$/i.test(file)) {
          links.push(`<a href="${encoded}" target="_blank" rel="noopener">Open PDF in new tab ↗</a>`);
          media.push(`<iframe class="pdf-viewer" src="${encoded}#view=FitH" title="${file}" loading="lazy"></iframe>`);
        } else if (/\.(mp4|webm)$/i.test(file)) {
          media.push(`<video src="${encoded}" controls playsinline preload="metadata"></video>`);
        } else if (/\.(png|jpe?g|webp|gif|svg)$/i.test(file)) {
          media.push(`<img src="${encoded}" alt="${file.replace(/\.[^.]+$/, '')}" loading="lazy">`);
        }
      }

      return `${prefix}${links.join('')}${mid}${media.join('')}${suffix}`;
    }
  );
  writeFileSync(page, html, 'utf8');
  console.log(`Synced ${page}`);
}
