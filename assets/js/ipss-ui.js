import { interpretIpssFull } from "../../src/logic/ipss.js";
import { REFERENCES, refUrl } from "../../src/logic/criteria.js";
import { t } from "../../src/logic/messages.js";
import { getLang } from "./site.js";

const $ = (id) => document.getElementById(id);
const L = (es, en) => (getLang() === "es" ? es : en);
const TIMES = ["0", "3", "5", "10"];
const COLS = ["aP", "aR", "aL", "pP", "pR", "pL"];
const dec = (x, d = 2) => (x === null || x === undefined ? "—" : getLang() === "es" ? x.toFixed(d).replace(".", ",") : x.toFixed(d));
const side = (s) => (s === "R" ? L("derecho", "right") : L("izquierdo", "left"));
let last = null;

// Tabla de entrada
$("tbody").innerHTML = TIMES.map((tm, i) => `<tr data-i="${i}"><th>${i === 0 ? `<span lang="es">Basal</span><span lang="en">Basal</span>` : `${tm} min`}</th>${COLS.map((c) => `<td><input type="number" min="0" step="any" data-c="${c}" data-i="${i}" aria-label="${c} ${tm}"></td>`).join("")}</tr>`).join("");

function stimRows() {
  const none = $("stim").value === "none";
  document.querySelectorAll("#tbody tr").forEach((tr) => { if (tr.dataset.i !== "0") tr.hidden = none; });
}

function read() {
  const none = $("stim").value === "none";
  const n = none ? 1 : TIMES.length;
  const col = (c) => Array.from({ length: n }, (_, i) => { const v = document.querySelector(`input[data-c="${c}"][data-i="${i}"]`).value; return v === "" ? null : parseFloat(v); });
  return { times: TIMES.slice(0, n), acth: { P: col("aP"), R: col("aR"), L: col("aL") }, prl: { P: col("pP"), R: col("pR"), L: col("pL") } };
}

const refs = (keys) => `<span class="refs">${keys.map((k) => `<a href="${refUrl(REFERENCES[k])}">${REFERENCES[k].short}</a>`).join(" · ")}</span>`;
const finding = (lvl, html, r = []) => `<div class="finding ${lvl}"><span class="dot"></span><div>${html}${r.length ? refs(r) : ""}</div></div>`;
const note = (html) => `<div class="finding note"><span class="dot"></span><div>${html}</div></div>`;
const pill = (st) => st === "adequate" ? `<span class="pill ok">${L("adecuada", "adequate")}</span>` : st === "failed" ? `<span class="pill bad">${L("fallida", "failed")}</span>` : st === "doubtful" ? `<span class="pill warn">${L("dudosa", "doubtful")}</span>` : "—";

