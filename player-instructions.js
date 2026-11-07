const coachSelect = document.getElementById('instructionCoach');
const instructionContent = document.getElementById('instructionContent');
const copySetupButton = document.getElementById('copySetupButton');
const copyStatus = document.getElementById('copyStatus');

if (coachSelect && instructionContent && copySetupButton && copyStatus) {
  const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
  let styleById = new Map();
  let setupByCoach = new Map();
  let activeSetup = null;

  const renderPitch = setup => {
    const zones = [
      { label: 'ATTACK', matches: row => /^(LW|RW|CF|SS|Other attackers|CF )/.test(row.position) },
      { label: 'MIDFIELD', matches: row => /^(AMF|CMF|DMF)/.test(row.position) },
      { label: 'DEFENCE', matches: row => /^(CB|LB|RB)/.test(row.position) },
      { label: 'KEEPER', matches: row => /^GK/.test(row.position) }
    ];

    return `<div class="tactical-pitch" aria-label="${escapeHtml(setup.formation)} pitch overview">
      ${zones.map(zone => {
        const zoneRows = setup.rows.filter(zone.matches);
        if (!zoneRows.length) return '';
        return `<div class="pitch-zone"><span class="pitch-zone-label">${zone.label}</span><div class="pitch-tokens">
          ${zoneRows.map(row => {
            const style = styleById.get(row.styleId);
            return `<div class="pitch-player">
              <span class="pitch-position">${escapeHtml(row.position)}</span>
              <strong>${escapeHtml(style.name)}</strong>
            </div>`;
          }).join('')}
        </div></div>`;
      }).join('')}
    </div>`;
  };

  const renderSetup = setup => {
    activeSetup = setup;
    instructionContent.setAttribute('aria-busy', 'false');
    instructionContent.innerHTML = `
      <div class="instruction-profile-heading">
        <div><p class="eyebrow">${escapeHtml(setup.playstyle)}</p><h3>${escapeHtml(setup.coachName)}</h3></div>
        <span class="formation-chip">${escapeHtml(setup.formation)}</span>
      </div>
      <div class="instruction-layout">
        ${renderPitch(setup)}
        <div class="instruction-table-wrap">
          <table class="instruction-table">
            <thead><tr><th>Position</th><th>Player Style</th><th>Attacking Instruction</th><th>Defensive Instruction</th><th>Why</th></tr></thead>
            <tbody>${setup.rows.map(row => {
              const style = styleById.get(row.styleId);
              return `<tr>
                <th scope="row">${escapeHtml(row.position)}</th>
                <td><span class="player-style-badge tone-${escapeHtml(style.tone)}">${escapeHtml(style.name)}</span></td>
                <td>${escapeHtml(row.attacking)}</td>
                <td>${escapeHtml(row.defensive)}</td>
                <td>${escapeHtml(row.why || '—')}</td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>
      </div>`;
    copySetupButton.disabled = false;
    copyStatus.textContent = `${setup.coachName} · ${setup.formation}`;
  };

  const saveSelection = coachId => {
    try {
      localStorage.setItem('touchline:selectedCoach', coachId);
    } catch (error) {
      console.error('Unable to save the coach selection:', error);
      copyStatus.textContent = 'Could not save your coach selection in this browser.';
    }
  };

  coachSelect.addEventListener('change', () => {
    const setup = setupByCoach.get(coachSelect.value);
    if (!setup) {
      copyStatus.textContent = 'No instruction setup is available for that coach.';
      return;
    }
    saveSelection(setup.coachId);
    renderSetup(setup);
  });

  copySetupButton.addEventListener('click', async () => {
    if (!activeSetup) return;
    const text = [
      `${activeSetup.coachName} — ${activeSetup.playstyle} (${activeSetup.formation})`,
      'Position | Player Style | Attacking Instruction | Defensive Instruction | Why',
      ...activeSetup.rows.map(row => {
        const style = styleById.get(row.styleId);
        return [row.position, style.name, row.attacking, row.defensive, row.why].join(' | ');
      })
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      copyStatus.textContent = 'Setup copied to clipboard.';
    } catch (error) {
      console.error('Unable to copy the setup:', error);
      copyStatus.textContent = 'Clipboard access was denied. Select and copy the setup from the table.';
    }
  });

  fetch('data.json')
    .then(response => {
      if (!response.ok) throw new Error(`Instruction data request failed (${response.status}).`);
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data.playerInstructions) || !Array.isArray(data.playerStyles)) {
        throw new Error('Coach instructions or player styles are missing.');
      }
      styleById = new Map(data.playerStyles.map(style => [style.id, style]));
      setupByCoach = new Map(data.playerInstructions.map(setup => [setup.coachId, setup]));
      data.playerInstructions.forEach(setup => {
        if (!setup.coachId || !setup.coachName || !setup.formation || !Array.isArray(setup.rows) ||
          setup.rows.some(row => !styleById.has(row.styleId) ||
            !['None', 'Defensive', 'Anchoring'].includes(row.attacking) ||
            !['None', 'Counter Target', 'Man Marking'].includes(row.defensive))) {
          throw new Error(`Instruction setup for ${setup.coachName || 'a coach'} is invalid.`);
        }
      });

      coachSelect.replaceChildren(...data.playerInstructions.map(setup => {
        const option = document.createElement('option');
        option.value = setup.coachId;
        option.textContent = setup.coachName;
        return option;
      }));

      let selectedCoachId = null;
      try {
        selectedCoachId = localStorage.getItem('touchline:selectedCoach');
      } catch (error) {
        console.error('Unable to read the saved coach selection:', error);
      }
      const selectedSetup = setupByCoach.get(selectedCoachId) || data.playerInstructions[0];
      coachSelect.value = selectedSetup.coachId;
      renderSetup(selectedSetup);
    })
    .catch(error => {
      console.error('Unable to load player instructions:', error);
      coachSelect.replaceChildren();
      instructionContent.setAttribute('aria-busy', 'false');
      instructionContent.innerHTML = '<p class="lab-error">Instructions could not be loaded. Open the site through a local web server and check data.json.</p>';
      copyStatus.textContent = 'No setup is available to copy.';
    });
}
