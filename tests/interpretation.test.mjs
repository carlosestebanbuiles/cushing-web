import { test } from "node:test";
import assert from "node:assert/strict";
import {
  interpretScreening,
  interpretActh,
  interpretStimulation,
  interpretHddst,
  interpretMri,
  interpretIpss,
  interpretOrigin,
  interpretPostop,
} from "../src/logic/interpretation.js";
import { MESSAGES } from "../src/logic/messages.js";

test("tamizaje: combinaciones", () => {
  assert.equal(interpretScreening({}).summary.code, "screenNoData");
  assert.equal(interpretScreening({ ufcTimesULN: 4, dstCortisol_ugdl: 6 }).summary.code, "screenConcordantAbnormal");
  assert.equal(interpretScreening({ ufcTimesULN: 4 }).summary.code, "screenSingleAbnormal");
  assert.equal(interpretScreening({ ufcTimesULN: 4, lnscTimesULN: 0.8 }).summary.code, "screenDiscordant");
  assert.equal(interpretScreening({ ufcTimesULN: 0.7, lnscTimesULN: 0.8 }).summary.code, "screenConcordantNormal");
  assert.equal(interpretScreening({ dstCortisol_ugdl: 1.2 }).summary.code, "screenSingleNormal");
});

test("tamizaje: límites exactos", () => {
  assert.equal(interpretScreening({ dstCortisol_ugdl: 1.8 }).tests[0].abnormal, false);
  assert.equal(interpretScreening({ dstCortisol_ugdl: 1.81 }).tests[0].abnormal, true);
  assert.equal(interpretScreening({ ufcTimesULN: 1 }).tests[0].abnormal, false);
  assert.deepEqual(interpretScreening({ ufcTimesULN: 2.5 }).tests[0].notes, ["ufcPseudoOverlap"]);
  assert.deepEqual(interpretScreening({ ufcTimesULN: 3.5 }).tests[0].notes, []);
  assert.deepEqual(interpretScreening({ dstCortisol_ugdl: 5.5 }).tests[0].notes, ["dstOvert"]);
});

test("ACTH: <10 independiente, 10–20 indeterminado, >20 dependiente", () => {
  assert.equal(interpretActh({ acth_pgml: 9.9 }).code, "acthIndependent");
  assert.equal(interpretActh({ acth_pgml: 10 }).code, "acthIndeterminate");
  assert.equal(interpretActh({ acth_pgml: 20 }).code, "acthIndeterminate");
  assert.equal(interpretActh({ acth_pgml: 20.1 }).code, "acthDependent");
});

test("estímulo: porcentajes desde basal/pico", () => {
  const r = interpretStimulation({ acthBasal: 50, acthPeak: 80, cortisolBasal: 20, cortisolPeak: 25 });
  assert.equal(Math.round(r.acthRise), 60);
  assert.equal(Math.round(r.cortisolRise), 25);
  assert.equal(r.code, "stimPositive");
  assert.equal(interpretStimulation({ acthRisePct: 10, cortisolRisePct: 5 }).code, "stimNegative");
  assert.equal(interpretStimulation({ acthRisePct: 40, cortisolRisePct: 5 }).code, "stimPartial");
  assert.equal(interpretStimulation({ acthRisePct: 35 }).code, "stimPositive");
  assert.equal(interpretStimulation({}), null);
});

test("dexametasona dosis altas", () => {
  assert.equal(interpretHddst({ cortisolBasal: 20, cortisolAfter: 8 }).code, "hddstSuppressed");
  assert.equal(interpretHddst({ cortisolBasal: 20, cortisolAfter: 10 }).code, "hddstNotSuppressed");
});

test("RM: categorías", () => {
  assert.equal(interpretMri({ size_mm: 0 }).category, "none");
  assert.equal(interpretMri({ size_mm: 5.9 }).category, "small");
  assert.equal(interpretMri({ size_mm: 6 }).category, "mid");
  assert.equal(interpretMri({ size_mm: 10 }).category, "large");
});

test("cateterismo: gradientes", () => {
  assert.equal(interpretIpss({ basalRatio: 2 }).central, true);
  assert.equal(interpretIpss({ basalRatio: 1.5, stimulatedRatio: 3 }).central, true);
  assert.equal(interpretIpss({ basalRatio: 1.5, stimulatedRatio: 2.5 }).central, false);
});

