const coachList = document.getElementById('coachList');
const coachProfile = document.getElementById('coachProfile');
const coachSearch = document.getElementById('coachSearch');
const coachSearchStatus = document.getElementById('coachSearchStatus');

if (coachList && coachProfile && coachSearch && coachSearchStatus) {
  const playstyles = ['Quick Counter', 'Possession Game', 'Long Ball Counter', 'Out Wide', 'Long Ball', 'Overload'];
  let coaches = [];
  let versions = [];
  let players = [];
  let selectedCoachId = null;

  const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  const displayValue = value => value === null || value === undefined || value === '' ? '—' : escapeHtml(value);
  const coachIdFor = name => normalize(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const initialsFor = name => String(name || '').trim().split(/\s+/).map(part => part[0]).join('').slice(0, 3).toUpperCase();

  const renderVersion = version => {
    const coach = coaches.find(item => item.id === selectedCoachId);
    if (!coach) return;
    const affinities = playstyles.map(style => {
      const value = version.affinity && version.affinity[style];
      const valid = Number.isFinite(value) && value >= 0 && value <= 99;
      const tone = valid ? (value >= 85 ? 'high' : value >= 70 ? 'medium' : 'low') : 'unknown';
      return `<div class="affinity-row">
        <div class="affinity-label"><span>${escapeHtml(style)}</span><strong>${valid ? value : '—'}</strong></div>
        <div class="affinity-track" aria-label="${escapeHtml(style)} affinity: ${valid ? value : 'not filled yet'}">
          <span class="affinity-fill affinity-${tone}" style="width:${valid ? `${value}%` : '0%'}"></span>
        </div>
        ${valid ? '' : '<small>Not filled yet</small>'}
      </div>`;
    }).join('');
    const boost = version.boost && typeof version.boost === 'object'
      ? [version.boost.name, version.boost.effect, version.boost.value].filter(Boolean).map(escapeHtml).join(' · ')
      : (Array.isArray(version.boostSource) && version.boostSource.length ? 'Source details not mapped' : '—');
    const coachPlaystyle = normalize(version.playstyle);
    const matchingPlayers = coachPlaystyle
      ? players.filter(player => normalize(player.playstyle) === coachPlaystyle)
      : [];
    const fitValue = version.playstyle && version.affinity
      ? version.affinity[version.playstyle]
      : null;
    const fitAvailable = Number.isFinite(fitValue) && fitValue >= 0 && fitValue <= 99;
    const bestFit = matchingPlayers.length && fitAvailable
      ? `<ul>${matchingPlayers.map(player => `<li>${escapeHtml(player.playerName)} <span>${escapeHtml(player.cardName || 'Card version unavailable')} · Fit ${fitValue}%</span></li>`).join('')}</ul>`
      : `<p>${version.playstyle
        ? `No player card has the same sourced playstyle as ${escapeHtml(version.playstyle)}.`
        : 'Best-fit players cannot be calculated until this coach playstyle is sourced.'}</p>`;
    const portrait = version.imageUrl
      ? `<img src="${escapeHtml(version.imageUrl)}" alt="${escapeHtml(version.cardVersion)} coach portrait" loading="lazy" width="160" height="160" />`
      : `<span class="coach-portrait-fallback" aria-label="Coach portrait unavailable">${escapeHtml(initialsFor(coach.name))}</span>`;

    coachProfile.innerHTML = `
      <div class="profile-topline"><div><p class="eyebrow">VERIFIED COACH CARD</p><h3>${escapeHtml(coach.name)}</h3></div></div>
      <label class="coach-version-label" for="coachVersionSelect">Card version
        <select id="coachVersionSelect">${versions.filter(item => item.coachId === selectedCoachId).map(item =>
          `<option value="${escapeHtml(item.versionId)}"${item.versionId === version.versionId ? ' selected' : ''}>${escapeHtml(item.versionName || 'Version unavailable')}</option>`).join('')}
        </select>
      </label>
      <div class="coach-profile-top">
        <div class="coach-portrait">${portrait}</div>
        <section class="coach-boost-box${version.boost ? ' has-boost' : ''}">
          <h4>Boost</h4><p>${boost}</p>
        </section>
      </div>
      <div class="profile-facts">
        <article class="profile-fact"><span>PLAYSTYLE</span><p>${displayValue(version.playstyle)}</p></article>
        <article class="profile-fact"><span>FORMATION</span><p>${displayValue(version.formation)}</p></article>
        <article class="profile-fact"><span>COST</span><p>${displayValue(version.cost)}</p></article>
        <article class="profile-fact"><span>PACK</span><p>${displayValue(version.packName)}</p></article>
      </div>
      <section class="coach-affinities"><h4>Playstyle affinity</h4>${affinities}</section>
      <section class="coach-best-fit"><h4>Best Fit Players</h4>${bestFit}</section>
      ${version.sourceUrl ? `<p class="coach-source-link">Source: <a href="${escapeHtml(version.sourceUrl)}" rel="noopener noreferrer">verified coach card record</a></p>` : ''}`;
    try {
      localStorage.setItem('touchline:selectedCoachVersion', version.versionId);
    } catch (error) {
      console.error('Unable to save the coach-card version:', error);
    }
    const sharedCoachSelect = document.getElementById('instructionCoach');
    const sharedVersionValue = `version:${version.versionId}`;
    if (sharedCoachSelect && Array.from(sharedCoachSelect.options).some(option => option.value === sharedVersionValue)) {
      const changed = sharedCoachSelect.value !== sharedVersionValue;
      sharedCoachSelect.value = sharedVersionValue;
      if (changed) sharedCoachSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    coachProfile.hidden = false;
    coachProfile.setAttribute('aria-busy', 'false');
    coachProfile.querySelectorAll('.coach-portrait img').forEach(image => {
      image.addEventListener('error', () => {
        image.replaceWith(Object.assign(document.createElement('span'), {
          className: 'coach-portrait-fallback',
          textContent: initialsFor(coach.name)
        }));
      }, { once: true });
    });
    coachProfile.querySelector('#coachVersionSelect').addEventListener('change', event => {
      const selectedVersion = versions.find(item => item.versionId === event.target.value);
      if (!selectedVersion) return;
      try {
        localStorage.setItem('touchline:selectedCoachVersion', selectedVersion.versionId);
      } catch (error) {
        console.error('Unable to save the coach-card version:', error);
      }
      renderVersion(selectedVersion);
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
        <p class="database-empty">No sourced card versions are available.</p>`;
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

  Promise.all([
    fetch('data/coaches.json').then(response => {
      if (!response.ok) throw new Error(`Coach database request failed (${response.status}).`);
      return response.json();
    }),
    fetch('data/players.json').then(response => {
      if (!response.ok) throw new Error(`Player database request failed (${response.status}).`);
      return response.json();
    })
  ])
    .then(([coachData, playerData]) => {
      if (!coachData || !Array.isArray(coachData.coaches) || !playerData || !Array.isArray(playerData.players)) {
        throw new Error('Coach or player database is missing a required collection.');
      }
      players = playerData.players;
      const coachGroups = new Map();
      coachData.coaches.forEach(record => {
        if (!record.coachName || !record.id || !record.source) {
          throw new Error('A sourced coach version is missing its identity or source.');
        }
        const id = coachIdFor(record.coachName);
        if (!coachGroups.has(id)) coachGroups.set(id, { id, name: record.coachName });
        versions.push({ ...record, coachId: id, versionId: String(record.id) });
      });
      coaches = [...coachGroups.values()].sort((first, second) => first.name.localeCompare(second.name));
      versions.sort((first, second) => first.coachId.localeCompare(second.coachId) ||
        String(second.versionName || '').localeCompare(String(first.versionName || ''), undefined, { numeric: true }));
      const savedCoachId = (() => {
        try {
          return localStorage.getItem('touchline:selectedCoach');
        } catch (error) {
          console.error('Unable to read the saved coach selection:', error);
          return null;
        }
      })();
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
        const query = normalize(coachSearch.value);
        const matches = coaches.filter(coach => normalize(coach.name).includes(query));
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
      const restoredCoach = coaches.find(coach => coach.id === savedCoachId);
      if (restoredCoach) renderCoach(restoredCoach);
    })
    .catch(error => {
      console.error('Unable to load coach names:', error);
      coachList.innerHTML = '<p class="lab-error">Coach names could not be loaded from the shared database.</p>';
      coachProfile.hidden = false;
      coachProfile.innerHTML = '<p class="lab-error">Coach data could not be loaded. Check data/coaches.json.</p>';
    });
}
