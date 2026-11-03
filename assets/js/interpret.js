import { interpretScreening, interpretActh, interpretOrigin, interpretPostop } from "../../src/logic/interpretation.js";
import { REFERENCES } from "../../src/logic/criteria.js";
import { convert, timesULN, fmt } from "../../src/logic/units.js";
import { t } from "../../src/logic/messages.js";
import { getLang } from "./site.js";
import { predict as predictEctopic } from "../../src/logic/ectopic-model.js";

const $ = (id) => document.getElementById(id);
const num = (id) => { const v = $(id).value; return v === "" ? null : parseFloat(v); };
const L = (es, en) => (getLang() === "es" ? es : en);
const dec = (x) => (getLang() === "es" ? String(x).replace(".", ",") : String(x));
const f = (x) => dec(fmt(x));

let state = null;

function refsHtml(refs = []) {
  if (!refs.length) return "";
  return `<span class="refs">${refs.map((r) => `<a href="https://doi.org/${REFERENCES[r].doi}">${REFERENCES[r].short}</a>`).join(" · ")}</span>`;
}
function finding(level, text, refs) {
  return `<div class="finding ${level}"><span class="dot"></span><div>${text}${refsHtml(refs)}</div></div>`;
}
function note(text) {
  return `<div class="finding note"><span class="dot"></span><div>${text}</div></div>`;
}
function conclusion(level, text) {
  return `<div class="conclusion ${level}" style="margin-top:10px">${text}</div>`;
}
function empty(es, en) {
  return `<p class="muted small" style="margin:0">${L(es, en)}</p>`;
}
const head = (es, en) => `<h4>${L(es, en)}</h4>`;

function compute() {
  const lang = getLang();

  // 1. Tamizaje
  const ufcX = num("ufc") !== null && num("ufc-uln") ? timesULN("urinaryCortisol", num("ufc"), $("ufc-unit").value, num("ufc-uln")) : null;
  const lnscX = num("lnsc") !== null && num("lnsc-uln") ? timesULN("salivaryCortisol", num("lnsc"), $("lnsc-unit").value, num("lnsc-uln")) : null;
  const s1 = interpretScreening({ ufcTimesULN: ufcX, lnscTimesULN: lnscX, dstCortisol: num("dst"), dstUnit: $("dst-unit").value });

  // 2. ACTH
  const acth = num("acth") !== null ? convert("acth", num("acth"), $("acth-unit").value, "pg/mL") : null;
  const s2 = interpretActh({ acth_pgml: acth });

  // 3. Origen
  const mri = num("mri") !== null ? { size_mm: num("mri") } : null;
  const stim = { acthBasal: num("stim-acth-b"), acthPeak: num("stim-acth-p"), cortisolBasal: num("stim-cort-b"), cortisolPeak: num("stim-cort-p") };
  const hd = { cortisolBasal: num("hd-b"), cortisolAfter: num("hd-a") };
  const ipss = { basalRatio: num("ipss-b"), stimulatedRatio: num("ipss-s") };
  const k = num("k");
  const complete = acth !== null && ufcX !== null && k !== null && mri;
  // El modelo solo se aplica en hipercortisolismo confirmado y ACTH-dependiente.
  const applicable = s2.dependent && !(s1.tests.length && !s1.hypercortisolism);
  const candidate = complete ? { acth, ufc: ufcX, potassium: k, pituitarySize: mri.size_mm } : null;
  const modelStatus = !complete ? "missing" : !applicable ? "notApplicable" : predictEctopic(candidate).ok ? "ok" : "outOfRange";
  const ectopicInputs = modelStatus === "ok" ? candidate : null;
  const s3 = interpretOrigin({ mri, stimulation: stim, hddst: hd, ipss, ectopicInputs });
  const s3HasData = mri || s3.stimulation || s3.hddst || s3.ipss;

  // 4. Posoperatorio
  const s4 = interpretPostop({ cortisol: num("postop"), unit: $("postop-unit").value });

  state = { s1, s2, s3, s3HasData, s4, ectopicInputs, modelStatus };
  render(lang);
}

