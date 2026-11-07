const latestPlayerGrid = document.getElementById('latestPlayerGrid');
const playerStyleGuide = document.getElementById('playerStyleGuide');
const coachSelect = document.getElementById('instructionCoach');
const formationSelect = document.getElementById('formationSelect');
const instructionContent = document.getElementById('instructionContent');
const slotEditor = document.getElementById('slotEditor');
const copySetupButton = document.getElementById('copySetupButton');
const copyStatus = document.getElementById('copyStatus');
const playerCardResults = document.getElementById('playerCardResults');
const playerCardDetail = document.getElementById('playerCardDetail');

if (latestPlayerGrid && playerStyleGuide && coachSelect && formationSelect &&
  instructionContent && slotEditor && copySetupButton && copyStatus && playerCardResults && playerCardDetail) {
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
    '4-2-1-3': [['LB', 'LCB', 'RCB', 'RB'], ['DMF', 'DMF'], ['AMF'], ['LW', 'CF', 'RW']],
    '4-1-2-3': [['LB', 'LCB', 'RCB', 'RB'], ['DMF'], ['CMF', 'CMF'], ['LW', 'CF', 'RW']],
    '4-3-3': [['LB', 'LCB', 'RCB', 'RB'], ['CMF', 'CMF', 'CMF'], ['LW', 'CF', 'RW']],
    '4-2-3-1': [['LB', 'LCB', 'RCB', 'RB'], ['DMF', 'DMF'], ['LMF', 'AMF', 'RMF'], ['CF']],
    '4-4-2': [['LB', 'LCB', 'RCB', 'RB'], ['LMF', 'CMF', 'CMF', 'RMF'], ['CF', 'CF']],
    '4-1-4-1': [['LB', 'LCB', 'RCB', 'RB'], ['DMF'], ['LMF', 'CMF', 'CMF', 'RMF'], ['CF']],
    '3-2-3-2': [['LCB', 'CB', 'RCB'], ['DMF', 'DMF'], ['LW', 'AMF', 'RW'], ['SS', 'CF']],
    '3-4-3': [['LCB', 'CB', 'RCB'], ['LMF', 'CMF', 'CMF', 'RMF'], ['LW', 'CF', 'RW']],
    '3-5-2': [['LCB', 'CB', 'RCB'], ['LMF', 'CMF', 'CMF', 'CMF', 'RMF'], ['CF', 'CF']],
    '5-3-2': [['LB', 'LCB', 'CB', 'RCB', 'RB'], ['CMF', 'CMF', 'CMF'], ['CF', 'CF']],
    '4-3-1-2': [['LB', 'LCB', 'RCB', 'RB'], ['CMF', 'CMF', 'CMF'], ['AMF'], ['CF', 'CF']],
    '3-4-1-2': [['LCB', 'CB', 'RCB'], ['LMF', 'CMF', 'CMF', 'RMF'], ['AMF'], ['CF', 'CF']],
    '4-2-2-2': [['LB', 'LCB', 'RCB', 'RB'], ['DMF', 'DMF'], ['AMF', 'AMF'], ['CF', 'CF']],
    '3-2-2-3': [['LCB', 'CB', 'RCB'], ['DMF', 'DMF'], ['AMF', 'AMF'], ['LW', 'CF', 'RW']]
  };
  const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
  const initialsFor = name => String(name).trim().split(/\s+/).map(part => part[0]).join('').slice(0, 3).toUpperCase();
  const teamColorFor = card => /^#[\da-f]{6}$/i.test(card.teamColor || '') ? card.teamColor : '#39474a';
  const formationNames = Object.keys(formationRows);
  let styleById = new Map();
  let coaches = [];
  let coachVersions = [];
  let setups = [];
  let cards = [];
  let activeSetup = null;
  let activeCoach = null;
  let activeCoachVersion = null;
  let activeFormation = null;
  let draggedSlotIndex = null;

  const styleInstructions = (styleId, position) => {
    if (styleId === 'destroyer-midfielder' && position !== 'DMF') return ['Defensive', 'None'];
    return instructionByStyle[styleId] || ['None', 'None'];
  };

  const makeFormationSlots = formation => {
    const groups = formationRows[formation];
    const slots = [{ position: 'GK', x: 50, y: 92, styleId: null }];
    groups.forEach((positions, groupIndex) => {
      const y = [77, 62, 47, 29][groupIndex];
      positions.forEach((position, index) => {
        const x = formation === '3-2-3-2' && groupIndex === 3
          ? (position === 'CF' ? 50 : 78)
          : positions.length === 1 ? 50 : 16 + (68 * index) / (positions.length - 1);
        slots.push({ position, x, y, styleId: null });
      });
    });
    return slots;
  };

  const cardForSlot = slot => cards.find(card => card.cardId === slot.cardId);

  const normalizePosition = position => {
    if (/^(LCB|RCB|CB)/.test(position)) return 'CB';
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
      if ((position === 'LW' || position === 'RW' || position === 'CF') && label === 'OTHER ATTACKERS') return true;
      if (normalized === 'CB' && label.startsWith('CB')) return true;
      if (position === 'CF' && label.startsWith('CF ')) return true;
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
    <div class="formation-pitch" aria-label="${escapeHtml(activeFormation)} tactical pitch">
      <div class="formation-pitch-lines" aria-hidden="true"></div>
      ${activeSetup.slots.map((slot, index) => {
        const style = styleById.get(slot.styleId);
        const card = cardForSlot(slot);
        return `<button type="button" class="formation-dot${slot.position === 'GK' ? ' goalkeeper-dot' : ''}"
          style="left:${slot.x}%;top:${slot.y}%"
          data-slot-index="${index}" draggable="true"
          aria-label="${escapeHtml(slot.position)}${style ? `, ${escapeHtml(style.name)}` : ''}">
          ${card && card.faceUrl
            ? `<img class="formation-face" src="${escapeHtml(card.faceUrl)}" alt="" loading="lazy" width="32" height="32" /><span class="formation-face-fallback" style="background:${teamColorFor(card)}" hidden>${escapeHtml(initialsFor(card.playerName))}</span>`
            : ''}
          <strong>${escapeHtml(slot.position)}</strong>
          ${card ? `<span>${escapeHtml(card.playerName)}</span>` : style ? `<span>${escapeHtml(style.name)}</span>` : ''}
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
    const query = document.getElementById('playerSearch').value.trim().toLowerCase();
    const position = document.getElementById('positionFilter').value;
    const styleId = document.getElementById('playerStyleFilter').value;
    const minimumRating = Number(document.getElementById('ratingFilter').value || 0);
    const form = document.getElementById('formFilter').value;
    const pack = document.getElementById('packFilter').value.trim().toLowerCase();
    const coach = document.getElementById('cardCoachFilter').value.trim().toLowerCase();
    const filtered = cards.filter(card =>
      (!query || `${card.playerName} ${card.cardName}`.toLowerCase().includes(query)) &&
      (!position || card.positions.includes(position)) &&
      (!styleId || card.playerStyleId === styleId) &&
      (!minimumRating || card.overallRating >= minimumRating) &&
      (!form || card.form === form) &&
      (!pack || String(card.packName || '').toLowerCase().includes(pack)) &&
      (!coach || String(card.coachName || '').toLowerCase().includes(coach)));
    if (!filtered.length) {
      playerCardResults.innerHTML = '<p class="database-empty">Not in database yet — coming soon. Verified card-specific stats, skills, and images will appear here when available.</p>';
      playerCardDetail.hidden = true;
      return;
    }
    playerCardResults.innerHTML = `<p class="card-result-count">${filtered.length} card${filtered.length === 1 ? '' : 's'} found</p>
      ${filtered.map(card => `
        <button type="button" class="database-card" data-card-id="${escapeHtml(card.cardId)}">
          <span class="card-art-frame">
            ${card.cardImageUrl ? `<img src="${escapeHtml(card.cardImageUrl)}" alt="${escapeHtml(card.playerName)} — ${escapeHtml(card.cardName)} card art" loading="lazy" width="104" height="144" />` : ''}
            ${card.cardImageUrl
              ? `<span class="card-art-fallback" style="background:${teamColorFor(card)}" hidden>${escapeHtml(initialsFor(card.playerName))}</span>`
              : '<span class="card-art-missing">Card art not in database yet</span>'}
          </span>
          <span class="database-card-copy"><strong>${escapeHtml(card.playerName)}</strong><span>${escapeHtml(card.cardName)}</span>
            <span>Rating ${escapeHtml(card.overallRating)} · ${escapeHtml(card.positions.join(', '))} · Form ${escapeHtml(card.form)}</span></span>
        </button>`).join('')}`;
    playerCardResults.querySelectorAll('.card-art-frame img').forEach(image => {
      image.addEventListener('error', () => {
        image.hidden = true;
        image.nextElementSibling.hidden = false;
      }, { once: true });
    });
  };

  const renderCardDetail = card => {
    const style = styleById.get(card.playerStyleId);
    const position = card.positions.find(item => item === 'DMF') || card.positions[0];
    const instructions = styleInstructions(card.playerStyleId, position);
    const stats = card.stats && typeof card.stats === 'object'
      ? Object.entries(card.stats).map(([name, value]) => `
        <div class="card-stat"><div><span>${escapeHtml(name)}</span><strong>${escapeHtml(value)}</strong></div>
          <span class="card-stat-track"><span style="width:${Math.max(0, Math.min(100, Number(value) || 0))}%"></span></span></div>`).join('')
      : '<p class="database-empty">Not in database yet — coming soon. No sourced stats are available for this card.</p>';
    const skills = Array.isArray(card.skills) && card.skills.length
      ? `<ul class="card-skills">${card.skills.map(skill => `<li>${escapeHtml(skill)}</li>`).join('')}</ul>`
      : '<p class="database-empty">Not in database yet — coming soon. No card-specific skills are available.</p>';
    playerCardDetail.innerHTML = `
      <div class="player-card-detail-heading">
        <div class="card-art-frame card-art-large">
          ${card.cardImageUrl ? `<img src="${escapeHtml(card.cardImageUrl)}" alt="${escapeHtml(card.playerName)} — ${escapeHtml(card.cardName)} card art" loading="lazy" width="180" height="250" />` : ''}
          ${card.cardImageUrl
            ? `<span class="card-art-fallback" style="background:${teamColorFor(card)}" hidden>${escapeHtml(initialsFor(card.playerName))}</span>`
            : '<span class="card-art-missing">Card art not in database yet</span>'}
        </div>
        <div><p class="eyebrow">${escapeHtml(card.cardName)}</p><h3>${escapeHtml(card.playerName)}</h3>
          <p>Rating ${escapeHtml(card.overallRating)} · ${escapeHtml(card.positions.join(', '))}</p>
          <p class="form-grade form-grade-${escapeHtml(card.form)}">Form ${escapeHtml(card.form)}</p>
          <p>${style ? escapeHtml(style.name) : 'Player style not recorded'}</p>
          <p>Best instructions — Attacking: ${escapeHtml(instructions[0])} · Defensive: ${escapeHtml(instructions[1])}</p>
        </div>
      </div>
      <div class="card-detail-columns"><section><h4>Full stats</h4>${stats}</section><section><h4>Player skills for this card</h4>${skills}</section></div>`;
    playerCardDetail.hidden = false;
    const image = playerCardDetail.querySelector('img');
    if (image) image.addEventListener('error', () => {
      image.hidden = true;
      image.nextElementSibling.hidden = false;
    }, { once: true });
    playerCardDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
    if (event.target.closest('[data-slot-index]')) event.preventDefault();
  });
  instructionContent.addEventListener('drop', event => {
    const target = event.target.closest('[data-slot-index]');
    if (!target || draggedSlotIndex === null) return;
    event.preventDefault();
    const targetIndex = Number(target.dataset.slotIndex);
    const dragged = activeSetup.slots[draggedSlotIndex];
    const destination = activeSetup.slots[targetIndex];
    if (dragged.position === 'GK' || destination.position === 'GK') {
      draggedSlotIndex = null;
      return;
    }
    [dragged.position, destination.position] = [destination.position, dragged.position];
    [dragged.styleId, destination.styleId] = [destination.styleId, dragged.styleId];
    [dragged.cardId, destination.cardId] = [destination.cardId, dragged.cardId];
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
  playerCardResults.addEventListener('click', event => {
    const cardButton = event.target.closest('[data-card-id]');
    if (!cardButton) return;
    const card = cards.find(item => item.cardId === cardButton.dataset.cardId);
    if (card) renderCardDetail(card);
  });

  const selectCoach = selectedValue => {
    activeCoachVersion = selectedValue.startsWith('version:')
      ? coachVersions.find(version => version.versionId === selectedValue.slice('version:'.length))
      : null;
    const coachId = activeCoachVersion ? activeCoachVersion.coachId : selectedValue;
    activeCoach = coaches.find(coach => coach.id === coachId);
    activeSetup = setups.find(setup => setup.coachId === coachId);
    if (!activeCoach || !activeSetup) {
      instructionContent.innerHTML = '<p class="database-empty">Not in database yet — coming soon. No verified instruction setup is available for this coach.</p>';
      copySetupButton.disabled = true;
      return;
    }
    saveSelection('touchline:selectedCoach', activeCoach.id);
    if (activeCoachVersion) {
      saveSelection('touchline:selectedCoachVersion', activeCoachVersion.versionId);
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

  fetch('data.json')
    .then(response => {
      if (!response.ok) throw new Error(`Shared database request failed (${response.status}).`);
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data.coaches) || !Array.isArray(data.playerInstructions) ||
        !Array.isArray(data.playerStyles) || !Array.isArray(data.playerCards) ||
        !Array.isArray(data.coachVersions) || !Array.isArray(data.packs)) {
        throw new Error('Shared database is missing a required collection.');
      }
      styleById = new Map(data.playerStyles.map(style => [style.id, style]));
      coaches = data.coaches;
      coachVersions = data.coachVersions;
      setups = data.playerInstructions;
      cards = data.playerCards;
      if (setups.some(setup => setup.rows.some(row =>
        /^GK\b/i.test(row.position) || !allowedAttacking.has(row.attacking) || !allowedDefensive.has(row.defensive)))) {
        throw new Error('Coach instructions contain a goalkeeper row or an unsupported instruction.');
      }
      if (cards.some(card => !card.cardId || !card.playerName || !card.cardName ||
        !Array.isArray(card.positions) || !styleById.has(card.playerStyleId) ||
        !Number.isFinite(card.overallRating) || !['A', 'B', 'C', 'D', 'E'].includes(card.form) ||
        !Array.isArray(card.skills) || !card.stats || typeof card.stats !== 'object')) {
        throw new Error('A player-card record is missing card-specific fields.');
      }

      latestPlayerGrid.innerHTML = '<p class="database-empty">Not in database yet — coming soon. No verified latest-player cards are available.</p>';
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
      const savedVersion = coachVersions.find(version => version.versionId === selectedVersionId);
      const selectedCoachValue = savedVersion && savedVersion.coachId === selectedCoachId
        ? `version:${savedVersion.versionId}`
        : selectedCoachId;
      activeCoach = coaches.find(coach => coach.id === selectedCoachId) || coaches[0];
      activeSetup = setups.find(setup => setup.coachId === activeCoach.id);
      coachSelect.value = coachOptions.some(item => item.value === selectedCoachValue)
        ? selectedCoachValue
        : activeCoach.id;
      activeCoachVersion = coachSelect.value.startsWith('version:')
        ? coachVersions.find(version => version.versionId === coachSelect.value.slice('version:'.length))
        : null;
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
    })
    .catch(error => {
      console.error('Unable to load the shared player database:', error);
      latestPlayerGrid.innerHTML = '<p class="lab-error">The shared database could not be loaded.</p>';
      playerStyleGuide.innerHTML = '<p class="lab-error">The shared database could not be loaded.</p>';
      instructionContent.setAttribute('aria-busy', 'false');
      instructionContent.innerHTML = '<p class="lab-error">The shared database could not be loaded. Check data.json.</p>';
      playerCardResults.innerHTML = '<p class="lab-error">The shared database could not be loaded.</p>';
      copySetupButton.disabled = true;
    });
}
