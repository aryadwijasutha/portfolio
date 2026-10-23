(() => {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const DATA_URL = 'content/site.json';
  const data = window.V11 = { content: null };

  const icons = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
    moon: '<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8"/><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z"/>',
    case: '<rect x="3" y="7.5" width="18" height="13" rx="2"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3 13h18M10 13v2.5m4-2.5v2.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
    phone: '<path d="m5 3 4 1 1 5-3 2a15 15 0 0 0 6 6l2-3 5 1 1 4c-9 5-22-8-16-16Z"/>',
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7.5 10.5V17M7.5 7.2v.1M12 17v-4a2.5 2.5 0 0 1 5 0v4"/>'
  };

  function svg(name) {
    const node = document.createElementNS(NS, 'svg');
    node.setAttribute('aria-hidden', 'true');
    node.setAttribute('focusable', 'false');
    node.setAttribute('viewBox', '0 0 24 24');
    node.setAttribute('fill', 'none');
    node.setAttribute('stroke', 'currentColor');
    node.setAttribute('stroke-width', '1.5');
    node.setAttribute('stroke-linecap', 'round');
    node.setAttribute('stroke-linejoin', 'round');
    node.innerHTML = icons[name] || icons.arrow;
    return node;
  }

  function text(tag, value, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value != null) node.textContent = value;
    return node;
  }

  function rich(parent, value) {
    const re = /\[([^\]]+)\]\(([^)]+)\)/g;
    let last = 0;
    let match;
    while ((match = re.exec(value))) {
      if (match.index > last) parent.append(value.slice(last, match.index));
      const a = text('a', match[1]);
      a.href = routeHref(match[2]);
      parent.append(a);
      last = re.lastIndex;
    }
    if (last < value.length) parent.append(value.slice(last));
    return parent;
  }

  function routeHref(href) {
    return href.replace(/^\.\//, '').replace(/\.html(?=#|$)/, '') || 'about';
  }

  function routeFromLocation() {
    const hash = location.hash.replace(/^#/, '');
    if (data.content && data.content.pages[hash]) return hash;
    const path = location.pathname.split('/').pop();
    if (!path || path === 'index.html') return 'index';
    const clean = path.replace(/\.html$/, '');
    return data.content && data.content.pages[clean] ? clean : 'index';
  }

  function sectionHead(page) {
    const h = text('h1', page.title);
    return h;
  }

  function facts(rows) {
    const dl = text('dl', null, 'facts');
    rows.forEach(([label, value, href, iconName]) => {
      const row = text('div');
      const dt = text('dt');
      dt.append(svg(iconName), document.createTextNode(label));
      const dd = text('dd');
      if (href) {
        const a = text('a', value);
        a.href = href;
        if (href.startsWith('http')) { a.target = '_blank'; a.rel = 'noreferrer'; }
        dd.append(a);
      } else dd.textContent = value;
      row.append(dt, dd);
      dl.append(row);
    });
    return dl;
  }

  function entry(item) {
    const article = text('article', null, 'entry');
    if (item.id) article.id = item.id;
    article.append(text('p', item.period, 'year'));
    const body = text('div', null, 'entry-body');
    body.append(text('h2', item.title));
    body.append(text('p', item.meta, 'entry-meta'));
    item.body.forEach(value => body.append(rich(text('p'), value)));
    if (item.figures) body.append(text('p', item.figures, 'figures'));
    if (item.stack) body.append(text('p', item.stack, 'stack'));
    article.append(body);
    return article;
  }

  function render(key, push = false) {
    const page = data.content.pages[key];
    if (!page) return;
    const main = document.getElementById('main');
    const fragment = document.createDocumentFragment();
    fragment.append(sectionHead(page));

    if (page.lede) fragment.append(text('p', page.lede, 'lede'));
    page.blocks.forEach(block => {
      if (block.type === 'prose') {
        const prose = text('div', null, 'prose');
        block.items.forEach(value => prose.append(rich(text('p'), value)));
        fragment.append(prose);
      } else if (block.type === 'facts') {
        fragment.append(facts(block.rows));
      } else {
        fragment.append(entry(block));
      }
    });

    const next = data.content.pager[key];
    const nextLink = text('a', null, 'next');
    nextLink.href = `#${next[0]}`;
    nextLink.append(document.createTextNode(next[1] + ' '), svg('arrow'));
    fragment.append(nextLink);

    const footer = text('footer', data.content.footer);
    fragment.append(footer);

    main.replaceChildren(fragment);
    document.title = `${page.title} — Arya Dwija Sutha`;
    document.querySelectorAll('#nav a').forEach(a => {
      a.toggleAttribute('aria-current', a.dataset.route === key);
    });
    if (push) history.pushState({ key }, '', `#${key}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    main.focus({ preventScroll: true });
  }

  function buildNav() {
    const nav = document.getElementById('nav');
    data.content.nav.forEach(([key, label], index) => {
      const li = text('li');
      const a = text('a');
      a.href = `#${key}`;
      a.dataset.route = key;
      a.append(text('span', `${String(index).padStart(2, '0')}.`), document.createTextNode(` ${label}`));
      li.append(a);
      nav.append(li);
    });
    nav.addEventListener('click', event => {
      const link = event.target.closest('a[data-route]');
      if (!link) return;
      event.preventDefault();
      render(link.dataset.route, true);
    });
  }

  function buildBrand() {
    const brand = document.querySelector('.brand');
    if (!brand.innerHTML.trim()) brand.innerHTML = data.mark;
  }

  function theme() {
    document.querySelectorAll('button[data-theme]').forEach(button => {
      button.append(svg(button.dataset.theme === 'light' ? 'sun' : 'moon'));
      button.addEventListener('click', () => {
        document.documentElement.dataset.theme = button.dataset.theme;
        document.querySelectorAll('button[data-theme]').forEach(b => b.setAttribute('aria-pressed', b.dataset.theme === button.dataset.theme));
        try { localStorage.setItem('v11-theme', button.dataset.theme); } catch (e) {}
      });
    });
    const current = document.documentElement.dataset.theme || 'light';
    document.querySelectorAll('button[data-theme]').forEach(b => b.setAttribute('aria-pressed', b.dataset.theme === current));
  }

  async function boot() {
    const response = await fetch(DATA_URL);
    data.content = await response.json();
    data.mark = document.querySelector('.brand').innerHTML;
    buildBrand();
    buildNav();
    theme();
    render(routeFromLocation());
    window.addEventListener('popstate', () => render(routeFromLocation()));
    window.addEventListener('hashchange', () => render(routeFromLocation()));
  }

  boot().catch(error => {
    document.getElementById('main').append(text('p', `Unable to load the page: ${error.message}`, 'route-error'));
  });
})();
