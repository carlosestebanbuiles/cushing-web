import { test } from "node:test";
import assert from "node:assert/strict";
import { interpretIpssFull } from "../src/logic/ipss.js";

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} vs ${b}`);
const T = ["0", "3", "5", "10"];

// Caso típico de enfermedad de Cushing, lateralizada a la derecha
const CD = {
  times: T,
  acth: { P: [50, 70, 80, 75], R: [400, 1500, 1800, 1200], L: [120, 300, 380, 260] },
  prl: { P: [10, 10, 10, 10], R: [40, 42, 41, 40], L: [30, 30, 31, 30] },
};

test("gradientes central:periférico y lado dominante", () => {
  const r = interpretIpssFull(CD);
  close(r.acthRatio.R[0], 8);
  close(r.basalMax.value, 8);
  close(r.stimMax.value, 1800 / 80);
  assert.equal(r.dominant.side, "R");
  assert.equal(r.central, true);
  assert.equal(r.conclusion.code, "ipssFullCentral");
});

test("prolactina: canulación adecuada ≥ 1,8; fallida < 1,2", () => {
  const r = interpretIpssFull(CD);
  close(r.prlRatio.R, 4);
  assert.equal(r.prlStatus.R, "adequate");
  const f = interpretIpssFull({ ...CD, prl: { P: [10], R: [11], L: [15] } });
  assert.equal(f.prlStatus.R, "failed");
  assert.equal(f.prlStatus.L, "doubtful");
});

test("relación normalizada = ACTH IPS:P dominante / PRL IPS:P basal ipsilateral (Sharma 2011)", () => {
  const r = interpretIpssFull(CD);
  close(r.normalized.value, (1800 / 80) / 4);
  assert.equal(r.normalized.side, "R");
});

test("la hoja original tenía mal la fórmula de L12–L14 (corregido)", () => {
  // Hoja: L14 = (D14/D7)/(C11/C3) usaba la ACTH basal del seno DERECHO (D7) como denominador
  // en vez de la periférica a 10 min (D6). Con estos datos la diferencia es grande.
  const sheetBug = (CD.acth.L[3] / CD.acth.R[0]) / (CD.prl.L[0] / CD.prl.P[0]);
  const correct = (CD.acth.L[3] / CD.acth.P[3]) / (CD.prl.L[0] / CD.prl.P[0]);
  assert.ok(Math.abs(sheetBug - correct) > 0.5); // 0,22 frente a 1,16
});

test("lateralización: gradiente intersinusal de ACTH (no de prolactina) y ajustado por prolactina", () => {
  const r = interpretIpssFull(CD);
  assert.equal(r.lateralization.raw.side, "R");
  close(r.lateralization.raw.value, 1500 / 300); // máximo a los 3 min
  assert.equal(r.lateralization.raw.lateralized, true);
  // Ajustado: (ACTH_R/PRL_R)/(ACTH_L/PRL_L) con prolactina concurrente
  const t5 = r.lateralization.perTime[2];
  close(t5.adj.value, (1800 / 41) / (380 / 31));
});

test("sin gradiente con canulación adecuada: orienta a ectópico", () => {
  const r = interpretIpssFull({
    times: T,
    acth: { P: [300, 310, 305, 300], R: [330, 350, 340, 335], L: [320, 330, 320, 318] },
    prl: { P: [10], R: [30], L: [25] },
  });
  assert.equal(r.central, false);
  assert.equal(r.conclusion.code, "ipssFullNoGradientAdequate");
  assert.equal(r.normalized.level, "favorsEAS");
  assert.equal(r.lateralization, null);
});

test("sin gradiente con canulación fallida y normalizada ≥ 1,3: falso negativo probable (Findling 2004)", () => {
  const r = interpretIpssFull({
    times: T,
    acth: { P: [100, 110, 115, 110], R: [150, 220, 240, 200], L: [110, 120, 118, 115] },
    prl: { P: [10], R: [11], L: [10.5] },
  });
  assert.equal(r.central, false);
  assert.equal(r.prlStatus.R, "failed");
  assert.ok(r.normalized.value >= 1.3);
  assert.equal(r.conclusion.code, "ipssFullFalseNegative");
});

test("sin gradiente y sin prolactina: no concluyente", () => {
  const r = interpretIpssFull({ times: T, acth: { P: [100, 100, 100, 100], R: [120, 130, 125, 120], L: [110, 115, 112, 110] } });
  assert.equal(r.conclusion.code, "ipssFullNoGradientNoPrl");
});

test("solo basal: nota de menor sensibilidad", () => {
  const r = interpretIpssFull({ times: ["0"], acth: { P: [100], R: [150], L: [120] }, prl: { P: [10], R: [30], L: [25] } });
  assert.ok(r.notes.includes("ipssFullBasalOnly"));
});

test("sin datos suficientes", () => {
  assert.equal(interpretIpssFull({ acth: { P: [100] } }).ok, false);
});
