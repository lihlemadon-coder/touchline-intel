const form = document.getElementById('oddsForm');
const resultsHint = document.getElementById('resultsHint');

const formatCoins = value => `${new Intl.NumberFormat().format(Math.round(value))} coins`;
const formatPercent = value => `${new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2
}).format(value)}%`;

form.addEventListener('submit', event => {
  event.preventDefault();

  if (!form.reportValidity()) return;

  const budget = Number(form.elements.budget.value);
  const packCost = Number(form.elements.packCost.value);
  const targetChance = Number(form.elements.targetChance.value);
  const packs = Math.floor(budget / packCost);
  const draws = packs * 10;
  const probability = targetChance / 100;
  const chanceWithinBudget = probability === 0
    ? 0
    : probability === 1
      ? 1
      : -Math.expm1(draws * Math.log1p(-probability));
  const chancePerPack = probability === 0
    ? 0
    : probability === 1
      ? 1
      : -Math.expm1(10 * Math.log1p(-probability));

  document.getElementById('packsResult').textContent = String(packs);
  document.getElementById('drawsResult').textContent = String(draws);
  document.getElementById('chanceResult').textContent = formatPercent(chanceWithinBudget * 100);
  document.getElementById('expectedPacksResult').textContent = chancePerPack === 0
    ? 'No chance'
    : new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(1 / chancePerPack);
  document.getElementById('expectedCostResult').textContent = probability === 0
    ? 'No chance'
    : formatCoins(packCost / chancePerPack);
  resultsHint.textContent = `With ${formatCoins(budget)}, you can buy ${packs} 10-draw pack${packs === 1 ? '' : 's'} (${draws} draws) at ${formatCoins(packCost)} each. The chance uses the in-game per-draw target rate you entered.`;
});

form.addEventListener('reset', () => {
  document.getElementById('packsResult').textContent = '—';
  document.getElementById('drawsResult').textContent = '—';
  document.getElementById('chanceResult').textContent = '—';
  document.getElementById('expectedPacksResult').textContent = '—';
  document.getElementById('expectedCostResult').textContent = '—';
  resultsHint.textContent = 'Enter the target player\'s in-game rate per single draw, not the probability of getting any featured player.';
});
