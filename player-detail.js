const playerPageContent = document.getElementById('playerPageContent');
const playerListBack = document.getElementById('playerListBack');
const playerSlug = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const playerSearchKey = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const escapePlayerHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[character]);
const playerInitials = name => String(name).trim().split(/\s+/).map(part => part[0]).join('').slice(0, 3).toUpperCase();
const cardTypeForPlayer = card => {
  if (card.cardType) return card.cardType;
  const name = String(card.cardName || '');
  if (/\bstandard\b|\bbase\b/i.test(name)) return 'Standard';
  if (/\bshow\s*time\b/i.test(name)) return 'Show Time';
  if (/\bpotw\b|\bpotd\b/i.test(name)) return 'POTW';
  if (/\bepic\b|\bbig\s*time\b/i.test(name)) return 'Epic';
  return 'Other';
};
const playerImageMarkup = (card, className, alt, width, height) => {
  const image = card.cardImageUrl || card.faceUrl || card.imageUrl;
  return image
    ? `<span class="${className}"><img src="${escapePlayerHtml(image)}" alt="${escapePlayerHtml(alt)}" loading="lazy" width="${width}" height="${height}" /><span class="card-art-fallback" hidden>${escapePlayerHtml(playerInitials(card.playerName))}</span></span>`
    : `<span class="${className}"><span class="card-art-fallback">${escapePlayerHtml(playerInitials(card.playerName))}</span></span>`;
};
const formatRating = card => Number.isFinite(card.overallRating) ? escapePlayerHtml(card.overallRating) : '—';
const renderImageFallbacks = root => root.querySelectorAll('img').forEach(image => {
  image.addEventListener('error', () => {
    image.hidden = true;
    if (image.nextElementSibling) image.nextElementSibling.hidden = false;
  }, { once: true });
});

const calculateAiTier = card => {
  const stats = card.fullStats && typeof card.fullStats === 'object' ? card.fullStats : card.stats;
  const keys = ['Speed', 'Acceleration', 'Dribbling', 'Finishing', 'Ball Control', 'Balance'];
  if (!stats || keys.some(key => !Number.isFinite(stats[key]))) return null;
  const form = String(card.formRating || card.form || '').toUpperCase();
  if (!['A', 'B', 'C', 'D', 'E'].includes(form)) return null;
  const cardSkills = Array.isArray(card.playerSkills) ? card.playerSkills : card.skills;
  if (!Array.isArray(cardSkills)) return null;
  const base = keys.reduce((total, key) => total + stats[key], 0) / keys.length;
  const formBonus = ({ A: 3, B: 1, C: 0, D: -3, E: -3 })[form];
  const skills = cardSkills
    .map(skill => playerSearchKey(skill).replace(/[^a-z0-9]+/g, ' ').trim());
  const hasSkill = name => skills.includes(name);
  const skillBonus = (hasSkill('double touch') && hasSkill('flip flap') && hasSkill('sole control') ? 2 : 0) +
    (hasSkill('first time shot') || hasSkill('acrobatic finishing') ? 1 : 0);
  const score = base + formBonus + skillBonus;
  const tiers = [
    { min: 95, tier: 'S+', className: 's-plus', label: 'Elite AI - Starts every game' },
    { min: 90, tier: 'S', className: 's', label: 'Top Tier AI - Very reliable' },
    { min: 85, tier: 'A', className: 'a', label: 'Good AI - Solid starter' },
    { min: 80, tier: 'B', className: 'b', label: 'Decent AI - Rotation' },
    { min: 0, tier: 'C', className: 'c', label: 'Backup AI' }
  ];
  return { ...tiers.find(item => score >= item.min), score, base, formBonus, skillBonus };
};
const aiTierMarkup = tier => {
  if (!tier) {
    return {
      badge: '<div class="ai-tier-badge ai-tier-unknown"><strong>—</strong><span>AI tier unavailable</span></div>',
      note: '<p class="ai-control-note">AI Control: — - Not enough verified stats to calculate this card. Best for: Manual / AI.</p>'
    };
  }
  const bonusParts = [
    `Base ${tier.base.toFixed(1)}`,
    tier.formBonus ? `Form ${tier.formBonus > 0 ? '+' : ''}${tier.formBonus}` : '',
    tier.skillBonus ? `Skills +${tier.skillBonus}` : ''
  ].filter(Boolean);
  return {
    badge: `<div class="ai-tier-badge ai-tier-${tier.className}"><strong>${tier.tier}</strong><span>${tier.score.toFixed(1)} · ${tier.label}</span></div>`,
    note: `<p class="ai-control-note">AI Control: ${tier.tier} - ${tier.label}. ${escapePlayerHtml(bonusParts.join(' + '))} = ${tier.score.toFixed(1)}. Best for: Manual / AI.</p>`
  };
};
const renderStats = card => {
  const stats = card.fullStats && typeof card.fullStats === 'object' ? card.fullStats : card.stats;
  if (!stats || typeof stats !== 'object') return '<p class="database-empty">Stats not added yet — stats coming soon.</p>';
  const entries = Object.entries(stats);
  if (!entries.length) return '<p class="database-empty">Stats not added yet — stats coming soon.</p>';
  return entries.map(([name, value]) => Number.isFinite(value)
    ? `<div class="card-stat"><div><span>${escapePlayerHtml(name)}</span><strong>${escapePlayerHtml(value)}</strong></div><span class="card-stat-track"><span style="width:${Math.max(0, Math.min(100, value))}%"></span></span></div>`
    : `<div class="card-stat"><div><span>${escapePlayerHtml(name)}</span><strong>—</strong></div><span class="card-stat-track"><span style="width:0%"></span></span></div>`).join('');
};
const renderSkills = card => {
  const skills = Array.isArray(card.playerSkills) ? card.playerSkills : card.skills;
  return Array.isArray(skills) && skills.length
    ? `<ul class="card-skills">${skills.map(skill => `<li>${escapePlayerHtml(skill)}</li>`).join('')}</ul>`
    : '<p class="database-empty">No verified skills are listed for this card.</p>';
};
const sortPlayerCards = cards => [...cards].sort((first, second) => {
  const standardOrder = Number(cardTypeForPlayer(second) === 'Standard') - Number(cardTypeForPlayer(first) === 'Standard');
  if (standardOrder) return standardOrder;
  const firstRating = Number.isFinite(first.overallRating) ? first.overallRating : -1;
  const secondRating = Number.isFinite(second.overallRating) ? second.overallRating : -1;
  if (firstRating !== secondRating) return secondRating - firstRating;
  return String(first.cardName || '').localeCompare(String(second.cardName || ''));
});

