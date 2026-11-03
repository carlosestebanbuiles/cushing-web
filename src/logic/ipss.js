// Interpretación del cateterismo bilateral de senos petrosos inferiores (CSPI / BIPSS).
// Basado en la hoja "Interpretación cateterismo" del grupo, con las correcciones documentadas
// en evidencia/ (fórmulas de la relación normalizada y del gradiente intersinusal).
//
// Entrada:
//   times: etiquetas de los tiempos, el primero es el basal, p. ej. ["0", "3", "5", "10"]
//   acth:  { P: [...], R: [...], L: [...] }  ACTH periférica, seno derecho, seno izquierdo (misma unidad)
//   prl:   { P: [...], R: [...], L: [...] }  prolactina (opcional; como mínimo la basal)
// Las matrices van alineadas con `times`; los valores ausentes son null.

import { CRITERIA } from "./criteria.js";

const ok = (v) => v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v)) && Number(v) > 0;
const ratio = (a, b) => (ok(a) && ok(b) ? Number(a) / Number(b) : null);
const SIDES = ["R", "L"];

export function interpretIpssFull({ times = ["0", "3", "5", "10"], acth = {}, prl = {} } = {}) {
  const n = times.length;
  const get = (obj, side, i) => (obj[side] ? obj[side][i] : null);

  // 1. Gradiente central:periférico de ACTH por lado y tiempo
  const acthRatio = { R: [], L: [] };
  for (const s of SIDES) for (let i = 0; i < n; i++) acthRatio[s][i] = ratio(get(acth, s, i), get(acth, "P", i));

  const best = (from, to) => {
    let m = null;
    for (const s of SIDES) for (let i = from; i < to; i++) {
      const r = acthRatio[s][i];
      if (r !== null && (m === null || r > m.value)) m = { value: r, side: s, index: i };
    }
    return m;
  };
  const basalMax = best(0, 1);
  const stimMax = n > 1 ? best(1, n) : null;
  if (!basalMax && !stimMax) return { ok: false, code: "ipssNeedData" };

  const { basalRatio: bCut, stimulatedRatio: sCut } = CRITERIA.ipss;
  const central = (basalMax && basalMax.value >= bCut) || (stimMax && stimMax.value >= sCut);
  // Lado dominante: el de mayor gradiente tras estímulo (o basal si no hay estímulo).
  const dominant = stimMax || basalMax;

  // 2. Prolactina basal: calidad de la canulación (ipsilateral al lado dominante)
  const prlRatio = { R: ratio(get(prl, "R", 0), get(prl, "P", 0)), L: ratio(get(prl, "L", 0), get(prl, "P", 0)) };
  const { successFrom, failBelow } = CRITERIA.ipssProlactin;
  const cannulation = (r) => (r === null ? null : r >= successFrom ? "adequate" : r < failBelow ? "failed" : "doubtful");
  const prlStatus = { R: cannulation(prlRatio.R), L: cannulation(prlRatio.L) };
  const domPrl = prlRatio[dominant.side];
  const domPrlStatus = prlStatus[dominant.side];

  // 3. Relación ACTH normalizada por prolactina = ACTH IPS:P dominante / PRL IPS:P basal ipsilateral
  let normalized = null;
  if (domPrl !== null) {
    const v = dominant.value / domPrl;
    const { cdFrom, easAtMost } = CRITERIA.ipssNormalized;
    normalized = { value: v, side: dominant.side, level: v >= cdFrom ? "favorsCD" : v <= easAtMost ? "favorsEAS" : "indeterminate" };
  }

  // 4. Conclusión sobre el origen
  let conclusion;
  const notes = [];
  if (central) {
    conclusion = { level: "favorsCD", code: "ipssFullCentral" };
  } else if (domPrlStatus === "adequate") {
    conclusion = { level: "favorsEAS", code: "ipssFullNoGradientAdequate" };
    if (normalized && normalized.level === "favorsCD") { conclusion = { level: "indeterminate", code: "ipssFullNoGradientNormalizedCD" }; }
  } else if (domPrlStatus === "failed" || domPrlStatus === "doubtful") {
    if (normalized && normalized.level === "favorsCD") conclusion = { level: "favorsCD", code: "ipssFullFalseNegative" };
    else if (normalized && normalized.level === "favorsEAS") conclusion = { level: "favorsEAS", code: "ipssFullNoGradientNormalizedEAS" };
    else conclusion = { level: "indeterminate", code: "ipssFullUnreliable" };
  } else {
    conclusion = { level: "indeterminate", code: "ipssFullNoGradientNoPrl" };
  }
  if (!central && !stimMax) notes.push("ipssFullBasalOnly");
  notes.push("ipssFullHypercortisolemia");

  // 5. Lateralización (solo con origen hipofisario)
  let lateralization = null;
  if (central) {
    const cut = CRITERIA.ipssLateralization.intersinusFrom;
    const perTime = [];
    for (let i = 0; i < n; i++) {
      const r = get(acth, "R", i), l = get(acth, "L", i);
      if (!ok(r) || !ok(l)) { perTime.push(null); continue; }
      const raw = Number(r) >= Number(l) ? { value: r / l, side: "R" } : { value: l / r, side: "L" };
      let adj = null;
      const pr = get(prl, "R", i), pl = get(prl, "L", i);
      if (ok(pr) && ok(pl)) {
        const ar = r / pr, al = l / pl; // ACTH/PRL concurrente de cada lado
        adj = ar >= al ? { value: ar / al, side: "R" } : { value: al / ar, side: "L" };
      }
      perTime.push({ time: times[i], raw, adj });
    }
    const valid = perTime.filter(Boolean);
    const maxBy = (key) => valid.filter((t) => t[key]).reduce((m, t) => (m === null || t[key].value > m[key].value ? t : m), null);
    const rawMax = maxBy("raw");
    const adjMax = maxBy("adj");
    const sidesAbove = new Set(valid.filter((t) => t.raw.value >= cut).map((t) => t.raw.side));
    lateralization = {
      perTime,
      raw: rawMax ? { ...rawMax.raw, time: rawMax.time, lateralized: rawMax.raw.value >= cut } : null,
      adjusted: adjMax ? { ...adjMax.adj, time: adjMax.time, lateralized: adjMax.adj.value >= cut } : null,
      discordantOverTime: sidesAbove.size > 1,
      notes: ["ipssLatLimited"],
    };
  }

  return {
    ok: true,
    times,
    acthRatio,
    basalMax,
    stimMax,
    central,
    dominant,
    prlRatio,
    prlStatus,
    normalized,
    conclusion: { ...conclusion, refs: ["oldfield1991", "fleseriu2021", "findling2004", "sharma2011"] },
    notes,
    lateralization,
    refs: {
      gradient: CRITERIA.ipss.refs,
      prolactin: CRITERIA.ipssProlactin.refs,
      normalized: CRITERIA.ipssNormalized.refs,
      lateralization: CRITERIA.ipssLateralization.refs,
    },
  };
}
