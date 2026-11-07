const coachList = document.getElementById('coachList');
const coachProfile = document.getElementById('coachProfile');
const coachSearch = document.getElementById('coachSearch');
const coachSearchStatus = document.getElementById('coachSearchStatus');

if (coachList && coachProfile && coachSearch && coachSearchStatus) {
  const playstyles = ['Quick Counter', 'Possession', 'Long Ball Counter', 'Out Wide', 'Long Ball', 'Overload'];
  let coaches = [];
  let versions = [];
  let selectedCoachId = null;

  const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);

  const displayValue = (value, suffix = '') =>
    value === null || value === undefined || value === '' ? 'Not in database yet — coming soon' : `${escapeHtml(value)}${suffix}`;

  const renderVersion = version => {
    const affinities = playstyles.map(style => {
      const value = version.affinities && version.affinities[style];
      return `<article class="profile-fact"><span>${escapeHtml(style.toUpperCase())}</span><p>${displayValue(value)}</p></article>`;
    }).join('');
    coachProfile.innerHTML = `
      <div class="profile-topline"><div><p class="eyebrow">VERIFIED COACH CARD</p><h3>${escapeHtml(coaches.find(coach => coach.id === selectedCoachId).name)}</h3></div></div>
      <label class="coach-version-label" for="coachVersionSelect">Card version
        <select id="coachVersionSelect">${versions.filter(item => item.coachId === selectedCoachId).map(item =>
          `<option value="${escapeHtml(item.versionId)}"${item.versionId === version.versionId ? ' selected' : ''}>${escapeHtml(item.cardVersion)}</option>`).join('')}
        </select>
      </label>
      <div class="profile-facts">
        <article class="profile-fact"><span>PLAYSTYLE</span><p>${displayValue(version.playstyle)}</p></article>
        <article class="profile-fact"><span>FORMATION</span><p>${displayValue(version.formation)}</p></article>
        <article class="profile-fact"><span>BOOST</span><p>${displayValue(version.boost)}</p></article>
        <article class="profile-fact"><span>COST</span><p>${displayValue(version.costCoins, ' coins')}</p></article>
        <article class="profile-fact"><span>PACK</span><p>${displayValue(version.packName)}</p></article>
        ${affinities}
      </div>
      <div class="coach-version-images">
        <section><h4>Coach portrait</h4>${version.imageUrl
          ? `<img src="${escapeHtml(version.imageUrl)}" alt="${escapeHtml(version.cardVersion)} coach portrait" loading="lazy" width="240" height="300" />`
          : '<p class="database-empty">Not in database yet — coming soon. No sourced portrait is available.</p>'}</section>
        <section><h4>Pack banner</h4>${version.packImageUrl
          ? `<img src="${escapeHtml(version.packImageUrl)}" alt="${escapeHtml(version.packName || version.cardVersion)} pack banner" loading="lazy" width="480" height="180" />`
          : '<p class="database-empty">Not in database yet — coming soon. No sourced pack banner is available.</p>'}</section>
      </div>
      ${version.sourceUrl ? `<p class="coach-source-link">Source: <a href="${escapeHtml(version.sourceUrl)}" rel="noopener noreferrer">verified coach card record</a></p>` : ''}`;
    coachProfile.hidden = false;
    coachProfile.setAttribute('aria-busy', 'false');
    coachProfile.querySelectorAll('.coach-version-images img').forEach(image => {
      image.addEventListener('error', () => {
        image.replaceWith(Object.assign(document.createElement('p'), {
          className: 'database-empty',
          textContent: 'Image unavailable at the verified source.'
        }));
      }, { once: true });
    });
    coachProfile.querySelector('#coachVersionSelect').addEventListener('change', event => {
      const selectedVersion = versions.find(item => item.versionId === event.target.value);
      if (selectedVersion) {
        try {
          localStorage.setItem('touchline:selectedCoachVersion', selectedVersion.versionId);
        } catch (error) {
          console.error('Unable to save the coach-card version:', error);
        }
        renderVersion(selectedVersion);
      }
    });
  };

  const renderCoach = coach => {
    selectedCoachId = coach.id;
    try {
      localStorage.setItem('touchline:selectedCoach', coach.id);
    } catch (error) {
      console.error('Unable to save the coach selection:', error);
    }
    coachList.querySelectorAll('.coach-option').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.coachId === coach.id));
    });
    const availableVersions = versions.filter(version => version.coachId === coach.id);
    if (!availableVersions.length) {
      coachProfile.innerHTML = `<div class="profile-topline"><div><p class="eyebrow">COACH PROFILE</p><h3>${escapeHtml(coach.name)}</h3></div></div>
        <p class="database-empty">Not in database yet — coming soon. No verified card version, affinity, boost, cost, pack, or portrait is available.</p>`;
      coachProfile.hidden = false;
      coachProfile.setAttribute('aria-busy', 'false');
      return;
    }
    let versionId = null;
    try {
      versionId = localStorage.getItem('touchline:selectedCoachVersion');
    } catch (error) {
      console.error('Unable to read the saved coach-card version:', error);
    }
    const version = availableVersions.find(item => item.versionId === versionId) || availableVersions[0];
    renderVersion(version);
  };

  fetch('data.json')
    .then(response => {
      if (!response.ok) throw new Error(`Shared database request failed (${response.status}).`);
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data.coaches) || !Array.isArray(data.coachVersions)) {
        throw new Error('Coach database is missing a required collection.');
      }
      coaches = data.coaches;
      versions = data.coachVersions;
      if (versions.some(version => !version.versionId || !version.coachId || !version.cardVersion ||
        !coaches.some(coach => coach.id === version.coachId))) {
        throw new Error('A coach version is missing its identity or coach.');
      }
      let savedCoachId = null;
      try {
        savedCoachId = localStorage.getItem('touchline:selectedCoach');
      } catch (error) {
        console.error('Unable to read the saved coach selection:', error);
      }
      coachList.replaceChildren(...coaches.map(coach => {
        const button = document.createElement('button');
        button.className = 'coach-option';
        button.type = 'button';
        button.textContent = coach.name;
        button.dataset.coachId = coach.id;
        button.setAttribute('aria-pressed', String(coach.id === savedCoachId));
        button.addEventListener('click', () => renderCoach(coach));
        return button;
      }));
      coachSearch.addEventListener('input', () => {
        const query = coachSearch.value.trim().toLowerCase();
        const matches = coaches.filter(coach => coach.name.toLowerCase().includes(query));
        coachList.querySelectorAll('.coach-option').forEach(button => {
          button.hidden = !matches.some(coach => coach.id === button.dataset.coachId);
        });
        coachSearchStatus.hidden = Boolean(matches.length);
        coachSearchStatus.textContent = matches.length
          ? ''
          : 'Not in database yet — coming soon. No coach card version is available for that name.';
      });
      coachProfile.hidden = true;
      coachProfile.innerHTML = '';
      coachList.dataset.savedCoachId = coaches.some(coach => coach.id === savedCoachId) ? savedCoachId : '';
    })
    .catch(error => {
      console.error('Unable to load coach names:', error);
      coachList.innerHTML = '<p class="lab-error">Coach names could not be loaded from the shared database.</p>';
      coachProfile.hidden = false;
      coachProfile.innerHTML = '<p class="lab-error">Coach data could not be loaded. Check data.json.</p>';
    });
}
