// Interpretación integrada de resultados. Funciones puras: reciben números
// (ya en unidades base) y devuelven códigos de hallazgo + nivel + referencias.
// El texto ES/EN de cada código está en messages.js.
//
// Integrated interpretation. Pure functions: numbers in (base units),
// finding codes + level + references out. ES/EN text lives in messages.js.
//
// Niveles / levels: "normal" | "abnormal" | "indeterminate" | "info" | "favorsCD" | "favorsEAS"

import { CRITERIA } from "./criteria.js";
import { predict as predictEctopic } from "./ectopic-model.js";

const has = (v) => v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));
const pct = (basal, peak) => ((peak - basal) / basal) * 100;

// ---------- 1. Tamizaje: ¿hay hipercortisolismo? ----------
// inputs: { ufcTimesULN, lnscTimesULN, dstCortisol_ugdl }
// DST: dstCortisol + dstUnit ("µg/dL" | "nmol/L"); se compara con el punto de corte
// publicado en esa misma unidad (1,8 µg/dL = 50 nmol/L) para evitar errores de redondeo.
export function interpretScreening({ ufcTimesULN, lnscTimesULN, dstCortisol_ugdl, dstCortisol, dstUnit = "µg/dL" } = {}) {
  if (has(dstCortisol_ugdl) && !has(dstCortisol)) { dstCortisol = dstCortisol_ugdl; dstUnit = "µg/dL"; }
  const tests = [];

  if (has(ufcTimesULN)) {
    const v = Number(ufcTimesULN);
    const abnormal = v > CRITERIA.ufc.abnormalAboveULN;
    const notes = [];
    if (abnormal && v <= CRITERIA.ufc.pseudoOverlapUpToULN) notes.push("ufcPseudoOverlap");
    tests.push({ test: "ufc", value: v, abnormal, code: abnormal ? "ufcAbnormal" : "ufcNormal", notes, refs: CRITERIA.ufc.refs });
  }
  if (has(lnscTimesULN)) {
    const v = Number(lnscTimesULN);
    const abnormal = v > CRITERIA.lnsc.abnormalAboveULN;
    tests.push({ test: "lnsc", value: v, abnormal, code: abnormal ? "lnscAbnormal" : "lnscNormal", notes: [], refs: CRITERIA.lnsc.refs });
  }
  if (has(dstCortisol)) {
    const v = Number(dstCortisol);
    const nmol = dstUnit === "nmol/L";
    const cut = nmol ? CRITERIA.dst1mg.abnormalAbove_nmoll : CRITERIA.dst1mg.abnormalAbove_ugdl;
    const overt = nmol ? CRITERIA.dst1mg.overtAbove_nmoll : CRITERIA.dst1mg.overtAbove_ugdl;
    const abnormal = v > cut;
    const notes = [];
    if (v > overt) notes.push("dstOvert");
    tests.push({ test: "dst", value: v, unit: dstUnit, abnormal, code: abnormal ? "dstAbnormal" : "dstNormal", notes, refs: CRITERIA.dst1mg.refs });
  }

  const nAbn = tests.filter((t) => t.abnormal).length;
  const nNorm = tests.length - nAbn;
  let summary;
  if (tests.length === 0) summary = { level: "info", code: "screenNoData" };
  else if (nAbn >= 2) summary = { level: "abnormal", code: "screenConcordantAbnormal" };
  else if (nAbn === 1 && nNorm === 0) summary = { level: "indeterminate", code: "screenSingleAbnormal" };
  else if (nAbn === 1) summary = { level: "indeterminate", code: "screenDiscordant" };
  else if (nNorm >= 2) summary = { level: "normal", code: "screenConcordantNormal" };
  else summary = { level: "indeterminate", code: "screenSingleNormal" };

  const notes = [];
  if (nAbn >= 2 && nNorm >= 1) notes.push("screenMixed");
  if (tests.length) notes.push("screenCaveats");
  return { tests, summary: { ...summary, refs: ["nieman2008", "fleseriu2021"] }, notes, hypercortisolism: nAbn >= 2 };
}

