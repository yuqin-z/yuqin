// Hover previews the panel overview; clicking anywhere on a panel navigates to its subpage.
const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
const cards = [...document.querySelectorAll('.project')];
const states = new Map(cards.map(card => [card, { hovered: false }]));
function render(card) {
  const state = states.get(card);
  card.open = state.hovered;
}
cards.forEach(card => {
  const state = states.get(card);
  card.addEventListener('pointerenter', event => {
    if (!hoverQuery.matches || event.pointerType === 'touch') return;
    state.hovered = true;
    render(card);
  });
  card.addEventListener('pointerleave', () => {
    state.hovered = false;
    render(card);
  });
  card.querySelector('summary').addEventListener('click', event => {
    event.preventDefault();
    const link = card.querySelector('.section-link')?.getAttribute('href');
    if (link) window.location.href = link;
  });
  card.addEventListener('focusin', event => {
    if (event.target.closest('.project-description')) {
      state.hovered = true;
      render(card);
    }
  });
});
function updateHint() {
  const hint = document.querySelector('.interaction-hint');
  if (hint) hint.textContent = hoverQuery.matches ? 'Hover to preview · Click any panel to explore' : 'Tap any panel to explore';
  cards.forEach(card => { states.get(card).hovered = false; render(card); });
}
hoverQuery.addEventListener('change', updateHint);
updateHint();

// Highlight active project tab in sticky left column on subpages.
const navLinks = [...document.querySelectorAll('.project-nav a')];
if (navLinks.length) {
  const setActive = id => {
    navLinks.forEach(link => {
      if (link.getAttribute('href') === `#${id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  navLinks.forEach(link => {
    link.addEventListener('click', () => setActive(link.getAttribute('href').slice(1)));
  });
  const entries = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(observed => {
      const visible = observed.filter(item => item.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) setActive(visible[0].target.id);
    }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
    entries.forEach(entry => observer.observe(entry));
  }
}

function getYouTubeEmbedUrl(url) {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : '';
}

// Auto-loader for project media & links from assets/projects/<folder>/links.md
document.querySelectorAll('.portfolio-entry[data-project-folder]').forEach(async entry => {
  const folder = entry.getAttribute('data-project-folder');
  try {
    const res = await fetch(`${folder}/links.md`);
    if (!res.ok) return;
    const text = await res.text();
    const getField = label => {
      const match = text.match(new RegExp(`^[ \\t]*[-*][ \\t]*${label}:[ \\t]*([^\\r\\n]+)$`, 'mi'));
      return match ? match[1].trim() : '';
    };
    const linksBox = entry.querySelector('.project-links');
    const mediaBox = entry.querySelector('.project-media');
    const addLink = (url, label) => {
      if (!url || !/^(https?:\/\/|assets\/)/i.test(url) || !linksBox) return;
      if ([...linksBox.querySelectorAll('a')].some(a => a.href === url || a.getAttribute('href') === url)) return;
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = `${label} ↗`;
      linksBox.appendChild(a);
    };
    const websiteUrl = getField('Website URL');
    const videoUrl = getField('Video URL');
    const paperUrl = getField('Paper URL');
    addLink(websiteUrl, 'Project website');
    addLink(videoUrl, 'Watch video');
    addLink(paperUrl, 'Read paper');

    const ytEmbed = getYouTubeEmbedUrl(videoUrl);
    if (ytEmbed && mediaBox && !mediaBox.querySelector(`iframe[src="${ytEmbed}"]`)) {
      const wrap = document.createElement('div');
      wrap.className = 'video-embed';
      const iframe = document.createElement('iframe');
      iframe.src = ytEmbed;
      iframe.title = `${entry.querySelector('h2')?.textContent || 'Project'} video`;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';
      wrap.appendChild(iframe);
      mediaBox.appendChild(wrap);
    }

    const mediaList = getField('Media files \\(comma-separated filenames in this folder\\)')
      .split(',')
      .map(s => s.trim())
      .filter(s => s && !/^[-*]/.test(s));
    if (mediaList.length && mediaBox) {
      mediaBox.innerHTML = '';
      mediaList.forEach(file => {
        const src = file.includes('/') ? file : `${folder}/${file}`;
        if (/\.(mp4|webm)$/i.test(file)) {
          const video = document.createElement('video');
          video.src = src;
          video.controls = true;
          video.playsInline = true;
          mediaBox.appendChild(video);
        } else if (/\.pdf$/i.test(file)) {
          const iframe = document.createElement('iframe');
          iframe.className = 'pdf-viewer';
          iframe.src = `${src}#view=FitH`;
          iframe.title = `${entry.querySelector('h2')?.textContent || 'Project'} PDF`;
          iframe.loading = 'lazy';
          mediaBox.appendChild(iframe);
        } else {
          const img = document.createElement('img');
          img.src = src;
          img.alt = entry.querySelector('h2')?.textContent || '';
          img.loading = 'lazy';
          mediaBox.appendChild(img);
        }
      });
    }
  } catch {
    // Silent fallback when opened via file:// without a server
  }
});
