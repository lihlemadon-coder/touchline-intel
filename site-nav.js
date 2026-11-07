const siteNav = document.querySelector('.site-nav');

if (siteNav) {
  const navFrame = siteNav.closest('.nav-frame');
  const navLinks = [...siteNav.querySelectorAll('a[data-nav-id]')];
  const leftArrow = navFrame.querySelector('[data-scroll-direction="-1"]');
  const rightArrow = navFrame.querySelector('[data-scroll-direction="1"]');
  let pointerStart = null;
  let dragged = false;

  const updateScrollCues = () => {
    const maxScroll = siteNav.scrollWidth - siteNav.clientWidth;
    navFrame.classList.toggle('has-overflow-left', siteNav.scrollLeft > 2);
    navFrame.classList.toggle('has-overflow-right', siteNav.scrollLeft < maxScroll - 2);
    leftArrow.disabled = siteNav.scrollLeft <= 2;
    rightArrow.disabled = siteNav.scrollLeft >= maxScroll - 2;
  };

  const centerTab = tab => {
    if (tab) tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const updateEdgePadding = () => {
    if (!navLinks.length) return;
    const edgeWidth = Math.max(
      navLinks[0].getBoundingClientRect().width,
      navLinks[navLinks.length - 1].getBoundingClientRect().width
    );
    const padding = Math.max(28, (siteNav.clientWidth - edgeWidth) / 2);
    siteNav.style.paddingInline = `${padding}px`;
  };

  const isCurrentTab = link => {
    const target = new URL(link.href, window.location.href);
    const normalizePath = path => path.endsWith('/')
      ? `${path}index.html`
      : path.replace(/\/+$/, '') || '/index.html';
    const currentPath = normalizePath(window.location.pathname);
    const targetPath = normalizePath(target.pathname);
    if (currentPath !== targetPath) return false;
    if (targetPath.endsWith('/index.html') && !window.location.hash) {
      return link.dataset.navId === 'home';
    }
    return target.hash ? target.hash === window.location.hash : !window.location.hash;
  };

  const initialTab = navLinks.find(isCurrentTab) ||
    (window.location.pathname.endsWith('/coach-squad-guides.html')
      ? navLinks.find(link => link.dataset.navId === 'coach-lab')
      : null);

  if (initialTab) {
    initialTab.setAttribute('aria-current', 'page');
    requestAnimationFrame(() => centerTab(initialTab));
  }

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (dragged) return;
      navLinks.forEach(tab => tab.removeAttribute('aria-current'));
      link.setAttribute('aria-current', 'page');
      centerTab(link);
    });
  });

  navFrame.querySelectorAll('[data-scroll-direction]').forEach(button => {
    button.addEventListener('click', () => {
      siteNav.scrollBy({
        left: Number(button.dataset.scrollDirection) * 200,
        behavior: 'smooth'
      });
    });
  });

  siteNav.addEventListener('scroll', updateScrollCues, { passive: true });
  window.addEventListener('resize', () => {
    updateEdgePadding();
    updateScrollCues();
  });
  document.fonts.ready.then(() => {
    updateEdgePadding();
    updateScrollCues();
    if (initialTab) centerTab(initialTab);
  });
  siteNav.addEventListener('wheel', event => {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      siteNav.scrollLeft += event.deltaY;
      event.preventDefault();
    }
  }, { passive: false });

  siteNav.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button === 0) {
      pointerStart = { x: event.clientX, scrollLeft: siteNav.scrollLeft };
      dragged = false;
    }
  });

  siteNav.addEventListener('pointermove', event => {
    if (!pointerStart) return;
    const distance = event.clientX - pointerStart.x;
    if (Math.abs(distance) > 5) dragged = true;
    if (dragged) siteNav.scrollLeft = pointerStart.scrollLeft - distance;
  });

  const finishDrag = () => {
    if (!pointerStart) return;
    pointerStart = null;
    if (dragged) {
      window.setTimeout(() => { dragged = false; }, 0);
    }
  };
  siteNav.addEventListener('pointerup', finishDrag);
  siteNav.addEventListener('pointercancel', finishDrag);
  siteNav.addEventListener('click', event => {
    if (dragged) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  updateEdgePadding();
  updateScrollCues();
  requestAnimationFrame(updateScrollCues);
}
