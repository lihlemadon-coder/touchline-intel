const coachList = document.getElementById('coachList');
const coachProfile = document.getElementById('coachProfile');

if (coachList && coachProfile) {
  const allowedBadgeTones = new Set(['green', 'red', 'blue', 'amber', 'cyan', 'violet']);
  let styleById = new Map();
  let players = [];

  const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);

  const styleBadge = style => {
    if (!style || !allowedBadgeTones.has(style.tone)) {
      throw new Error('A player is missing a valid player style.');
    }
    return `<span class="player-style-badge tone-${style.tone}">${escapeHtml(style.name)}</span>`;
  };

  const renderCoach = coach => {
    const proficiency = Math.max(0, Math.min(100, Number(coach.proficiency.score)));
    const filteredPlayers = coach.playerStyleFilter
      ? players.filter(player => coach.playerStyleFilter.includes(player.styleId))
      : players;
    const filterSummary = coach.playerStyleFilter
      ? `${filteredPlayers.length} players matching ${coach.playerStyleFilter.length} coach-fit styles`
      : 'No coach-specific style filter; showing all catalog players';
    coachProfile.setAttribute('aria-busy', 'false');
    coachProfile.innerHTML = `
      <div class="profile-topline">
        <div>
          <p class="eyebrow">COACH PROFILE</p>
          <h3>${escapeHtml(coach.name)}</h3>
          <p class="profile-subtitle">${escapeHtml(coach.subtitle)}</p>
        </div>
        <div class="proficiency-score"><strong>${proficiency}<span>/100</span></strong><span>${escapeHtml(coach.proficiency.label)}</span></div>
      </div>
      <div class="proficiency-track" role="progressbar" aria-label="${escapeHtml(coach.name)} proficiency with recommended players" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${proficiency}">
        <span style="width: ${proficiency}%"></span>
      </div>
      <p class="proficiency-note">${escapeHtml(coach.proficiency.note)}</p>
      <div class="profile-facts">
        <article class="profile-fact"><span>PLAYSTYLE</span><p>${escapeHtml(coach.playstyle)}</p></article>
        <article class="profile-fact"><span>BEST FORMATION</span><p class="formation-value">${escapeHtml(coach.bestFormation)}</p></article>
        <article class="profile-fact"><span>LINK-UP SKILL</span><p>${escapeHtml(coach.linkUpSkill)}</p></article>
      </div>
      <div class="profile-types">
        <article class="type-card"><h4>PLAYER TYPES TO USE</h4><ul>${coach.playerTypesToUse.map(type => `<li>${escapeHtml(type)}</li>`).join('')}</ul></article>
        <article class="type-card avoid"><h4>PLAYER TYPES TO AVOID</h4><ul>${coach.playerTypesToAvoid.map(type => `<li>${escapeHtml(type)}</li>`).join('')}</ul></article>
      </div>
      <div class="shortlist-heading">
        <div><p class="eyebrow">COACH STYLE FILTER</p><h4>Style-fit player shortlist</h4></div>
        <span>${escapeHtml(filterSummary)}</span>
      </div>
      <div class="player-card-grid coach-shortlist">${filteredPlayers.map(player => {
        const style = styleById.get(player.styleId);
        return `
          <article class="player-card">
            <span class="lineup-position">${escapeHtml(player.position)}</span>
            <h5>${escapeHtml(player.name)}</h5>
            ${styleBadge(style)}
          </article>`;
      }).join('')}</div>
      <div class="lineup-heading"><div><p class="eyebrow">SUGGESTED STARTING XI</p><h4>Best-fit player roles</h4></div><span>11 PLAYERS</span></div>
      <ol class="lineup-list">${coach.startingEleven.map(player => `
        <li class="lineup-player">
          <span class="lineup-position">${escapeHtml(player.position)}</span>
          <div class="lineup-details">
            <div class="lineup-player-heading"><strong>${escapeHtml(player.player)}</strong>${styleBadge(styleById.get(player.styleId))}</div>
            <p>${escapeHtml(player.why)}</p>
          </div>
        </li>`).join('')}
      </ol>`;
  };

  const showError = message => {
    coachList.innerHTML = `<p class="lab-error">${escapeHtml(message)}</p>`;
    coachProfile.setAttribute('aria-busy', 'false');
    coachProfile.innerHTML = `<p class="lab-error">${escapeHtml(message)}</p>`;
  };

  const validateCoach = coach => {
    const requiredText = ['id', 'name', 'subtitle', 'playstyle', 'bestFormation', 'linkUpSkill'];
    if (!coach || requiredText.some(field => typeof coach[field] !== 'string' || !coach[field].trim())) {
      throw new Error('Coach profile is missing required text fields.');
    }
    if (!coach.proficiency || !Number.isFinite(coach.proficiency.score) || coach.proficiency.score < 0 || coach.proficiency.score > 100) {
      throw new Error(`${coach.name} has an invalid proficiency score.`);
    }
    if (!Array.isArray(coach.startingEleven) || coach.startingEleven.length !== 11 ||
      coach.startingEleven.some(player => !player.position || !player.player || !player.why || !styleById.has(player.styleId))) {
      throw new Error(`${coach.name} must have 11 complete starting XI entries.`);
    }
    if (!Array.isArray(coach.playerTypesToUse) || !Array.isArray(coach.playerTypesToAvoid)) {
      throw new Error(`${coach.name} is missing player type guidance.`);
    }
    if (coach.playerStyleFilter !== null && (!Array.isArray(coach.playerStyleFilter) ||
      coach.playerStyleFilter.some(styleId => !styleById.has(styleId)))) {
      throw new Error(`${coach.name} has an invalid player style filter.`);
    }
  };

  fetch('data.json')
    .then(response => {
      if (!response.ok) throw new Error(`Coach data request failed (${response.status}).`);
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data.coaches) || data.coaches.length === 0) {
        throw new Error('Coach data is empty or has an invalid format.');
      }
      if (!Array.isArray(data.playerStyles) || !Array.isArray(data.players)) {
        throw new Error('Player style catalog is missing or invalid.');
      }
      styleById = new Map(data.playerStyles.map(style => [style.id, style]));
      players = data.players;
      players.forEach(player => {
        if (!player.id || !player.name || !player.position || !styleById.has(player.styleId)) {
          throw new Error(`Player ${player.name || player.id || 'entry'} is missing a valid style.`);
        }
      });
      data.coaches.forEach(validateCoach);

      coachList.replaceChildren();
      let selectedCoachId = null;
      try {
        selectedCoachId = localStorage.getItem('touchline:selectedCoach');
      } catch (error) {
        console.error('Unable to read the saved coach selection:', error);
      }
      const activeCoach = data.coaches.find(coach => coach.id === selectedCoachId) || data.coaches[0];
      data.coaches.forEach(coach => {
        const button = document.createElement('button');
        button.className = 'coach-option';
        button.type = 'button';
        button.textContent = coach.name;
        button.setAttribute('aria-pressed', String(coach.id === activeCoach.id));
        button.addEventListener('click', () => {
          coachList.querySelectorAll('.coach-option').forEach(option => {
            option.setAttribute('aria-pressed', String(option === button));
          });
          try {
            localStorage.setItem('touchline:selectedCoach', coach.id);
          } catch (error) {
            console.error('Unable to save the coach selection:', error);
          }
          renderCoach(coach);
        });
        coachList.append(button);
      });

      renderCoach(activeCoach);
    })
    .catch(error => {
      console.error('Unable to load Coach Lab profiles:', error);
      showError('Coach profiles could not be loaded. Open the site through a local web server and check data.json.');
    });
}
