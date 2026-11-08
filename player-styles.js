const latestPlayerGrid = document.getElementById('latestPlayerGrid');
const playerStyleGuide = document.getElementById('playerStyleGuide');
const coachSelect = document.getElementById('instructionCoach');
const formationSelect = document.getElementById('formationSelect');
const instructionContent = document.getElementById('instructionContent');
const slotEditor = document.getElementById('slotEditor');
const copySetupButton = document.getElementById('copySetupButton');
const copyStatus = document.getElementById('copyStatus');
const playerCardResults = document.getElementById('playerCardResults');
const playerResultCount = document.getElementById('playerResultCount');
const playerSeeMoreButton = document.getElementById('playerSeeMoreButton');
const playerDataRequest = fetch('data/players.json').then(response => {
  if (!response.ok) throw new Error(`Player-card database request failed (${response.status}).`);
  return response.json();
});

const cardTypeFor = card => {
  if (card.cardType) return card.cardType;
  const name = String(card.cardName || '');
  if (/\bstandard\b|\bbase\b/i.test(name)) return 'Standard';
  if (/\bshow\s*time\b/i.test(name)) return 'Show Time';
  if (/\bpotw\b|\bpotd\b/i.test(name)) return 'POTW';
  if (/\bepic\b|\bbig\s*time\b/i.test(name)) return 'Epic';
  return 'Other';
};

