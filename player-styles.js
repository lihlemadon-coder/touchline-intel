const latestPlayerGrid = document.getElementById('latestPlayerGrid');
const playerStyleGuide = document.getElementById('playerStyleGuide');

if (latestPlayerGrid && playerStyleGuide) {
  const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);

  const badge = style => `<span class="player-style-badge tone-${escapeHtml(style.tone)}">${escapeHtml(style.name)}</span>`;

  const showError = message => {
    latestPlayerGrid.innerHTML = `<p class="lab-error">${escapeHtml(message)}</p>`;
    playerStyleGuide.innerHTML = `<p class="lab-error">${escapeHtml(message)}</p>`;
  };

  fetch('data.json')
    .then(response => {
      if (!response.ok) throw new Error(`Player data request failed (${response.status}).`);
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data.playerStyles) || !Array.isArray(data.players) || !Array.isArray(data.latestPlayers)) {
        throw new Error('Player style data has an invalid format.');
      }

      const styleById = new Map(data.playerStyles.map(style => [style.id, style]));
      const playerById = new Map(data.players.map(player => [player.id, player]));
      const latestPlayers = data.latestPlayers.map(id => playerById.get(id));
      if (latestPlayers.some(player => !player || !styleById.has(player.styleId))) {
        throw new Error('A Latest Players entry is missing its player or style.');
      }

      latestPlayerGrid.innerHTML = latestPlayers.map(player => {
        const style = styleById.get(player.styleId);
        return `
          <article class="player-card">
            <span class="lineup-position">${escapeHtml(player.position)}</span>
            <h3>${escapeHtml(player.name)}</h3>
            ${badge(style)}
          </article>`;
      }).join('');

      const groups = [...new Set(data.playerStyles.map(style => style.group))];
      playerStyleGuide.innerHTML = groups.map(group => {
        const styles = data.playerStyles.filter(style => style.group === group);
        return `
          <section class="style-group">
            <h3>${escapeHtml(group)}</h3>
            <div class="style-card-list">${styles.map(style => `
              <article class="style-card">
                ${badge(style)}
                <p>${escapeHtml(style.description)}</p>
                ${style.bestFor ? `<p class="style-best-for">${style.id === 'goal-poacher' ? 'Best with' : 'Best for'} ${escapeHtml(style.bestFor)}.</p>` : ''}
                <p class="style-examples">Examples: ${escapeHtml(style.examples)}</p>
              </article>`).join('')}
            </div>
          </section>`;
      }).join('');
    })
    .catch(error => {
      console.error('Unable to load player styles:', error);
      showError('Player styles could not be loaded. Open the site through a local web server and check data.json.');
    });
}
