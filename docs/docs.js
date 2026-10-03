// Docs: shows one article at a time from the URL hash. Without JavaScript every article stays visible in order.
document.documentElement.classList.add('docs-js');

const articles = [...document.querySelectorAll('.doc')];
const navLinks = [...document.querySelectorAll('.docs-group a')];
const toc = document.querySelector('.docs-toc');
const tocList = toc.querySelector('nav');
const menuToggle = document.querySelector('.docs-menu-toggle');
const navPanel = document.querySelector('.docs-nav-panel');
let active = null;

// Pages are addressed by data-page rather than id, so the browser never jumps past the header on load.
const articleFor = hash => {
  const id = decodeURIComponent(hash.replace(/^#/, ''));
  const page = articles.find(article => article.dataset.page === id);
  if (page) return { article: page };
  const target = id ? document.getElementById(id) : null;
  const article = target?.closest('.doc');
  return article ? { article, section: target } : { article: articles[0] };
};

function buildPager(article) {
  article.querySelector('.doc-pager')?.remove();
  const index = articles.indexOf(article);
  const link = (target, rel, label) => target
    ? `<a href="#${target.dataset.page}" rel="${rel}"><small>${label}</small><span>${target.querySelector('h1').textContent}</span></a>`
    : '';
  article.insertAdjacentHTML('beforeend', `<nav class="doc-pager" aria-label="Pages">${link(articles[index - 1], 'prev', '← Previous')}${link(articles[index + 1], 'next', 'Next →')}</nav>`);
}

function buildToc(article) {
  const headings = [...article.querySelectorAll('h2[id]')];
  toc.hidden = headings.length < 2;
  tocList.innerHTML = headings.map(heading => `<a href="#${heading.id}">${heading.textContent}</a>`).join('');
}

function show(hash, { scroll = true } = {}) {
  const { article, section } = articleFor(hash);
  if (article !== active) {
    articles.forEach(item => item.classList.toggle('is-active', item === article));
    navLinks.forEach(link => {
      if (link.getAttribute('href') === `#${article.dataset.page}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    buildPager(article);
    buildToc(article);
    document.title = `${article.querySelector('h1').textContent} · a1 docs`;
    active = article;
  }
  navPanel?.classList.remove('is-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  if (menuToggle) menuToggle.querySelector('span').textContent = article.querySelector('h1').textContent;
  if (!scroll) return;
  if (section) section.scrollIntoView();
  else window.scrollTo({ top: 0 });
  spy();
}

window.addEventListener('hashchange', () => show(location.hash));
show(location.hash, { scroll: Boolean(location.hash) });

// Highlights the section of the active article that is currently on screen.
function spy() {
  const links = [...tocList.querySelectorAll('a')];
  let current = links[0];
  links.forEach(link => {
    const heading = document.getElementById(link.hash.slice(1));
    if (heading && heading.getBoundingClientRect().top < 140) current = link;
  });
  // A short last section can never reach the top, so the bottom of the page selects it.
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = links.at(-1) ?? current;
  links.forEach(link => link.classList.toggle('is-active', link === current));
}
window.addEventListener('scroll', spy, { passive: true });

// Mobile: the sidebar collapses behind a toggle that names the current page.
menuToggle?.addEventListener('click', () => {
  const open = !navPanel.classList.contains('is-open');
  navPanel.classList.toggle('is-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
});

// Sidebar filter matches page titles and their keywords.
const filter = document.querySelector('.docs-filter');
const empty = document.querySelector('.docs-empty');
filter?.addEventListener('input', () => {
  const query = filter.value.trim().toLowerCase();
  let shown = 0;
  document.querySelectorAll('.docs-group').forEach(group => {
    let groupShown = 0;
    group.querySelectorAll('li').forEach(item => {
      const link = item.querySelector('a');
      const text = `${link.textContent} ${link.dataset.keywords || ''}`.toLowerCase();
      const match = !query || text.includes(query);
      item.hidden = !match;
      if (match) groupShown += 1;
    });
    group.hidden = groupShown === 0;
    shown += groupShown;
  });
  empty.hidden = shown > 0;
});

// Copy buttons on code blocks. Prompt glyphs and comments are left out of the copied text.
document.querySelectorAll('.doc-code').forEach(block => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'doc-copy';
  button.setAttribute('aria-label', 'Copy code');
  button.title = 'Copy code';
  const icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M15 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4"/></svg>';
  button.innerHTML = icon;
  block.append(button);
  button.addEventListener('click', async () => {
    const copy = block.querySelector('pre').cloneNode(true);
    copy.querySelectorAll('.prompt-glyph, .code-comment').forEach(node => node.remove());
    const text = copy.textContent.split('\n').map(line => line.trimEnd()).filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      button.classList.add('is-copied');
      button.setAttribute('aria-label', 'Copied');
      setTimeout(() => { button.classList.remove('is-copied'); button.setAttribute('aria-label', 'Copy code'); }, 1500);
    } catch {
      const range = document.createRange();
      range.selectNodeContents(block.querySelector('pre'));
      getSelection().removeAllRanges();
      getSelection().addRange(range);
    }
  });
});