let pageCards = [];
let playerStyles = new Map();
let activeCardId = null;

const renderTeamInfo = (teamId, label, shirtNumber, teamInfoById, managerInfoById) => {
  const team = teamInfoById.get(String(teamId));
  if (!team) return '';
  const manager = managerInfoById.get(String(team.managerId));
  const roster = Array.isArray(team.squad) ? team.squad : [];
  const teamStatus = team.isNationalTeam ? 'National team' : team.isLicensedTeam === false
    ? 'In-game name · unlicensed'
    : team.isLicensedTeam === true ? 'Licensed club' : 'License status unavailable';
  const tacticPositions = Array.isArray(team.tacticPositions) ? team.tacticPositions : [];
  const tacticLayout = tacticPositions.length
    ? `<div class="team-tactic-pitch" role="img" aria-label="Sourced tactical layout for ${escapePlayerHtml(team.name)}; formation name not specified">
        ${tacticPositions.map(position => `<span class="team-tactic-point" title="Source role ${escapePlayerHtml(position.role)}" style="left:${position.width}%;top:${100 - position.depth * 2}%"></span>`).join('')}
      </div><small class="team-tactic-caption">Source tactical layout · formation name not provided</small>`
    : '';
  const portrait = manager && manager.imageUrl
    ? `<span class="manager-portrait"><img src="${escapePlayerHtml(manager.imageUrl)}" alt="${escapePlayerHtml(manager.name)} portrait" loading="lazy" width="56" height="56" /><span class="manager-portrait-fallback" hidden>${escapePlayerHtml(playerInitials(manager.name))}</span></span>`
    : '';
  const members = roster.map(player => {
    const matchingPlayer = pageCards.some(card => playerSearchKey(card.playerName).includes(playerSearchKey(player.playerName || '')));
    const name = matchingPlayer
      ? `<a class="team-squad-player" href="player.html?name=${encodeURIComponent(player.playerName)}">${escapePlayerHtml(player.playerName)}</a>`
      : escapePlayerHtml(player.playerName || '—');
    return `<li><span>${name}${player.isCaptain ? ' · Captain' : ''}</span><span>${player.shirtNumber == null ? '—' : `#${escapePlayerHtml(player.shirtNumber)}`}${player.position ? ` · ${escapePlayerHtml(player.position)}` : ''}</span></li>`;
  }).join('');
  const affinities = manager && manager.affinities
    ? Object.entries(manager.affinities).map(([style, value]) => `<span>${escapePlayerHtml(style)}: ${value == null ? '—' : escapePlayerHtml(value)}</span>`).join('')
    : '';
  return `<section class="team-info-card">
    <h3>${escapePlayerHtml(label)} · ${escapePlayerHtml(team.name || '—')}</h3>
    <p>${escapePlayerHtml((team.competitionNames || []).join(' · ') || team.country || 'Competition not listed')}${shirtNumber == null ? '' : ` · Shirt #${escapePlayerHtml(shirtNumber)}`}</p>
    <span class="team-license-status">${teamStatus}</span>
    <p class="team-formation-status">Formation: ${escapePlayerHtml(team.formation || 'Name not specified by the source')}</p>
    ${tacticLayout}
    ${manager ? `<div class="team-manager-info">${portrait}<div class="team-manager-copy"><strong>Manager: ${escapePlayerHtml(manager.name || '—')}</strong><span>${manager.age == null ? '' : `Age ${escapePlayerHtml(manager.age)}`}</span>${affinities ? `<div class="manager-affinities">${affinities}</div>` : ''}${manager.sourceUrl ? `<a href="${escapePlayerHtml(manager.sourceUrl)}" rel="noopener noreferrer">Manager source</a>` : ''}</div></div>` : ''}
    ${members ? `<details class="team-squad-details"><summary>Squad list (${roster.length})</summary><ol class="team-squad-list">${members}</ol></details>` : ''}
    ${team.sourceUrl ? `<a href="${escapePlayerHtml(team.sourceUrl)}" rel="noopener noreferrer">Team source</a>` : ''}
  </section>`;
};

const renderSelectedCard = (card, context) => {
  const style = playerStyles.get(card.playerStyleId) || card.playerStyle || '—';
  const tier = calculateAiTier(card);
  const ai = aiTierMarkup(tier);
  const packEndDate = card.packEndDate || card.endDate || null;
  const image = card.cardImageUrl || card.faceUrl || card.imageUrl;
  const contextHtml = card.teamContext
    ? `<section class="card-team-context"><h2>Club, squad &amp; manager</h2><div class="team-info-grid">
        ${renderTeamInfo(card.teamContext.clubTeamId, 'Club team', card.teamContext.clubShirtNumber, context.teamInfoById, context.managerInfoById)}
        ${renderTeamInfo(card.teamContext.nationalTeamId, 'National team', card.teamContext.nationalShirtNumber, context.teamInfoById, context.managerInfoById)}
      </div></section>`
    : '';
  document.getElementById('selectedCardDetail').innerHTML = `
    <div class="selected-card-heading"><h2>Selected Card: ${escapePlayerHtml(card.cardName || 'Card version unavailable')}</h2>${ai.badge}</div>
    ${ai.note}
    <div class="selected-card-meta"><span>${cardTypeForPlayer(card)}</span><span>Rating ${formatRating(card)}</span><span>Style ${escapePlayerHtml(style)}</span><span>Form ${escapePlayerHtml(card.formRating || card.form || '—')}</span><span>Pack ${escapePlayerHtml(card.packName || 'Not listed by source')}</span><span>End Date ${escapePlayerHtml(packEndDate || 'Not listed by source')}</span></div>
    <div class="player-stats-grid"><section><h3>Full Stats</h3>${renderStats(card)}</section><section><h3>Skills</h3>${renderSkills(card)}</section></div>
    ${contextHtml}
    <p class="player-detail-source">Card data source: <a href="${escapePlayerHtml(card.sourceUrl || 'https://efootballdb.com/players')}" rel="noopener noreferrer">${escapePlayerHtml(card.source || 'eFootball DB')}</a></p>`;
  document.getElementById('selectedCardDetail').hidden = false;
  renderImageFallbacks(document.getElementById('selectedCardDetail'));
};

const renderPlayerPage = context => {
  const standardCard = sortPlayerCards(pageCards).find(card => cardTypeForPlayer(card) === 'Standard') || sortPlayerCards(pageCards)[0];
  if (!standardCard) {
    playerPageContent.innerHTML = '<p class="database-empty">No cards found for this player.</p>';
    return;
  }
  const styleName = playerStyles.get(standardCard.playerStyleId) || standardCard.playerStyle || '—';
  const routeSlug = playerSlug(standardCard.playerName);
  const pageBase = window.location.pathname.replace(/\/player\.html$/i, '').replace(/\/$/, '');
  window.history.replaceState(null, '', `${pageBase}/player/${routeSlug}`);
  document.title = `${standardCard.playerName} Cards | Touchline Intel`;
  playerListBack.href = `coach-squad-guides.html?player=${encodeURIComponent(standardCard.playerName)}#player-styles`;
  const positionLabels = standardCard.positions && standardCard.positions.length
    ? standardCard.positions.join(', ')
    : '—';
  const orderedCards = sortPlayerCards(pageCards);
  if (!orderedCards.some(card => String(card.cardId) === String(activeCardId))) activeCardId = standardCard.cardId;
  playerPageContent.innerHTML = `
    <section class="player-detail-header">
      ${playerImageMarkup(standardCard, 'card-art-frame', `${standardCard.playerName} portrait`, 132, 132)}
      <div><p class="eyebrow">Player profile · ${escapePlayerHtml(cardTypeForPlayer(standardCard))}</p>
        <h1>${escapePlayerHtml(standardCard.playerName)}</h1>
        <p>Positions: ${escapePlayerHtml(positionLabels)}</p>
        <p>Main Position: ${escapePlayerHtml(standardCard.mainPosition || standardCard.positions?.[0] || '—')}</p>
        <p>Player Style: ${escapePlayerHtml(styleName)}</p>
      </div>
    </section>
    <section class="player-page-section"><h2>All Cards For This Player</h2>
      <div class="player-variant-grid">${orderedCards.map(card => {
        const cardImage = card.cardImageUrl || card.faceUrl || card.imageUrl;
        const cardStyle = playerStyles.get(card.playerStyleId) || card.playerStyle || '—';
        return `<button type="button" class="player-variant-card" data-player-card-id="${escapePlayerHtml(card.cardId)}" aria-pressed="${String(String(card.cardId) === String(activeCardId))}">
          ${playerImageMarkup(card, 'variant-card-image', `${card.playerName} ${card.cardName || ''}`, 150, 200)}
          <strong>${escapePlayerHtml(card.cardName || 'Card version unavailable')}</strong>
          <span>${cardTypeForPlayer(card)} · Rating ${formatRating(card)}</span>
          <span>${escapePlayerHtml(cardStyle)} · Form ${escapePlayerHtml(card.formRating || card.form || '—')}</span>
        </button>`;
      }).join('')}</div>
    </section>
    <section id="selectedCardDetail" class="selected-card-detail" aria-live="polite"></section>`;
  renderImageFallbacks(playerPageContent);
  playerPageContent.querySelectorAll('[data-player-card-id]').forEach(button => {
    button.addEventListener('click', () => {
      activeCardId = button.dataset.playerCardId;
      playerPageContent.querySelectorAll('[data-player-card-id]').forEach(cardButton =>
        cardButton.setAttribute('aria-pressed', String(cardButton === button)));
      const selectedCard = pageCards.find(card => String(card.cardId) === String(activeCardId));
      if (selectedCard) renderSelectedCard(selectedCard, context);
    });
  });
  const initialCard = pageCards.find(card => String(card.cardId) === String(activeCardId));
  renderSelectedCard(initialCard || standardCard, context);
};