function render(lang) {
  const { s1, s2, s3, s3HasData, s4, modelStatus } = state;
  const withUnit = (v, u) => `${f(v)} ${u}`;

  // --- 1
  let h = head("Interpretación", "Interpretation");
  if (!s1.tests.length) h += empty("Introduzca al menos una prueba de tamizaje.", "Enter at least one screening test.");
  else {
    for (const x of s1.tests) {
      h += finding(x.abnormal ? "abnormal" : "normal", t(lang, x.code, { v: x.test === "dst" ? withUnit(x.value, x.unit) : f(x.value) }), x.refs);
      x.notes.forEach((n) => (h += note(t(lang, n))));
    }
    h += conclusion(s1.summary.level, t(lang, s1.summary.code));
    s1.notes.forEach((n) => (h += note(t(lang, n))));
  }
  $("out1").innerHTML = h;

  // --- 2
  h = head("Interpretación", "Interpretation");
  if (s2.code === "acthNoData") h += empty("Introduzca la ACTH plasmática.", "Enter plasma ACTH.");
  else {
    h += finding("info", `ACTH ${f(s2.value)} pg/mL (${f(convert("acth", s2.value, "pg/mL", "pmol/L"))} pmol/L)`, []);
    h += conclusion(s2.level === "indeterminate" ? "indeterminate" : "info", t(lang, s2.code));
    if (s1.tests.length && !s1.hypercortisolism) h += note(L("Interprete la ACTH solo cuando el hipercortisolismo esté confirmado (paso 1).", "Interpret ACTH only once hypercortisolism is confirmed (step 1)."));
  }
  $("out2").innerHTML = h;

  // --- 3
  h = head("Interpretación", "Interpretation");
  if (!s3HasData && !s3.model) h += empty("Introduzca la RM y las pruebas disponibles.", "Enter MRI and any available tests.");
  else {
    if (s2.code !== "acthNoData" && !s2.dependent) h += note(L("Atención: el estudio de origen asume hipercortisolismo ACTH-dependiente (paso 2).", "Note: source localization assumes ACTH-dependent hypercortisolism (step 2)."));
    if (s3.mri) h += finding("info", t(lang, s3.mri.code, { s: f(s3.mri.size) }), s3.mri.refs);
    if (s3.stimulation) {
      const st = s3.stimulation;
      const name = $("stim-type").value === "crh" ? "CRH" : L("Desmopresina", "Desmopressin");
      h += finding(st.level, `<strong>${name}.</strong> ${t(lang, st.code, { a: st.acthRise === null ? "—" : f(st.acthRise), c: st.cortisolRise === null ? "—" : f(st.cortisolRise) })}`, st.refs);
      if ($("stim-type").value === "ddavp") h += note(t(lang, "stimDdavpCaveat"));
    }
    if (s3.hddst) {
      h += finding(s3.hddst.level, t(lang, s3.hddst.code, { s: f(s3.hddst.suppression) }), s3.hddst.refs);
      h += note(t(lang, "hddstLowAccuracy"));
    }
    if (s3.ipss) {
      h += finding(s3.ipss.level, t(lang, s3.ipss.code, { b: s3.ipss.basal === null ? "—" : f(s3.ipss.basal), st: s3.ipss.stimulated === null ? "—" : f(s3.ipss.stimulated) }), s3.ipss.refs);
      s3.ipss.notes.forEach((n) => (h += note(t(lang, n))));
    }
    if (s3.model) {
      const p = s3.model.prob * 100;
      const pt = p < 0.1 ? "< 0.1" : p > 99.9 ? "> 99.9" : p.toFixed(p >= 10 ? 0 : 1);
      h += finding(s3.model.band === "high" ? "favorsEAS" : s3.model.band === "low" ? "favorsCD" : "indeterminate",
        `<strong>${L("Modelo de origen ectópico", "Ectopic origin model")}:</strong> ${dec(pt)} % · ${t(lang, { low: "bandLow", intermediate: "bandIntermediate", high: "bandHigh" }[s3.model.band])} <a href="../origen-ectopico/">${L("Detalle", "Details")} ›</a>`, ["rivera2026"]);
    } else if (modelStatus === "notApplicable") {
      h += note(t(lang, "modelNotApplicable"));
    } else if (modelStatus === "outOfRange") {
      h += note(t(lang, "modelOutOfRange"));
    } else {
      h += note(L("Para estimar el modelo de origen ectópico faltan: ", "To run the ectopic origin model, missing: ") + missingModel().join(", ") + ".");
    }
    h += conclusion(s3.conclusion.level, t(lang, s3.conclusion.code));
    s3.notes.forEach((n) => (h += note(t(lang, n))));
  }
  $("out3").innerHTML = h;

  // --- 4
  h = head("Interpretación", "Interpretation");
  if (!s4) h += empty("Introduzca el cortisol posoperatorio.", "Enter postoperative cortisol.");
  else {
    h += conclusion(s4.level, t(lang, s4.code, { v: withUnit(s4.value, s4.unit) })) + refsHtml(s4.refs);
    s4.notes.forEach((n) => (h += note(t(lang, n))));
  }
  $("out4").innerHTML = h;

  // --- Resumen
  const items = summaryItems(lang);
  $("sum-body").innerHTML = items.length
    ? `<ol style="margin:0;padding-left:20px">${items.map((i) => `<li style="margin-bottom:8px"><strong>${i.title}:</strong> ${i.text}</li>`).join("")}</ol>`
    : empty("Aún no hay resultados que resumir.", "No results to summarize yet.");
}

