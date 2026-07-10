// Band gauge - the platform's signature element.
// A semicircular arc from band 0 to 9 with the score in the centre.
// Used on the landing hero, the dashboard, and writing results.

export function renderGauge(container, { value, target = null, label = 'Current band', size = 200 }) {
  const max = 9;
  const clamped = Math.max(0, Math.min(max, Number(value) || 0));
  const radius = 80;
  const circumference = Math.PI * radius; // semicircle length
  const filled = circumference * (clamped / max);

  const targetMarkup = target
    ? (() => {
        // Tick mark at the target band position on the arc.
        const angle = Math.PI * (1 - target / max);
        const x1 = 100 + Math.cos(angle) * 68;
        const y1 = 95 - Math.sin(angle) * 68;
        const x2 = 100 + Math.cos(angle) * 92;
        const y2 = 95 - Math.sin(angle) * 92;
        return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
                  stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>`;
      })()
    : '';

  container.innerHTML = `
    <svg viewBox="0 0 200 110" width="${size}" style="max-width:100%;height:auto" role="img"
         aria-label="${label}: ${clamped} out of 9${target ? `, target ${target}` : ''}">
      <path d="M 20 95 A 80 80 0 0 1 180 95" fill="none"
            class="band-arc-track gauge-seg" stroke="rgba(148,163,184,0.25)"
            stroke-width="12" stroke-linecap="round"/>
      <path d="M 20 95 A 80 80 0 0 1 180 95" fill="none"
            stroke="url(#gauge-grad-${label.replace(/\W/g, '')})"
            stroke-width="12" stroke-linecap="round"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${circumference}"
            class="band-arc-value" data-target-offset="${circumference - filled}"/>
      <defs>
        <linearGradient id="gauge-grad-${label.replace(/\W/g, '')}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0d9488"/>
          <stop offset="60%" stop-color="#06b6d4"/>
          <stop offset="100%" stop-color="#22d3ee"/>
        </linearGradient>
      </defs>
      ${targetMarkup}
      <text x="100" y="78" text-anchor="middle"
            font-family="'JetBrains Mono', monospace" font-weight="700" font-size="34"
            fill="currentColor">${clamped ? clamped.toFixed(1) : '—'}</text>
      <text x="100" y="99" text-anchor="middle" font-size="10.5" letter-spacing="1"
            fill="rgb(100 116 139)" style="text-transform:uppercase">${label}</text>
    </svg>`;

  // Animate the arc filling in after insertion.
  requestAnimationFrame(() => {
    const arc = container.querySelector('.band-arc-value');
    if (!arc) return;
    arc.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(0.3, 0.6, 0.2, 1)';
    requestAnimationFrame(() => {
      arc.setAttribute('stroke-dashoffset', arc.dataset.targetOffset);
    });
  });
}