const groupPlayerCards = cardList => {
  const groups = new Map();
  cardList.forEach(card => {
    const key = String(card.playerName || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(card);
  });
  return groups;
};

const preferredPlayerCard = cardGroup => {
  const standardCards = cardGroup.filter(card => cardTypeFor(card) === 'Standard');
  if (standardCards.length) {
    return [...standardCards].sort((first, second) =>
      (Number.isFinite(second.overallRating) ? second.overallRating : -1) -
      (Number.isFinite(first.overallRating) ? first.overallRating : -1))[0];
  }
  return null;
};

if (latestPlayerGrid) {
  playerDataRequest
    .then(playerData => {
      if (!playerData || !Array.isArray(playerData.players)) {
        throw new Error('Player-card database is missing its player collection.');
      }
      const recentCards = [...groupPlayerCards(playerData.players).values()]
        .map(cardGroup => preferredPlayerCard(cardGroup))
        .filter(Boolean)
        .sort((first, second) => String(second.releaseDate || '').localeCompare(String(first.releaseDate || '')))
        .slice(0, 8);
      if (!recentCards.length) {
        latestPlayerGrid.innerHTML = '<p class="database-empty">No sourced player cards are available yet.</p>';
        return;
      }
      latestPlayerGrid.replaceChildren(...recentCards.map(card => {
        const link = document.createElement('a');
        link.className = 'latest-player-card';
        link.href = `player.html?name=${encodeURIComponent(card.playerName)}`;
        link.setAttribute('aria-label', `View ${card.playerName}, ${card.cardName}`);
        const imageSource = card.cardImageUrl || card.faceUrl || card.imageUrl;
        if (imageSource) {
          const image = document.createElement('img');
          image.src = imageSource;
          image.alt = `${card.playerName} portrait`;
          image.loading = 'lazy';
          image.width = 74;
          image.height = 100;
          image.addEventListener('error', () => {
            const fallback = document.createElement('span');
            fallback.className = 'card-art-fallback';
            fallback.textContent = String(card.playerName).trim().split(/\s+/).map(part => part[0]).join('').slice(0, 3).toUpperCase();
            image.replaceWith(fallback);
          }, { once: true });
          link.append(image);
        } else {
          const fallback = document.createElement('span');
          fallback.className = 'card-art-fallback';
          fallback.textContent = String(card.playerName).trim().split(/\s+/).map(part => part[0]).join('').slice(0, 3).toUpperCase();
          link.append(fallback);
        }
        const copy = document.createElement('span');
        copy.className = 'latest-player-card-copy';
        const name = document.createElement('strong');
        name.textContent = card.playerName;
        const version = document.createElement('span');
        version.textContent = card.cardName;
        const rating = document.createElement('span');
        rating.textContent = `Rating ${Number.isFinite(card.overallRating) ? card.overallRating : '—'}`;
        const form = document.createElement('span');
        form.className = `form-grade${card.form ? ` form-grade-${card.form}` : ''}`;
        form.textContent = `Form ${card.form || '—'}`;
        copy.append(name, version, rating, form);
        link.append(copy);
        return link;
      }));
    })
    .catch(error => {
      console.error('Unable to load sourced player cards:', error);
      latestPlayerGrid.innerHTML = '<p class="lab-error">The sourced player cards could not be loaded.</p>';
    });
}

if (playerStyleGuide && coachSelect && formationSelect &&
  instructionContent && slotEditor && copySetupButton && copyStatus &&
  playerCardResults && playerResultCount && playerSeeMoreButton) {
  const allowedAttacking = new Set(['None', 'Defensive', 'Anchoring']);
  const allowedDefensive = new Set(['None', 'Counter Target', 'Man Marking']);
  const instructionByStyle = {
    'goal-poacher': ['None', 'Counter Target'],
    'target-man': ['Anchoring', 'None'],
    'deep-lying-forward': ['None', 'None'],
    'offensive-full-back': ['None', 'None'],
    'defensive-full-back': ['Defensive', 'None'],
    'anchor-man': ['Defensive', 'None'],
    'destroyer-midfielder': ['Defensive', 'Man Marking'],
    'destroyer-defender': ['Defensive', 'None'],
    orchestrator: ['None', 'None'],
    'hole-player': ['None', 'None'],
    'classic-no-10': ['None', 'None'],
    'prolific-winger': ['None', 'None'],
    'build-up': ['None', 'None'],
    'cross-specialist': ['None', 'None'],
    'roaming-flank': ['None', 'Counter Target']
  };
  const formationRows = {
    '4-2-1-3': [['GK', 50, 92], ['LB', 12, 72], ['LCB', 38, 74], ['RCB', 62, 74], ['RB', 88, 72], ['LDMF', 38, 56], ['RDMF', 62, 56], ['AMF', 50, 38], ['LW', 15, 22], ['CF', 50, 18], ['RW', 85, 22]],
    '4-1-2-3': [['GK', 50, 92], ['LB', 12, 72], ['LCB', 38, 74], ['RCB', 62, 74], ['RB', 88, 72], ['DMF', 50, 56], ['LCMF', 38, 38], ['RCMF', 62, 38], ['LW', 15, 22], ['CF', 50, 18], ['RW', 85, 22]],
    '4-3-3': [['GK', 50, 92], ['LB', 12, 72], ['LCB', 38, 74], ['RCB', 62, 74], ['RB', 88, 72], ['LCMF', 30, 55], ['CMF', 50, 52], ['RCMF', 70, 55], ['LW', 15, 22], ['CF', 50, 18], ['RW', 85, 22]],
    '4-2-3-1': [['GK', 50, 92], ['LB', 12, 72], ['LCB', 38, 74], ['RCB', 62, 74], ['RB', 88, 72], ['LDMF', 38, 56], ['RDMF', 62, 56], ['LMF', 20, 38], ['AMF', 50, 36], ['RMF', 80, 38], ['CF', 50, 18]],
    '4-4-2': [['GK', 50, 92], ['LB', 12, 72], ['LCB', 38, 74], ['RCB', 62, 74], ['RB', 88, 72], ['LMF', 15, 38], ['LCMF', 38, 40], ['RCMF', 62, 40], ['RMF', 85, 38], ['LCF', 35, 18], ['RCF', 65, 18]],
    '4-1-4-1': [['GK', 50, 92], ['LB', 12, 72], ['LCB', 38, 74], ['RCB', 62, 74], ['RB', 88, 72], ['DMF', 50, 56], ['LMF', 15, 38], ['LCMF', 38, 40], ['RCMF', 62, 40], ['RMF', 85, 38], ['CF', 50, 18]],
    '3-2-3-2': [['GK', 50, 92], ['LCB', 25, 74], ['CB', 50, 76], ['RCB', 75, 74], ['LDMF', 38, 56], ['RDMF', 62, 56], ['LMF', 15, 38], ['CMF', 50, 36], ['RMF', 85, 38], ['LCF', 35, 20], ['RCF', 65, 20]],
    '3-4-3': [['GK', 50, 92], ['LCB', 25, 74], ['CB', 50, 76], ['RCB', 75, 74], ['LMF', 15, 55], ['LCMF', 38, 52], ['RCMF', 62, 52], ['RMF', 85, 55], ['LW', 15, 22], ['CF', 50, 18], ['RW', 85, 22]],
    '3-5-2': [['GK', 50, 92], ['LCB', 25, 74], ['CB', 50, 76], ['RCB', 75, 74], ['LWB', 12, 55], ['LCMF', 30, 40], ['CMF', 50, 38], ['RCMF', 70, 40], ['RWB', 88, 55], ['LCF', 35, 18], ['RCF', 65, 18]],
    '5-3-2': [['GK', 50, 92], ['LWB', 12, 55], ['LCB', 28, 74], ['CB', 50, 76], ['RCB', 72, 74], ['RWB', 88, 55], ['LCMF', 30, 38], ['CMF', 50, 36], ['RCMF', 70, 38], ['LCF', 35, 18], ['RCF', 65, 18]],
    '4-3-1-2': [['GK', 50, 92], ['LB', 12, 72], ['LCB', 38, 74], ['RCB', 62, 74], ['RB', 88, 72], ['LCMF', 30, 55], ['CMF', 50, 52], ['RCMF', 70, 55], ['AMF', 50, 36], ['LCF', 35, 18], ['RCF', 65, 18]],
    '3-4-1-2': [['GK', 50, 92], ['LCB', 25, 74], ['CB', 50, 76], ['RCB', 75, 74], ['LMF', 15, 55], ['LCMF', 38, 52], ['RCMF', 62, 52], ['RMF', 85, 55], ['AMF', 50, 36], ['LCF', 35, 18], ['RCF', 65, 18]],
    '4-2-2-2': [['GK', 50, 92], ['LB', 12, 72], ['LCB', 38, 74], ['RCB', 62, 74], ['RB', 88, 72], ['LDMF', 38, 56], ['RDMF', 62, 56], ['LAMF', 30, 36], ['RAMF', 70, 36], ['LCF', 35, 18], ['RCF', 65, 18]],
    '3-2-2-3': [['GK', 50, 92], ['LCB', 25, 74], ['CB', 50, 76], ['RCB', 75, 74], ['LDMF', 38, 56], ['RDMF', 62, 56], ['LAMF', 30, 36], ['RAMF', 70, 36], ['LW', 15, 20], ['CF', 50, 16], ['RW', 85, 20]]
  };
  const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
  const normalizeSearch = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const initialsFor = name => String(name).trim().split(/\s+/).map(part => part[0]).join('').slice(0, 3).toUpperCase();
  const teamColorFor = card => /^#[\da-f]{6}$/i.test(card.teamColor || '') ? card.teamColor : '#39474a';
  const formationNames = Object.keys(formationRows);
  let styleById = new Map();
  let coaches = [];
  let coachVersions = [];
  let setups = [];
  let cards = [];
  let playerCardGroups = new Map();
  let standardPlayerGroups = new Map();
  let showAllStandardPlayers = false;
  let teamInfoById = new Map();
  let managerInfoById = new Map();
  let activeSetup = null;
  let activeCoach = null;
  let activeCoachVersion = null;
  let activeFormation = null;
  let draggedSlotIndex = null;

  const styleInstructions = (styleId, position) => {
    if (styleId === 'destroyer-midfielder' && normalizePosition(position) !== 'DMF') return ['Defensive', 'None'];
    return instructionByStyle[styleId] || ['None', 'None'];
  };

  const makeFormationSlots = formation => {
    return formationRows[formation].map(([position, x, y]) => ({ position, x, y, styleId: null }));
  };

  const cardForSlot = slot => cards.find(card => card.cardId === slot.cardId);

  const normalizePosition = position => {
    if (/^(L|R)?CB$/.test(position)) return 'CB';
    if (/^(L|R)DMF$/.test(position)) return 'DMF';
    if (/^(L|R)CMF$/.test(position)) return 'CMF';
    if (/^(L|R)AMF$/.test(position)) return 'AMF';
    if (/^(L|R)CF$/.test(position)) return 'CF';
    if (position === 'LWB') return 'LB';
    if (position === 'RWB') return 'RB';
    if (position === 'LMF') return 'LMF';
    if (position === 'RMF') return 'RMF';
    return position;
  };

  const recommendationFor = (position, usedRows) => {
    const normalized = normalizePosition(position);
    const candidates = activeSetup.rows.filter((row, index) => {
      const label = row.position.toUpperCase();
      const repeatedRow = label.match(/\bX\s*(\d+)$/);
      const capacity = label === 'OTHER ATTACKERS' || label === 'LB / RB' || label === 'LW / RW'
        ? Number.POSITIVE_INFINITY
        : repeatedRow ? Number(repeatedRow[1]) : 1;
      if ((usedRows.get(index) || 0) >= capacity) return false;
      if (label === normalized) return true;
      if (label.startsWith(`${normalized} `)) return true;
      if ((position === 'LB' || position === 'RB') && label === 'LB / RB') return true;
      if ((position === 'LW' || position === 'RW') && label === 'LW / RW') return true;
      if ((normalized === 'LW' || normalized === 'RW' || normalized === 'CF') && label === 'OTHER ATTACKERS') return true;
      if (normalized === 'CB' && label.startsWith('CB')) return true;
      if (normalized === 'CF' && label.startsWith('CF ')) return true;
      return false;
    });
    if (!candidates.length) return null;
    const row = candidates[0];
    const rowIndex = activeSetup.rows.indexOf(row);
    usedRows.set(rowIndex, (usedRows.get(rowIndex) || 0) + 1);
    return row;
  };

  const assignRecommendedStyles = () => {
    const usedRows = new Map();
    activeSetup.rows.forEach((row, index) => {
      if (/^GK\b/i.test(row.position)) usedRows.set(index, Number.POSITIVE_INFINITY);
    });
    activeSetup.slots = makeFormationSlots(activeFormation).map(slot => {
      if (slot.position === 'GK') return slot;
      const recommendation = recommendationFor(slot.position, usedRows);
      return { ...slot, styleId: recommendation ? recommendation.styleId : null };
    });
  };

  const renderPitch = () => `
    <div class="formation-pitch" aria-label="${escapeHtml(activeFormation)} tactical pitch, opponent goal at top and own goal at bottom">
      <div class="formation-pitch-lines" aria-hidden="true"></div>
      ${activeSetup.slots.map((slot, index) => {
        const style = styleById.get(slot.styleId);
        const card = cardForSlot(slot);
        return `<button type="button" class="formation-dot${slot.position === 'GK' ? ' goalkeeper-dot' : ''}"
          style="left:${slot.x}%;top:${slot.y}%"
          data-slot-index="${index}" draggable="true"
          aria-label="${escapeHtml(slot.position)}${style ? `, ${escapeHtml(style.name)}` : ''}">
          ${card ? `<span class="formation-player-name">${escapeHtml(card.playerName)}</span>` : ''}
          <span class="formation-dot-core" style="background:${card ? teamColorFor(card) : ''}">
            ${card && card.faceUrl
              ? `<img class="formation-face" src="${escapeHtml(card.faceUrl)}" alt="" loading="lazy" width="48" height="48" /><span class="formation-face-fallback" hidden>${escapeHtml(initialsFor(card.playerName))}</span>`
              : card ? `<span class="formation-face-fallback">${escapeHtml(initialsFor(card.playerName))}</span>` : ''}
          </span>
          <strong>${escapeHtml(slot.position)}</strong>
        </button>`;
      }).join('')}
    </div>`;

  const renderPlayerList = () => {
    const rows = activeSetup.slots
      .filter(slot => slot.position !== 'GK')
      .map(slot => {
        const style = styleById.get(slot.styleId);
        const card = cardForSlot(slot);
        const instructions = styleInstructions(slot.styleId, slot.position);
        return `<tr>
          <th scope="row">${escapeHtml(slot.position)}</th>
          <td>${card ? `${escapeHtml(card.playerName)} · ` : ''}${style ? escapeHtml(style.name) : 'Not assigned in this setup'}</td>
          <td>${escapeHtml(instructions[0])}</td>
          <td>${escapeHtml(instructions[1])}</td>
        </tr>`;
      }).join('');
    return `<div class="instruction-table-wrap"><table class="instruction-table">
      <thead><tr><th>Position</th><th>Player Style</th><th>Attacking Instruction</th><th>Defensive Instruction</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  };

  const renderSetup = () => {
    if (!activeSetup || !activeCoach) return;
    instructionContent.setAttribute('aria-busy', 'false');
    instructionContent.innerHTML = `
      <div class="instruction-profile-heading">
        <div><p class="eyebrow">${escapeHtml(activeSetup.playstyle)}${activeCoachVersion ? ` · ${escapeHtml(activeCoachVersion.cardVersion)}` : ''}</p><h4>${escapeHtml(activeCoach.name)}</h4></div>
        <span class="formation-chip">${escapeHtml(activeFormation)}</span>
      </div>
      <div class="formation-layout">
        <div>
          ${renderPitch()}
          <p class="goalkeeper-notice">No instructions available for GK.</p>
        </div>
        <section class="player-list-panel" aria-labelledby="playerListTitle">
          <h4 id="playerListTitle">Player list</h4>
          ${renderPlayerList()}
        </section>
      </div>`;
    instructionContent.querySelectorAll('.formation-face').forEach(image => {
      image.addEventListener('error', () => {
        image.hidden = true;
        image.nextElementSibling.hidden = false;
      }, { once: true });
    });
    copySetupButton.disabled = false;
    copyStatus.textContent = `${activeCoach.name} · ${activeFormation}`;
  };

  const renderSlotEditor = index => {
    const slot = activeSetup.slots[index];
    if (!slot || slot.position === 'GK') {
      slotEditor.hidden = true;
      return;
    }
    const styleOptions = [...styleById.values()].filter(style => style.group !== 'Goalkeepers');
    slotEditor.hidden = false;
    slotEditor.innerHTML = `
      <div class="slot-editor-heading"><strong>${escapeHtml(slot.position)} slot</strong>
        <button type="button" class="slot-editor-close" aria-label="Close slot editor">×</button></div>
      <label for="slotStyleSelect">Player style
        <select id="slotStyleSelect">
          <option value="">No style selected</option>
          ${styleOptions.map(style => `<option value="${escapeHtml(style.id)}"${slot.styleId === style.id ? ' selected' : ''}>${escapeHtml(style.name)}</option>`).join('')}
        </select>
      </label>
      <label for="slotPlayerSearch">Search for a player card
        <input id="slotPlayerSearch" type="search" placeholder="Search verified cards" autocomplete="off" />
      </label>
      <div class="slot-player-results" aria-live="polite"></div>`;
    slotEditor.querySelector('.slot-editor-close').addEventListener('click', () => {
      slotEditor.hidden = true;
    });
    slotEditor.querySelector('#slotStyleSelect').addEventListener('change', event => {
      slot.styleId = event.target.value || null;
      slot.cardId = null;
      renderSetup();
      renderSlotEditor(index);
    });
    slotEditor.querySelector('#slotPlayerSearch').addEventListener('input', event => {
      const query = event.target.value.trim();
      const matchingCards = cards.filter(card =>
        `${card.playerName} ${card.cardName}`.toLowerCase().includes(query.toLowerCase()));
      const results = slotEditor.querySelector('.slot-player-results');
      results.innerHTML = matchingCards.length
        ? matchingCards.map(card => `<button type="button" class="slot-player-option" data-slot-card-id="${escapeHtml(card.cardId)}">${escapeHtml(card.playerName)} · ${escapeHtml(card.cardName)} · ${escapeHtml(card.overallRating)}</button>`).join('')
        : '<p class="database-empty">Not in database yet — coming soon.</p>';
    });
    const slotCardResults = slotEditor.querySelector('.slot-player-results');
    slotCardResults.innerHTML = '<p class="database-empty">Search sourced cards to assign one to this slot.</p>';
    slotCardResults.addEventListener('click', event => {
      const cardButton = event.target.closest('[data-slot-card-id]');
      if (!cardButton) return;
      const card = cards.find(item => item.cardId === cardButton.dataset.slotCardId);
      if (!card) return;
      slot.cardId = card.cardId;
      slot.styleId = card.playerStyleId;
      renderSetup();
      renderSlotEditor(index);
    });
  };

  const renderStyleGuide = styles => {
    const groups = [...new Set(styles.map(style => style.group))];
    playerStyleGuide.innerHTML = groups.map(group => {
      const groupStyles = styles.filter(style => style.group === group);
      return `<section class="style-group">
        <h3>${escapeHtml(group)}</h3>
        <div class="style-card-list">${groupStyles.map(style => {
          const instructions = styleInstructions(style.id, 'DMF');
          const conditional = style.id === 'destroyer-midfielder'
            ? '<small>Man Marking applies when assigned at DMF; otherwise None.</small>'
            : '';
          const cardsForStyle = cards.filter(card => card.playerStyleId === style.id);
          return `<article class="style-card">
            <span class="player-style-badge tone-${escapeHtml(style.tone)}">${escapeHtml(style.name)}</span>
            <p>${escapeHtml(style.description)}</p>
            ${style.bestFor ? `<p class="style-best-for">Often used with ${escapeHtml(style.bestFor)}.</p>` : ''}
            ${style.group === 'Goalkeepers'
              ? '<p class="style-instructions">No instructions available for GK.</p>'
              : `<p class="style-instructions">Attacking: ${escapeHtml(instructions[0])} · Defensive: ${escapeHtml(instructions[1])}</p>${conditional}`}
            ${cardsForStyle.length ? `<div class="style-card-players"><strong>Sourced cards</strong>${cardsForStyle.map(card =>
              `<button type="button" class="style-player-link" data-player-query="${escapeHtml(card.playerName)}">${escapeHtml(card.playerName)} · ${escapeHtml(card.cardName)}</button>`).join('')}</div>` : ''}
          </article>`;
        }).join('')}</div>
      </section>`;
    }).join('');
  };

  const renderCardResults = () => {
    const query = normalizeSearch(document.getElementById('playerSearch').value.trim());
    const position = document.getElementById('positionFilter').value;
    const styleId = document.getElementById('playerStyleFilter').value;
    const minimumRating = Number(document.getElementById('ratingFilter').value || 0);
    const form = document.getElementById('formFilter').value;
    const pack = document.getElementById('packFilter').value.trim().toLowerCase();
    const coach = document.getElementById('cardCoachFilter').value.trim().toLowerCase();
    const hasFilters = Boolean(query || position || styleId || minimumRating || form || pack || coach);
    const filtered = [...standardPlayerGroups.values()].map(preferredPlayerCard).filter(Boolean).filter(card => {
      const style = styleById.get(card.playerStyleId);
      const teamContext = card.teamContext || {};
      const club = teamInfoById.get(String(teamContext.clubTeamId));
      const nationalTeam = teamInfoById.get(String(teamContext.nationalTeamId));
      const managersForCard = [club, nationalTeam]
        .map(team => team && managerInfoById.get(String(team.managerId)))
        .filter(Boolean);
      return (!query || normalizeSearch(card.playerName).includes(query)) &&
      (!position || card.positions.includes(position)) &&
      (!styleId || card.playerStyleId === styleId) &&
      (!minimumRating || (Number.isFinite(card.overallRating) && card.overallRating >= minimumRating)) &&
      (!form || (card.formRating || card.form) === form) &&
      (!pack || String(card.packName || '').toLowerCase().includes(pack)) &&
      (!coach || [card.coachName, ...managersForCard.map(manager => manager.name)]
        .some(name => normalizeSearch(name || '').includes(normalizeSearch(coach))));
    });
    const defaultOrder = ['kylian mbappe', 'erling haaland', 'lamine yamal', 'jude bellingham', 'pedri'];
    filtered.sort((first, second) => {
      const firstOrder = defaultOrder.indexOf(normalizeSearch(first.playerName));
      const secondOrder = defaultOrder.indexOf(normalizeSearch(second.playerName));
      if (firstOrder !== secondOrder) return (firstOrder < 0 ? Infinity : firstOrder) - (secondOrder < 0 ? Infinity : secondOrder);
      return first.playerName.localeCompare(second.playerName);
    });
    if (!filtered.length) {
      playerCardResults.innerHTML = '<p class="database-empty">Not in database yet — coming soon. Verified card-specific stats, skills, and images will appear here when available.</p>';
      playerResultCount.textContent = '0 players found';
      playerSeeMoreButton.hidden = true;
      return;
    }
    const visiblePlayers = !hasFilters && !showAllStandardPlayers ? filtered.slice(0, 5) : filtered;
    playerResultCount.textContent = `${visiblePlayers.length} player${visiblePlayers.length === 1 ? '' : 's'} found`;
    playerSeeMoreButton.hidden = hasFilters || filtered.length <= 5;
    playerSeeMoreButton.textContent = showAllStandardPlayers ? 'Show less' : 'See more players →';
    playerCardResults.innerHTML = `
      ${visiblePlayers.map(card => `
        <a class="database-card" href="player.html?name=${encodeURIComponent(card.playerName)}"
          aria-label="View all cards for ${escapeHtml(card.playerName)}">
          <span class="card-art-frame">
            ${(card.cardImageUrl || card.faceUrl || card.imageUrl) ? `<img src="${escapeHtml(card.cardImageUrl || card.faceUrl || card.imageUrl)}" alt="${escapeHtml(card.playerName)} portrait" loading="lazy" width="104" height="144" />` : ''}
            ${(card.cardImageUrl || card.faceUrl || card.imageUrl)
              ? `<span class="card-art-fallback" style="background:${teamColorFor(card)}" hidden>${escapeHtml(initialsFor(card.playerName))}</span>`
              : '<span class="card-art-missing">Player photo not available</span>'}
          </span>
          <span class="database-card-copy"><strong>${escapeHtml(card.playerName)}</strong>
            <span class="player-card-type-badge">Standard</span>
            <span>Rating ${Number.isFinite(card.overallRating) ? escapeHtml(card.overallRating) : '—'}</span>
            <span>Main Position ${escapeHtml(card.mainPosition || card.positions[0] || '—')}</span>
            <span>Style ${escapeHtml(styleById.get(card.playerStyleId)?.name || '—')}</span>
            <span>Form ${escapeHtml(card.formRating || card.form || '—')}</span>
          </span>
        </a>`).join('')}`;
    playerCardResults.querySelectorAll('.card-art-frame img').forEach(image => {
      image.addEventListener('error', () => {
        image.hidden = true;
        image.nextElementSibling.hidden = false;
      }, { once: true });
    });
  };

  const saveSelection = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Unable to save ${key}:`, error);
      copyStatus.textContent = 'Could not save your selection in this browser.';
    }
  };

  instructionContent.addEventListener('click', event => {
    const dot = event.target.closest('[data-slot-index]');
    if (dot) renderSlotEditor(Number(dot.dataset.slotIndex));
  });
  instructionContent.addEventListener('dragstart', event => {
    const dot = event.target.closest('[data-slot-index]');
    if (!dot) return;
    draggedSlotIndex = Number(dot.dataset.slotIndex);
    event.dataTransfer.setData('text/plain', String(draggedSlotIndex));
    event.dataTransfer.effectAllowed = 'move';
  });
  instructionContent.addEventListener('dragover', event => {
    if (event.target.closest('.formation-pitch')) event.preventDefault();
  });
  instructionContent.addEventListener('drop', event => {
    const pitch = event.target.closest('.formation-pitch');
    if (!pitch || draggedSlotIndex === null) return;
    event.preventDefault();
    const bounds = pitch.getBoundingClientRect();
    const slot = activeSetup.slots[draggedSlotIndex];
    slot.x = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100));
    slot.y = Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100));
    draggedSlotIndex = null;
    renderSetup();
  });
  playerStyleGuide.addEventListener('click', event => {
    const playerLink = event.target.closest('[data-player-query]');
    if (!playerLink) return;
    const search = document.getElementById('playerSearch');
    search.value = playerLink.dataset.playerQuery;
    renderCardResults();
    document.querySelector('.player-database').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  playerSeeMoreButton.addEventListener('click', () => {
    showAllStandardPlayers = !showAllStandardPlayers;
    renderCardResults();
  });

  const selectCoach = selectedValue => {
    activeCoachVersion = selectedValue.startsWith('version:')
      ? coachVersions.find(version => version.versionId === selectedValue.slice('version:'.length))
      : null;
    const coachId = activeCoachVersion ? activeCoachVersion.coachId : selectedValue;
    activeCoach = coaches.find(coach => coach.id === coachId);
    activeSetup = setups.find(setup => setup.coachId === coachId);
    if (activeCoach) saveSelection('touchline:selectedCoach', activeCoach.id);
    if (activeCoachVersion) saveSelection('touchline:selectedCoachVersion', activeCoachVersion.versionId);
    if (!activeCoach || !activeSetup) {
      instructionContent.innerHTML = '<p class="database-empty">Not in database yet — coming soon. No verified instruction setup is available for this coach.</p>';
      copySetupButton.disabled = true;
      return;
    }
    activeFormation = formationNames.includes(activeSetup.formation) ? activeSetup.formation : formationNames[0];
    formationSelect.value = activeFormation;
    assignRecommendedStyles();
    slotEditor.hidden = true;
    renderSetup();
  };

  coachSelect.addEventListener('change', () => selectCoach(coachSelect.value));

  formationSelect.addEventListener('change', () => {
    activeFormation = formationSelect.value;
    assignRecommendedStyles();
    slotEditor.hidden = true;
    renderSetup();
  });

  copySetupButton.addEventListener('click', async () => {
    if (!activeSetup || !activeCoach) return;
    const lines = activeSetup.slots.filter(slot => slot.position !== 'GK').map(slot => {
      const style = styleById.get(slot.styleId);
      const instructions = styleInstructions(slot.styleId, slot.position);
      return [slot.position, style ? style.name : 'Not assigned', instructions[0], instructions[1]].join(' | ');
    });
    try {
      await navigator.clipboard.writeText([
        `${activeCoach.name} · ${activeFormation}`,
        'Position | Player Style | Attacking Instruction | Defensive Instruction',
        ...lines
      ].join('\n'));
      copyStatus.textContent = 'Setup copied to clipboard.';
    } catch (error) {
      console.error('Unable to copy the setup:', error);
      copyStatus.textContent = 'Clipboard access was denied. Select and copy the player list.';
    }
  });

  const cardFilters = ['playerSearch', 'positionFilter', 'playerStyleFilter', 'ratingFilter', 'formFilter', 'packFilter', 'cardCoachFilter'];
  cardFilters.forEach(id => {
    document.getElementById(id).addEventListener('input', renderCardResults);
    document.getElementById(id).addEventListener('change', renderCardResults);
  });

  Promise.all([
    fetch('data.json').then(response => {
      if (!response.ok) throw new Error(`Shared guide database request failed (${response.status}).`);
      return response.json();
    }),
    playerDataRequest,
    fetch('data/coaches.json').then(response => {
      if (!response.ok) throw new Error(`Coach-card database request failed (${response.status}).`);
      return response.json();
    })
  ])
    .then(([data, playerData, coachData]) => {
      if (!Array.isArray(data.coaches) || !Array.isArray(data.playerInstructions) ||
        !Array.isArray(data.playerStyles) || !playerData || !Array.isArray(playerData.players) ||
        !Array.isArray(data.coachVersions) || !Array.isArray(data.packs) ||
        !Array.isArray(playerData.teams) || !Array.isArray(playerData.managers) ||
        !coachData || !Array.isArray(coachData.coaches)) {
        throw new Error('Shared database is missing a required collection.');
      }
      styleById = new Map(data.playerStyles.map(style => [style.id, style]));
      const coachGroups = new Map();
      coachVersions = coachData.coaches.map(version => {
        const coachId = normalizeSearch(version.coachName).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (!version.id || !version.coachName || !version.versionName || !coachId) {
          throw new Error('A sourced coach version is missing its identity.');
        }
        if (!coachGroups.has(coachId)) coachGroups.set(coachId, { id: coachId, name: version.coachName });
        return { ...version, versionId: String(version.id), cardVersion: version.versionName, coachId };
      });
      coaches = [...coachGroups.values()].sort((first, second) => first.name.localeCompare(second.name));
      setups = data.playerInstructions;
      cards = playerData.players;
      playerCardGroups = groupPlayerCards(cards);
      standardPlayerGroups = groupPlayerCards(cards.filter(card => cardTypeFor(card) === 'Standard'));
      teamInfoById = new Map(playerData.teams.map(team => [String(team.teamId), team]));
      managerInfoById = new Map(playerData.managers.map(manager => [String(manager.managerId), manager]));
      if (setups.some(setup => setup.rows.some(row =>
        /^GK\b/i.test(row.position) || !allowedAttacking.has(row.attacking) || !allowedDefensive.has(row.defensive)))) {
        throw new Error('Coach instructions contain a goalkeeper row or an unsupported instruction.');
      }
      if (cards.some(card => !card.cardId || !card.playerName ||
        !Array.isArray(card.positions) || (card.playerStyleId && !styleById.has(card.playerStyleId)) ||
        (card.overallRating !== null && !Number.isFinite(card.overallRating)) ||
        (card.form !== null && !['A', 'B', 'C', 'D', 'E'].includes(card.form)) ||
        !Array.isArray(card.skills) || !card.stats || typeof card.stats !== 'object' ||
        !card.source || !card.sourceUrl)) {
        throw new Error('A player-card record is missing card-specific fields.');
      }

      renderStyleGuide(data.playerStyles);

      const availableStyles = data.playerStyles.filter(style => style.group !== 'Goalkeepers');
      document.getElementById('playerStyleFilter').insertAdjacentHTML('beforeend', availableStyles.map(style =>
        `<option value="${escapeHtml(style.id)}">${escapeHtml(style.name)}</option>`).join(''));
      const coachOptions = coaches.flatMap(coach => {
        const versionsForCoach = coachVersions.filter(version => version.coachId === coach.id);
        if (versionsForCoach.length) {
          return versionsForCoach.map(version => ({
            value: `version:${version.versionId}`,
            label: `${coach.name} — ${version.cardVersion}`
          }));
        }
        return [{ value: coach.id, label: coach.name }];
      });
      coachSelect.replaceChildren(...coachOptions.map(item => {
        const option = document.createElement('option');
        option.value = item.value;
        option.textContent = item.label;
        return option;
      }));
      formationSelect.replaceChildren(...formationNames.map(formation => {
        const option = document.createElement('option');
        option.value = formation;
        option.textContent = formation;
        return option;
      }));

      const selectedCoachId = (() => {
        try {
          return localStorage.getItem('touchline:selectedCoach');
        } catch (error) {
          console.error('Unable to read the saved coach selection:', error);
          return null;
        }
      })();
      let selectedVersionId = null;
      try {
        selectedVersionId = localStorage.getItem('touchline:selectedCoachVersion');
      } catch (error) {
        console.error('Unable to read the saved coach-card version:', error);
      }
      const savedVersion = coachVersions.find(version =>
        version.versionId === selectedVersionId && version.coachId === selectedCoachId) ||
        coachVersions.find(version => version.coachId === selectedCoachId);
      activeCoach = coaches.find(coach => coach.id === selectedCoachId) || coaches[0];
      activeSetup = setups.find(setup => setup.coachId === activeCoach.id);
      activeCoachVersion = savedVersion || coachVersions.find(version => version.coachId === activeCoach.id);
      coachSelect.value = activeCoachVersion ? `version:${activeCoachVersion.versionId}` : '';
      activeFormation = activeSetup && formationNames.includes(activeSetup.formation)
        ? activeSetup.formation
        : formationNames[0];
      formationSelect.value = activeFormation;
      if (activeSetup) {
        assignRecommendedStyles();
        renderSetup();
      } else {
        instructionContent.innerHTML = '<p class="database-empty">Not in database yet — coming soon. No verified instruction setup is available for this coach.</p>';
      }
      renderCardResults();
      const requestedPlayer = new URLSearchParams(window.location.search).get('player');
      if (requestedPlayer) {
        document.getElementById('playerSearch').value = requestedPlayer;
        showAllStandardPlayers = false;
        renderCardResults();
      }
    })
    .catch(error => {
      console.error('Unable to load the shared player database:', error);
      playerStyleGuide.innerHTML = '<p class="lab-error">The shared database could not be loaded.</p>';
      instructionContent.setAttribute('aria-busy', 'false');
      instructionContent.innerHTML = '<p class="lab-error">The shared database could not be loaded. Check data.json.</p>';
      playerCardResults.innerHTML = '<p class="lab-error">The shared database could not be loaded.</p>';
      playerResultCount.textContent = 'Player database unavailable';
      playerSeeMoreButton.hidden = true;
      copySetupButton.disabled = true;
    });
}