Promise.all([
  fetch('data/players.json').then(response => {
    if (!response.ok) throw new Error(`Player database request failed (${response.status}).`);
    return response.json();
  }),
  fetch('data.json').then(response => {
    if (!response.ok) throw new Error(`Player-style database request failed (${response.status}).`);
    return response.json();
  })
]).then(([playerData, guideData]) => {
  if (!Array.isArray(playerData.players) || !Array.isArray(guideData.playerStyles)) {
    throw new Error('Player database is missing cards or player-style records.');
  }
  playerStyles = new Map(guideData.playerStyles.map(style => [style.id, style.name]));
  const pathMatch = window.location.pathname.match(/\/player\/([^/]+)\/?$/);
  const requestedName = new URLSearchParams(window.location.search).get('name') ||
    (pathMatch ? decodeURIComponent(pathMatch[1]) : '');
  if (!requestedName) throw new Error('No player was selected.');
  const requestedSlug = playerSlug(requestedName);
  pageCards = playerData.players.filter(card =>
    playerSearchKey(card.playerName) === playerSearchKey(requestedName) ||
    playerSlug(card.playerName) === requestedSlug);
  if (!pageCards.length) {
    playerPageContent.innerHTML = '<p class="database-empty">This player is not in the database yet.</p>';
    return;
  }
  const context = {
    teamInfoById: new Map((playerData.teams || []).map(team => [String(team.teamId), team])),
    managerInfoById: new Map((playerData.managers || []).map(manager => [String(manager.managerId), manager]))
  };
  renderPlayerPage(context);
}).catch(error => {
  console.error('Unable to load player detail:', error);
  playerPageContent.innerHTML = '<p class="lab-error">Player details could not be loaded. Please try again later.</p>';
});