// ---------- 2. ¿ACTH-dependiente? ----------
export function interpretActh({ acth_pgml } = {}) {
  if (!has(acth_pgml)) return { level: "info", code: "acthNoData", refs: [] };
  const v = Number(acth_pgml);
  const { independentBelow_pgml: lo, dependentAbove_pgml: hi } = CRITERIA.acth;
  let level, code;
  if (v < lo) [level, code] = ["info", "acthIndependent"];
  else if (v > hi) [level, code] = ["info", "acthDependent"];
  else [level, code] = ["indeterminate", "acthIndeterminate"];
  return { value: v, level, code, dependent: v > hi, refs: CRITERIA.acth.refs };
}

// ---------- 3. Origen en Cushing ACTH-dependiente ----------
// Prueba de estímulo (CRH o desmopresina): basal y pico de ACTH y cortisol,
// o bien porcentajes de aumento ya calculados.
export function interpretStimulation({ acthBasal, acthPeak, cortisolBasal, cortisolPeak, acthRisePct, cortisolRisePct } = {}) {
  let a = has(acthRisePct) ? Number(acthRisePct) : has(acthBasal) && has(acthPeak) && Number(acthBasal) > 0 ? pct(Number(acthBasal), Number(acthPeak)) : null;
  let c = has(cortisolRisePct) ? Number(cortisolRisePct) : has(cortisolBasal) && has(cortisolPeak) && Number(cortisolBasal) > 0 ? pct(Number(cortisolBasal), Number(cortisolPeak)) : null;
  if (a === null && c === null) return null;
  const { acthRisePct: aCut, cortisolRisePct: cCut } = CRITERIA.stimulation;
  const aPos = a === null ? null : a >= aCut;
  const cPos = c === null ? null : c >= cCut;
  const results = [aPos, cPos].filter((x) => x !== null);
  let level, code;
  if (results.every((x) => x)) [level, code] = ["favorsCD", "stimPositive"];
  else if (results.every((x) => !x)) [level, code] = ["favorsEAS", "stimNegative"];
  else [level, code] = ["indeterminate", "stimPartial"];
  return { acthRise: a, cortisolRise: c, acthPositive: aPos, cortisolPositive: cPos, positive: level === "favorsCD", negative: level === "favorsEAS", level, code, refs: CRITERIA.stimulation.refs };
}

export function interpretHddst({ cortisolBasal, cortisolAfter, suppressionPct } = {}) {
  const s = has(suppressionPct) ? Number(suppressionPct) : has(cortisolBasal) && has(cortisolAfter) && Number(cortisolBasal) > 0 ? -pct(Number(cortisolBasal), Number(cortisolAfter)) : null;
  if (s === null) return null;
  const pos = s > CRITERIA.hddst.suppressionPct;
  return { suppression: s, positive: pos, level: pos ? "favorsCD" : "favorsEAS", code: pos ? "hddstSuppressed" : "hddstNotSuppressed", notes: ["hddstLowAccuracy"], refs: CRITERIA.hddst.refs };
}

export function interpretMri({ size_mm } = {}) {
  if (!has(size_mm)) return null;
  const s = Number(size_mm);
  const { macroadenomaFrom_mm: big, smallBelow_mm: small } = CRITERIA.mri;
  let category, code;
  if (s >= big) [category, code] = ["large", "mriLarge"];
  else if (s >= small) [category, code] = ["mid", "mriMid"];
  else if (s > 0) [category, code] = ["small", "mriSmall"];
  else [category, code] = ["none", "mriNone"];
  return { size: s, category, level: "info", code, refs: CRITERIA.mri.refs };
}

// Cateterismo de senos petrosos: se usa el mayor gradiente de ambos lados.
export function interpretIpss({ basalRatio, stimulatedRatio } = {}) {
  const b = has(basalRatio) ? Number(basalRatio) : null;
  const s = has(stimulatedRatio) ? Number(stimulatedRatio) : null;
  if (b === null && s === null) return null;
  const { basalRatio: bCut, stimulatedRatio: sCut } = CRITERIA.ipss;
  const central = (b !== null && b >= bCut) || (s !== null && s >= sCut);
  if (!central && s === null) {
    // Solo basal y sin gradiente: menos sensible; no concluir origen ectópico.
    return { basal: b, stimulated: s, central: false, basalOnly: true, level: "indeterminate", code: "ipssBasalOnlyNegative", notes: ["ipssProlactin", "ipssHypercortisolemic"], refs: CRITERIA.ipss.refs };
  }
  return {
    basal: b,
    stimulated: s,
    central,
    level: central ? "favorsCD" : "favorsEAS",
    code: central ? "ipssCentral" : "ipssNoGradient",
    notes: central ? ["ipssNoLateralization"] : ["ipssProlactin", "ipssHypercortisolemic"],
    refs: CRITERIA.ipss.refs,
  };
}