function render() {
  const r = last;
  const lang = getLang();
  let h = `<h4>${L("Interpretación", "Interpretation")}</h4>`;
  if (!r || !r.ok) {
    $("out").innerHTML = h + `<p class="muted small" style="margin:0">${t(lang, "ipssNeedData")}</p>`;
    return;
  }
  h += `<div class="conclusion ${r.conclusion.level}">${t(lang, r.conclusion.code)}</div>${refs(r.conclusion.refs)}`;

  // Gradientes por tiempo
  const { basalRatio: bCut, stimulatedRatio: sCut } = { basalRatio: 2, stimulatedRatio: 3 };
  h += `<h4 style="margin-top:16px">${L("Gradiente central:periférico de ACTH", "Central-to-peripheral ACTH gradient")}</h4><div class="table-wrap"><table><thead><tr><th>${L("Tiempo", "Time")}</th><th class="num">${L("Der.", "Right")}</th><th class="num">${L("Izq.", "Left")}</th><th class="num">${L("Corte", "Cutoff")}</th></tr></thead><tbody>`;
  r.times.forEach((tm, i) => {
    const cut = i === 0 ? bCut : sCut;
    const cell = (v) => `<td class="num ${v !== null && v >= cut ? "ratio-hi" : "ratio-lo"}">${dec(v, 1)}</td>`;
    h += `<tr><td>${i === 0 ? L("Basal", "Basal") : tm + " min"}</td>${cell(r.acthRatio.R[i])}${cell(r.acthRatio.L[i])}<td class="num">≥ ${cut}</td></tr>`;
  });
  h += `</tbody></table></div>`;
  h += `<p class="small muted" style="margin:6px 0 0">${L("Lado dominante", "Dominant side")}: ${side(r.dominant.side)} (${dec(r.dominant.value, 1)})</p>`;

  // Prolactina
  h += `<h4 style="margin-top:16px">${L("Canulación (prolactina basal IPS:P)", "Cannulation (basal prolactin IPS:P)")}</h4>`;
  if (r.prlRatio.R === null && r.prlRatio.L === null) h += note(L("Sin prolactina basal.", "No basal prolactin."));
  else h += finding("info", `${L("Derecho", "Right")}: ${dec(r.prlRatio.R)} ${pill(r.prlStatus.R)} · ${L("Izquierdo", "Left")}: ${dec(r.prlRatio.L)} ${pill(r.prlStatus.L)}`, r.refs.prolactin);
  if (r.normalized) {
    const nl = r.normalized.level;
    h += finding(nl, `${L("Relación ACTH normalizada por prolactina", "Prolactin-normalized ACTH ratio")} (${side(r.normalized.side)}): <strong>${dec(r.normalized.value)}</strong> · ${nl === "favorsCD" ? L("≥ 1,3: origen hipofisario", "≥ 1.3: pituitary source") : nl === "favorsEAS" ? L("≤ 0,7: secreción ectópica", "≤ 0.7: ectopic secretion") : L("0,7–1,3: no diagnóstico", "0.7–1.3: non-diagnostic")}`, r.refs.normalized);
    if (r.central) h += note(L("Con gradiente presente, la prolactina no cambia la conclusión.", "With a gradient present, prolactin does not change the conclusion."));
  }

  // Lateralización
  if (r.lateralization) {
    const la = r.lateralization;
    h += `<h4 style="margin-top:16px">${L("Lateralización", "Lateralization")}</h4>`;
    if (la.raw) h += finding("info", `${L("Gradiente intersinusal de ACTH máximo", "Maximum intersinus ACTH gradient")}: <strong>${dec(la.raw.value)}</strong> (${la.raw.time === "0" ? L("basal", "basal") : la.raw.time + " min"}) → ${la.raw.lateralized ? L("lado ", "side: ") + side(la.raw.side) : L("< 1,4: no lateraliza", "< 1.4: does not lateralize")}`, ["oldfield1991"]);
    if (la.adjusted) h += finding("info", `${L("Ajustado por prolactina", "Prolactin-adjusted")}: <strong>${dec(la.adjusted.value)}</strong> (${la.adjusted.time === "0" ? L("basal", "basal") : la.adjusted.time + " min"}) → ${la.adjusted.lateralized ? L("lado ", "side: ") + side(la.adjusted.side) : L("< 1,4: no lateraliza", "< 1.4: does not lateralize")}`, ["mulligan2012"]);
    if (la.discordantOverTime) h += note(L("El lado con gradiente ≥ 1,4 cambia entre tiempos: lateralización no fiable.", "The side with gradient ≥ 1.4 changes between time points: unreliable lateralization."));
    if (la.raw && la.adjusted && la.raw.lateralized && la.adjusted.lateralized && la.raw.side !== la.adjusted.side) h += note(L("El gradiente bruto y el ajustado señalan lados distintos.", "Raw and adjusted gradients point to different sides."));
    la.notes.forEach((n) => (h += note(t(lang, n))));
  }
  r.notes.forEach((n) => (h += note(t(lang, n))));
  if ($("stim").value === "ddavp") h += note(L("Con desmopresina se usan los mismos cortes que con CRH (≥ 3 tras estímulo).", "With desmopressin the same cutoffs as with CRH are used (≥ 3 after stimulation)."));

  h += `<div class="sticky-actions no-print" style="margin-top:14px"><button type="button" class="btn btn-ghost" id="copy">${L("Copiar resumen", "Copy summary")}</button><button type="button" class="btn btn-ghost" onclick="window.print()">${L("Imprimir", "Print")}</button></div>`;
  $("out").innerHTML = h;
  $("copy").addEventListener("click", copy);
}

async function copy() {
  const r = last, lang = getLang();
  const lines = [L("Cateterismo de senos petrosos — interpretación", "Petrosal sinus sampling — interpretation"), t(lang, r.conclusion.code),
    `${L("Gradiente máximo basal", "Max basal gradient")}: ${dec(r.basalMax?.value ?? null, 1)}; ${L("tras estímulo", "after stimulation")}: ${dec(r.stimMax?.value ?? null, 1)}; ${L("lado dominante", "dominant side")}: ${side(r.dominant.side)}`];
  if (r.prlRatio.R !== null || r.prlRatio.L !== null) lines.push(`${L("Prolactina IPS:P basal", "Basal prolactin IPS:P")}: ${L("D", "R")} ${dec(r.prlRatio.R)}, ${L("I", "L")} ${dec(r.prlRatio.L)}`);
  if (r.normalized) lines.push(`${L("Relación normalizada", "Normalized ratio")}: ${dec(r.normalized.value)}`);
  if (r.lateralization?.raw) lines.push(`${L("Gradiente intersinusal", "Intersinus gradient")}: ${dec(r.lateralization.raw.value)} (${side(r.lateralization.raw.side)})${r.lateralization.adjusted ? `; ${L("ajustado", "adjusted")}: ${dec(r.lateralization.adjusted.value)} (${side(r.lateralization.adjusted.side)})` : ""}`);
  lines.push(L("Herramienta de apoyo; no sustituye el juicio clínico.", "Support tool; does not replace clinical judgement."));
  try { await navigator.clipboard.writeText(lines.join("\n")); $("copy").textContent = L("✓ Copiado", "✓ Copied"); } catch { /* sin portapapeles */ }
}

function update() { stimRows(); last = interpretIpssFull(read()); render(); }

const EXAMPLE = { aP: [50, 70, 80, 75], aR: [400, 1500, 1800, 1200], aL: [120, 300, 380, 260], pP: [10, 10, 10, 10], pR: [40, 42, 41, 40], pL: [30, 30, 31, 30] };
$("example").addEventListener("click", () => {
  $("stim").value = "crh";
  for (const c of COLS) EXAMPLE[c].forEach((v, i) => (document.querySelector(`input[data-c="${c}"][data-i="${i}"]`).value = v));
  update();
});
$("clear").addEventListener("click", () => { document.querySelectorAll("#tbody input").forEach((i) => (i.value = "")); update(); });
$("tbl").addEventListener("input", update);
$("stim").addEventListener("change", update);
document.addEventListener("langchange", render);
update();
