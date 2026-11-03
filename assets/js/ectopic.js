import { predict, sweep, MODEL } from "../../src/logic/ectopic-model.js";
import { convert, timesULN, fmt } from "../../src/logic/units.js";
import { t } from "../../src/logic/messages.js";
import { getLang } from "./site.js";
import { probabilityChart } from "./charts.js";

const $ = (id) => document.getElementById(id);
const crit = [...document.querySelectorAll(".crit")];
const fs = $("fs");
let sensVar = "acth";
let last = null;

const LABELS = {
  es: { acth: "ACTH (pg/mL)", ufc: "CLU (×LSN)", potassium: "Potasio (mmol/L)", pituitarySize: "Lesión hipofisaria (mm)", intercept: "Intercepto", required: "Campo obligatorio.", range: "Valor fuera del rango admitido ({min}–{max})." },
  en: { acth: "ACTH (pg/mL)", ufc: "UFC (×ULN)", potassium: "Potassium (mmol/L)", pituitarySize: "Pituitary lesion (mm)", intercept: "Intercept", required: "Required field.", range: "Value outside the accepted range ({min}–{max})." },
};
const lab = (k) => LABELS[getLang()][k];

crit.forEach((c) => c.addEventListener("change", () => {
  fs.disabled = !crit.every((x) => x.checked);
  update();
}));

$("ufc-helper-toggle").addEventListener("click", (e) => {
  e.preventDefault();
  $("ufc-helper").hidden = !$("ufc-helper").hidden;
});
["ufc-val", "ufc-val-unit", "ufc-uln", "ufc-uln-unit"].forEach((id) => $(id).addEventListener("input", () => {
  const r = timesULN("urinaryCortisol", parseFloat($("ufc-val").value), $("ufc-val-unit").value, parseFloat($("ufc-uln").value), $("ufc-uln-unit").value);
  if (Number.isFinite(r)) { $("ufc").value = Number(r.toFixed(2)); update(); }
}));

$("example").addEventListener("click", () => {
  $("acth").value = 145; $("acth-unit").value = "pg/mL";
  $("ufc").value = 12; $("k").value = 3.1; $("size").value = 0;
  update();
});
$("form").addEventListener("reset", () => setTimeout(update, 0));
$("form").addEventListener("input", update);
document.addEventListener("langchange", () => { if (last) render(last); });