// Integra los hallazgos de origen siguiendo el algoritmo del consenso
// (Fleseriu 2021) y añade el modelo de Rivera-Martínez 2026 como apoyo.
export function interpretOrigin({ mri, stimulation, hddst, ipss, ectopicInputs } = {}) {
  const m = mri ? interpretMri(mri) : null;
  const st = stimulation ? interpretStimulation(stimulation) : null;
  const hd = hddst ? interpretHddst(hddst) : null;
  const ip = ipss ? interpretIpss(ipss) : null;

  let model = null;
  if (ectopicInputs) {
    const r = predictEctopic(ectopicInputs);
    if (r.ok) model = r;
  }

  // Concordancia según el consenso: requiere prueba de estímulo (CRH y/o desmopresina)
  // positiva; la supresión con dosis altas sola no basta. Una respuesta parcial,
  // un estímulo negativo o una HDDST sin supresión se consideran discordantes.
  const stimDiscordant = st && !st.positive;
  const hdDiscordant = hd && !hd.positive;
  const dynamicConcordantCD = Boolean(st && st.positive && !hdDiscordant);

  let conclusion;
  if (ip && ip.basalOnly) {
    conclusion = { level: "indeterminate", code: "originIpssBasalOnly" };
  } else if (ip) {
    conclusion = ip.central
      ? { level: "favorsCD", code: "originIpssCD" }
      : { level: "favorsEAS", code: "originIpssEAS" };
  } else if (m && m.category === "large" && dynamicConcordantCD) {
    conclusion = { level: "favorsCD", code: "originLargeConcordant" };
  } else if (m && m.category === "large") {
    conclusion = { level: "indeterminate", code: stimDiscordant || (st && hdDiscordant) ? "originLargeDiscordant" : "originLargeNeedsDynamic" };
  } else if (m && m.category === "mid") {
    conclusion = { level: "indeterminate", code: "originMidIpss" };
  } else if (m) {
    conclusion = { level: "indeterminate", code: "originSmallIpss" };
  } else {
    conclusion = { level: "info", code: "originNeedsMri" };
  }

  const notes = [];
  if (!ip && m && m.category !== "large") notes.push("originNoninvasiveAlt");
  if (model) {
    const fromIpss = ip && !ip.basalOnly;
    if (fromIpss && ip.central && model.band === "high") notes.push("originModelDiscordantHigh");
    else if (fromIpss && !ip.central && model.band === "low") notes.push("originModelDiscordantLow");
    else if (!fromIpss && conclusion.level === "favorsCD" && model.band === "high") notes.push("originModelDiscordantHigh");
    else if (!fromIpss && model.band === "high") notes.push("originModelHigh");
    else if (!fromIpss && model.band === "low") notes.push("originModelLow");
  }

  return {
    mri: m,
    stimulation: st,
    hddst: hd,
    ipss: ip,
    model,
    conclusion: { ...conclusion, refs: ["fleseriu2021"] },
    notes,
  };
}

// ---------- 4. Posoperatorio ----------
export function interpretPostop({ cortisol_ugdl, cortisol, unit = "µg/dL" } = {}) {
  if (has(cortisol_ugdl) && !has(cortisol)) { cortisol = cortisol_ugdl; unit = "µg/dL"; }
  if (!has(cortisol)) return null;
  const v = Number(cortisol);
  const cut = unit === "nmol/L" ? CRITERIA.remission.cortisolBelow_nmoll : CRITERIA.remission.cortisolBelow_ugdl;
  const remission = v < cut;
  return { value: v, unit, remission, level: remission ? "normal" : "indeterminate", code: remission ? "postopRemission" : "postopNotYet", notes: ["postopCaveats"], refs: CRITERIA.remission.refs };
}
