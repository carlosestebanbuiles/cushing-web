// Gráfico de línea mínimo en SVG para curvas de probabilidad.
// Minimal SVG line chart for probability curves.

export function probabilityChart({ points, current, xLabel, yLabel, xFmt = (v) => v, bands = [0.05, 0.25] }) {
  const W = 560, H = 260, m = { l: 46, r: 14, t: 12, b: 42 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const xs = points.map((p) => p.x);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const sx = (v) => m.l + ((v - x0) / (x1 - x0 || 1)) * iw;
  const sy = (p) => m.t + (1 - p) * ih;

  const d = points.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.p).toFixed(1)}`).join("");
  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const xTicks = Array.from({ length: 6 }, (_, i) => x0 + ((x1 - x0) * i) / 5);
  const [lo, hi] = bands;

  let marker = "";
  if (current && current.x >= x0 && current.x <= x1) {
    marker = `<line x1="${sx(current.x)}" x2="${sx(current.x)}" y1="${m.t}" y2="${m.t + ih}" stroke="currentColor" stroke-dasharray="3 4" opacity=".35"/>
      <circle class="marker" cx="${sx(current.x)}" cy="${sy(current.p)}" r="6"/>`;
  }

  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${yLabel} vs ${xLabel}">
    <rect class="band-low" x="${m.l}" y="${sy(lo)}" width="${iw}" height="${sy(0) - sy(lo)}"/>
    <rect class="band-mid" x="${m.l}" y="${sy(hi)}" width="${iw}" height="${sy(lo) - sy(hi)}"/>
    <rect class="band-high" x="${m.l}" y="${sy(1)}" width="${iw}" height="${sy(hi) - sy(1)}"/>
    ${yTicks.map((t) => `<line class="grid-line" x1="${m.l}" x2="${m.l + iw}" y1="${sy(t)}" y2="${sy(t)}"/><text class="tick" x="${m.l - 8}" y="${sy(t) + 4}" text-anchor="end">${Math.round(t * 100)}%</text>`).join("")}
    ${xTicks.map((t) => `<text class="tick" x="${sx(t)}" y="${m.t + ih + 18}" text-anchor="middle">${xFmt(t)}</text>`).join("")}
    <line class="axis" x1="${m.l}" x2="${m.l + iw}" y1="${m.t + ih}" y2="${m.t + ih}"/>
    <text class="tick" x="${m.l + iw / 2}" y="${H - 4}" text-anchor="middle">${xLabel}</text>
    <path class="curve" d="${d}"/>
    ${marker}
  </svg>`;
}
