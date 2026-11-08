const siteNav = document.querySelector('.site-nav');

if (siteNav) {
  const navFrame = siteNav.closest('.nav-frame');
  const navLinks = [...siteNav.querySelectorAll('a[data-nav-id]')];
  const leftArrow = navFrame.querySelector('[data-scroll-direction="-1"]');
  const rightArrow = navFrame.querySelector('[data-scroll-direction="1"]');
  const dropdowns = [...siteNav.querySelectorAll('.nav-dropdown')];
  let pointerStart = null;
  let dragged = false;
  let closeMenuTimer = null;

  const updateScrollCues = () => {
    const maxScroll = siteNav.scrollWidth - siteNav.clientWidth;
    navFrame.classList.toggle('has-overflow-left', siteNav.scrollLeft > 2);
    navFrame.classList.toggle('has-overflow-right', siteNav.scrollLeft < maxScroll - 2);
    leftArrow.disabled = siteNav.scrollLeft <= 2;
    rightArrow.disabled = siteNav.scrollLeft >= maxScroll - 2;
    leftArrow.hidden = maxScroll <= 2;
    rightArrow.hidden = maxScroll <= 2;
  };

  const centerTab = tab => {
    if (tab) tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const closeDropdowns = () => {
    dropdowns.forEach(dropdown => {
      dropdown.classList.remove('is-open');
      dropdown.querySelector('.nav-dropdown-toggle').setAttribute('aria-expanded', 'false');
      dropdown.menu.hidden = true;
      dropdown.menu.classList.remove('is-visible');
    });
  };

  const positionMenu = dropdown => {
    const menu = dropdown.menu;
    const trigger = dropdown.querySelector('.nav-dropdown-toggle');
    const rect = trigger.getBoundingClientRect();
    menu.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - menu.offsetWidth - 8))}px`;
    menu.style.top = `${Math.min(rect.bottom, window.innerHeight - menu.offsetHeight - 8)}px`;
  };

  const openDropdown = dropdown => {
    window.clearTimeout(closeMenuTimer);
    dropdowns.forEach(item => {
      if (item !== dropdown) {
        item.classList.remove('is-open');
        item.querySelector('.nav-dropdown-toggle').setAttribute('aria-expanded', 'false');
        item.menu.hidden = true;
        item.menu.classList.remove('is-visible');
      }
    });
    dropdown.classList.add('is-open');
    dropdown.querySelector('.nav-dropdown-toggle').setAttribute('aria-expanded', 'true');
    dropdown.menu.hidden = false;
    dropdown.menu.classList.add('is-visible');
    positionMenu(dropdown);
  };

  const scheduleClose = dropdown => {
    window.clearTimeout(closeMenuTimer);
    closeMenuTimer = window.setTimeout(() => {
      if (!dropdown.matches(':hover') && !dropdown.menu.matches(':hover') &&
        !dropdown.contains(document.activeElement) && !dropdown.menu.contains(document.activeElement)) {
        closeDropdowns();
      }
    }, 120);
  };

  dropdowns.forEach((dropdown, index) => {
    const menu = dropdown.querySelector('.nav-submenu');
    const toggle = dropdown.querySelector('.nav-dropdown-toggle');
    menu.id = `site-nav-menu-${index + 1}`;
    menu.hidden = true;
    toggle.setAttribute('aria-controls', menu.id);
    dropdown.menu = menu;
    document.body.append(menu);

    dropdown.addEventListener('mouseenter', () => {
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) openDropdown(dropdown);
    });
    dropdown.addEventListener('mouseleave', () => scheduleClose(dropdown));
    dropdown.addEventListener('focusin', () => openDropdown(dropdown));
    dropdown.addEventListener('focusout', () => scheduleClose(dropdown));
    menu.addEventListener('mouseenter', () => window.clearTimeout(closeMenuTimer));
    menu.addEventListener('mouseleave', () => scheduleClose(dropdown));
    menu.addEventListener('focusin', () => openDropdown(dropdown));
    menu.addEventListener('focusout', () => scheduleClose(dropdown));
    menu.addEventListener('click', event => {
      if (event.target.closest('a')) closeDropdowns();
    });
    toggle.addEventListener('click', () => {
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        openDropdown(dropdown);
        return;
      }
      if (dropdown.classList.contains('is-open')) closeDropdowns();
      else openDropdown(dropdown);
    });
  });

  document.addEventListener('pointerdown', event => {
    if (!dropdowns.some(dropdown => dropdown.contains(event.target) || dropdown.menu.contains(event.target))) {
      closeDropdowns();
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeDropdowns();
  });
  window.addEventListener('resize', () => {
    dropdowns.forEach(dropdown => {
      if (dropdown.classList.contains('is-open')) positionMenu(dropdown);
    });
  });
  window.addEventListener('scroll', () => {
    dropdowns.forEach(dropdown => {
      if (dropdown.classList.contains('is-open')) positionMenu(dropdown);
    });
  }, true);

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

  const groupedPageTab = window.location.pathname.endsWith('/coach-squad-guides.html')
    ? 'coach-lab'
    : window.location.pathname.endsWith('/player-tracker.html')
      ? 'more-intel'
      : 'home';
  const initialTab = navLinks.find(isCurrentTab) ||
    navLinks.find(link => link.dataset.navId === groupedPageTab);

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