document.querySelectorAll("#sens-seg button").forEach((b) => b.addEventListener("click", () => {
  sensVar = b.dataset.var;
  document.querySelectorAll("#sens-seg button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  if (last) renderChart(last);
}));

function readInputs() {
  const raw = (id) => ($(id).value === "" ? "" : parseFloat($(id).value));
  const acthRaw = raw("acth");
  return {
    acth: acthRaw === "" ? "" : convert("acth", acthRaw, $("acth-unit").value, "pg/mL"),
    ufc: raw("ufc"),
    potassium: raw("k"),
    pituitarySize: raw("size"),
  };
}

const FIELD_ID = { acth: "acth", ufc: "ufc", potassium: "k", pituitarySize: "size" };

function update() {
  const x = readInputs();
  const r = fs.disabled ? null : predict(x);

  for (const [k, id] of Object.entries(FIELD_ID)) {
    const e = r && !r.ok ? r.errors.find((er) => er.field === k) : null;
    const show = Boolean(e && e.code === "range");
    $(id).setAttribute("aria-invalid", show ? "true" : "false");
    $(`${id}-err`).textContent = show ? lab(e.code).replace("{min}", e.min).replace("{max}", e.max) : "";
  }

  if (!r || !r.ok) {
    last = null;
    $("result").className = "result";
    $("result-empty").hidden = false;
    $("result-body").hidden = true;
    ["detail", "sens", "actions"].forEach((id) => ($(id).hidden = true));
    return;
  }
  last = r;
  render(r);
}

function render(r) {
  const lang = getLang();
  const pct = r.prob * 100;
  const pctTxt = pct < 0.1 ? `< ${fmtPct(0.1, lang)}` : pct > 99.9 ? `> ${fmtPct(99.9, lang)}` : fmtPct(pct, lang);
  $("result").className = `result ${r.band}`;
  $("result-empty").hidden = true;
  $("result-body").hidden = false;
  $("prob").innerHTML = `${pctTxt}<small> %</small>`;
  $("band-label").textContent = { low: { es: "Probabilidad muy baja", en: "Very low probability" }, intermediate: { es: "Zona de incertidumbre", en: "Uncertain range" }, high: { es: "Probabilidad alta", en: "High probability" } }[r.band][lang];
  $("band-text").textContent = t(lang, { low: "bandLow", intermediate: "bandIntermediate", high: "bandHigh" }[r.band]);
  $("pin").style.left = `${Math.min(100, Math.max(0, pct))}%`;
  ["detail", "sens", "actions"].forEach((id) => ($(id).hidden = false));

  // Contribuciones (sin el intercepto, que es constante)
  const keys = ["acth", "ufc", "potassium", "pituitarySize"];
  const max = Math.max(...keys.map((k) => Math.abs(r.contributions[k])), 1);
  $("contrib").innerHTML = keys.map((k) => {
    const v = r.contributions[k];
    const w = (Math.abs(v) / max) * 50;
    return `<span>${lab(k)}</span><div class="bar-wrap"><div class="bar ${v >= 0 ? "pos" : "neg"}" style="width:${w}%"></div></div><span class="val">${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}</span>`;
  }).join("") + `<span class="muted">${lab("intercept")}</span><span></span><span class="val">${r.contributions.intercept.toFixed(2).replace("-", "−")}</span>`;

  renderChart(r);
}

function fmtPct(p, lang) {
  const s = p >= 10 && p <= 99 ? p.toFixed(0) : p.toFixed(1);
  return lang === "es" ? s.replace(".", ",") : s;
}

const RANGES = { acth: [0, 500], potassium: [1.5, 5.5], pituitarySize: [0, 20], ufc: [0, 100] };

function renderChart(r) {
  const [a, b] = RANGES[sensVar];
  const cur = r.inputs[sensVar];
  const hi = Math.max(b, cur);
  const pts = sweep(r.inputs, sensVar, a, hi, 80);
  $("chart").innerHTML = probabilityChart({
    points: pts,
    current: { x: cur, p: r.prob },
    xLabel: lab(sensVar),
    yLabel: "P",
    xFmt: (v) => (sensVar === "potassium" ? v.toFixed(1) : Math.round(v)),
  });
}

$("copy").addEventListener("click", async () => {
  if (!last) return;
  const lang = getLang();
  const i = last.inputs;
  const lines = lang === "es"
    ? [
        "Modelo de origen ectópico (Rivera-Martínez et al., Endocr Relat Cancer 2026)",
        `ACTH ${fmt(i.acth)} pg/mL · CLU ${i.ufc}×LSN · K nadir ${i.potassium} mmol/L · lesión hipofisaria ${i.pituitarySize} mm`,
        `Probabilidad estimada de origen ectópico: ${$("prob").textContent.replace(/\s+/g, " ").trim()}`,
        t(lang, { low: "bandLow", intermediate: "bandIntermediate", high: "bandHigh" }[last.band]),
        "Herramienta de apoyo; no sustituye el juicio clínico.",
      ]
    : [
        "Ectopic origin model (Rivera-Martínez et al., Endocr Relat Cancer 2026)",
        `ACTH ${fmt(i.acth)} pg/mL · UFC ${i.ufc}×ULN · nadir K ${i.potassium} mmol/L · pituitary lesion ${i.pituitarySize} mm`,
        `Estimated probability of ectopic origin: ${$("prob").textContent.replace(/\s+/g, " ").trim()}`,
        t(lang, { low: "bandLow", intermediate: "bandIntermediate", high: "bandHigh" }[last.band]),
        "Support tool; does not replace clinical judgement.",
      ];
  try {
    await navigator.clipboard.writeText(lines.join("\n"));
    flash($("copy"), lang === "es" ? "Copiado" : "Copied");
  } catch { /* portapapeles no disponible */ }
});

function flash(btn, msg) {
  const old = btn.innerHTML;
  btn.textContent = `✓ ${msg}`;
  setTimeout(() => (btn.innerHTML = old), 1500);
}

void MODEL;
update();
