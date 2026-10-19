// Native details keep the panels usable without JavaScript.
// Hover reveals; click/Enter/Space pins open; Escape closes.
const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
const cards = [...document.querySelectorAll('.project')];
const states = new Map(cards.map(card => [card, { pinned: false, hovered: false, dismissed: false }]));
function render(card) {
  const state = states.get(card);
  card.open = state.pinned || (state.hovered && !state.dismissed);
  card.querySelector('.reveal-label').firstChild.textContent = state.pinned ? 'Close ' : card.open ? 'Keep open ' : 'Discover ';
}
cards.forEach(card => {
  const state = states.get(card);
  card.addEventListener('pointerenter', event => {
    if (!hoverQuery.matches || event.pointerType === 'touch') return;
    state.hovered = true;
    state.dismissed = false;
    render(card);
  });
  card.addEventListener('pointerleave', () => {
    state.hovered = false;
    state.dismissed = false;
    render(card);
  });
  card.querySelector('summary').addEventListener('click', event => {
    event.preventDefault();
    state.pinned = !state.pinned;
    state.dismissed = !state.pinned;
    render(card);
  });
  // Keep a revealed link available while keyboard focus is inside the panel.
  card.addEventListener('focusin', event => {
    if (event.target.closest('.project-description')) {
      state.pinned = true;
      render(card);
    }
  });
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  cards.forEach(card => {
    if (card.querySelector('.project-description').contains(document.activeElement)) card.querySelector('summary').focus();
    const state = states.get(card);
    state.pinned = false;
    state.dismissed = true;
    render(card);
  });
});
function updateHint() {
  const hint = document.querySelector('.interaction-hint');
  if (hint) hint.textContent = hoverQuery.matches ? 'Hover to discover · Click to keep open' : 'Tap a panel to discover';
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

// Optional auto-loader for project media & links from assets/projects/<folder>/links.md
document.querySelectorAll('.portfolio-entry[data-project-folder]').forEach(async entry => {
  const folder = entry.getAttribute('data-project-folder');
  try {
    const res = await fetch(`${folder}/links.md`);
    if (!res.ok) return;
    const text = await res.text();
    const getField = label => {
      const match = text.match(new RegExp(`^-\\s*${label}:\\s*(.+)$`, 'mi'));
      return match ? match[1].trim() : '';
    };
    const linksBox = entry.querySelector('.project-links');
    const addLink = (url, label) => {
      if (!url || !linksBox || [...linksBox.querySelectorAll('a')].some(a => a.href === url || a.getAttribute('href') === url)) return;
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = `${label} ↗`;
      linksBox.appendChild(a);
    };
    addLink(getField('Website URL'), 'Project website');
    addLink(getField('Video URL'), 'Watch video');
    addLink(getField('Paper URL'), 'Read paper');

    const mediaList = getField('Media files \\(comma-separated filenames in this folder\\)')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const mediaBox = entry.querySelector('.project-media');
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