function missingModel() {
  const m = [];
  if (num("ufc") === null || !num("ufc-uln")) m.push(L("CLU y su LSN (paso 1)", "UFC and its ULN (step 1)"));
  if (num("acth") === null) m.push(L("ACTH (paso 2)", "ACTH (step 2)"));
  if (num("mri") === null) m.push(L("RM", "MRI"));
  if (num("k") === null) m.push(L("potasio nadir", "nadir potassium"));
  return m;
}

function summaryItems(lang) {
  const { s1, s2, s3, s3HasData, s4 } = state;
  const items = [];
  if (s1.tests.length) items.push({ title: L("Tamizaje", "Screening"), text: t(lang, s1.summary.code) });
  if (s2.code !== "acthNoData") items.push({ title: L("Dependencia de ACTH", "ACTH dependence"), text: t(lang, s2.code) });
  if (s3HasData) {
    let txt = t(lang, s3.conclusion.code);
    if (s3.model) {
      const p = s3.model.prob * 100;
      txt += ` ${L("Modelo de origen ectópico", "Ectopic origin model")}: ${p < 0.1 ? "< " + dec("0.1") : p > 99.9 ? "> " + dec("99.9") : dec(p.toFixed(1))} %.`;
    }
    items.push({ title: L("Origen", "Source"), text: txt });
  }
  if (s4) items.push({ title: L("Posoperatorio", "Postoperative"), text: t(lang, s4.code, { v: `${f(s4.value)} ${s4.unit}` }) });
  return items;
}

$("form").addEventListener("input", compute);
$("form").addEventListener("change", compute);
document.addEventListener("langchange", () => state && render(getLang()));
$("clear-all").addEventListener("click", () => { $("form").reset(); compute(); });

$("copy").addEventListener("click", async () => {
  const lang = getLang();
  const items = summaryItems(lang);
  if (!items.length) return;
  const txt = [L("Interpretación integrada — Cushing", "Integrated interpretation — Cushing"), ...items.map((i, n) => `${n + 1}. ${i.title}: ${i.text}`), L("Herramienta de apoyo; no sustituye el juicio clínico.", "Support tool; does not replace clinical judgement.")].join("\n");
  try {
    await navigator.clipboard.writeText(txt);
    const b = $("copy"), old = b.innerHTML;
    b.textContent = L("✓ Copiado", "✓ Copied");
    setTimeout(() => (b.innerHTML = old), 1500);
  } catch { /* portapapeles no disponible */ }
});

// Resaltar el paso visible en la barra lateral
const links = [...document.querySelectorAll(".side nav a")];
const obs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${e.target.id}`));
  });
}, { rootMargin: "-40% 0px -55% 0px" });
document.querySelectorAll(".tool-section").forEach((s) => obs.observe(s));

compute();