test("origen: algoritmo del consenso", () => {
  assert.equal(interpretOrigin({ mri: { size_mm: 12 }, stimulation: { acthRisePct: 60, cortisolRisePct: 30 } }).conclusion.code, "originLargeConcordant");
  assert.equal(interpretOrigin({ mri: { size_mm: 12 } }).conclusion.code, "originLargeNeedsDynamic");
  assert.equal(interpretOrigin({ mri: { size_mm: 12 }, stimulation: { acthRisePct: 5, cortisolRisePct: 2 } }).conclusion.code, "originLargeDiscordant");
  assert.equal(interpretOrigin({ mri: { size_mm: 7 } }).conclusion.code, "originMidIpss");
  assert.equal(interpretOrigin({ mri: { size_mm: 0 } }).conclusion.code, "originSmallIpss");
  assert.equal(interpretOrigin({ mri: { size_mm: 0 }, ipss: { basalRatio: 1.2, stimulatedRatio: 1.5 } }).conclusion.code, "originIpssEAS");
  assert.equal(interpretOrigin({}).conclusion.code, "originNeedsMri");
});

test("origen: el modelo añade notas y alerta de discordancia", () => {
  const high = { acth: 250, ufc: 40, potassium: 2.6, pituitarySize: 0 };
  const r = interpretOrigin({ mri: { size_mm: 0 }, ectopicInputs: high });
  assert.ok(r.notes.includes("originModelHigh"));
  const d = interpretOrigin({ mri: { size_mm: 0 }, ipss: { basalRatio: 3 }, ectopicInputs: high });
  assert.ok(d.notes.includes("originModelDiscordantHigh"));
  assert.ok(!d.notes.includes("originModelHigh"), "no debe sugerir imagen corporal si el cateterismo indica origen hipofisario");
  const low = { acth: 40, ufc: 3, potassium: 4.3, pituitarySize: 0 };
  const e = interpretOrigin({ mri: { size_mm: 0 }, ipss: { basalRatio: 1.2, stimulatedRatio: 1.5 }, ectopicInputs: low });
  assert.ok(e.notes.includes("originModelDiscordantLow"));
});

test("origen: la concordancia exige prueba de estímulo positiva (revisión)", () => {
  // Solo HDDST positiva: no basta para omitir el cateterismo
  assert.equal(interpretOrigin({ mri: { size_mm: 12 }, hddst: { suppressionPct: 80 } }).conclusion.code, "originLargeNeedsDynamic");
  // Respuesta parcial al estímulo: discordante
  assert.equal(interpretOrigin({ mri: { size_mm: 12 }, stimulation: { acthRisePct: 40, cortisolRisePct: 5 } }).conclusion.code, "originLargeDiscordant");
  // Estímulo positivo pero HDDST sin supresión: discordante
  assert.equal(interpretOrigin({ mri: { size_mm: 12 }, stimulation: { acthRisePct: 60, cortisolRisePct: 30 }, hddst: { suppressionPct: 10 } }).conclusion.code, "originLargeDiscordant");
  // Estímulo positivo y HDDST con supresión: concordante
  assert.equal(interpretOrigin({ mri: { size_mm: 12 }, stimulation: { acthRisePct: 60, cortisolRisePct: 30 }, hddst: { suppressionPct: 80 } }).conclusion.code, "originLargeConcordant");
});

test("cateterismo solo basal sin gradiente: no concluye origen ectópico", () => {
  const r = interpretOrigin({ mri: { size_mm: 0 }, ipss: { basalRatio: 1.4 } });
  assert.equal(r.conclusion.code, "originIpssBasalOnly");
  assert.equal(r.ipss.level, "indeterminate");
  assert.equal(interpretOrigin({ mri: { size_mm: 0 }, ipss: { basalRatio: 2.5 } }).conclusion.code, "originIpssCD");
});

test("límites exactos en nmol/L se comparan en la unidad introducida", () => {
  assert.equal(interpretScreening({ dstCortisol: 50, dstUnit: "nmol/L" }).tests[0].abnormal, false);
  assert.equal(interpretScreening({ dstCortisol: 51, dstUnit: "nmol/L" }).tests[0].abnormal, true);
  assert.equal(interpretPostop({ cortisol: 55, unit: "nmol/L" }).remission, false);
  assert.equal(interpretPostop({ cortisol: 54, unit: "nmol/L" }).remission, true);
});

test("posoperatorio", () => {
  assert.equal(interpretPostop({ cortisol_ugdl: 1.5 }).remission, true);
  assert.equal(interpretPostop({ cortisol_ugdl: 2 }).remission, false);
});

test("todos los códigos tienen texto en ES y EN", () => {
  const es = Object.keys(MESSAGES.es).sort();
  const en = Object.keys(MESSAGES.en).sort();
  assert.deepEqual(es, en);
});
