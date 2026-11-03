// Valores de referencia calculados de forma independiente (Python, misma
// fórmula que global.R/server.R de cushing-predictor).
import { test } from "node:test";
import assert from "node:assert/strict";
import { predict, band, validateInputs, sweep } from "../src/logic/ectopic-model.js";

const REF = [
  // acth, ufc×ULN, K, size_mm, probability
  [50, 5, 3.2, 0, 0.214571051136839],
  [100, 3, 4.0, 8, 0.01494497111154923],
  [250, 40, 2.6, 0, 0.9940218127245932],
  [54, 3.3, 4.2, 6, 0.002882376758059681],
  [192, 39.5, 2.7, 0, 0.9827765659015397],
  [10, 1, 4.5, 12, 1.0306455659839867e-6],
  [0, 0, 3.5, 0, 7.035251554053655e-7],
];

test("probabilidades idénticas a la implementación de referencia", () => {
  for (const [acth, ufc, potassium, pituitarySize, expected] of REF) {
    const r = predict({ acth, ufc, potassium, pituitarySize });
    assert.equal(r.ok, true);
    assert.ok(Math.abs(r.prob - expected) < 1e-12, `${acth},${ufc},${potassium},${pituitarySize}: ${r.prob} vs ${expected}`);
  }
});

test("las contribuciones suman el predictor lineal", () => {
  const r = predict({ acth: 120, ufc: 12, potassium: 3.1, pituitarySize: 4 });
  const sum = Object.values(r.contributions).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - r.lp) < 1e-12);
});

test("bandas según umbrales 0.05 y 0.25 de la herramienta original", () => {
  assert.equal(band(0.049), "low");
  assert.equal(band(0.05), "intermediate");
  assert.equal(band(0.2499), "intermediate");
  assert.equal(band(0.25), "high");
});

test("validación de entradas", () => {
  assert.deepEqual(validateInputs({ acth: 50, ufc: 5, potassium: 3.2, pituitarySize: 0 }), []);
  const e = validateInputs({ acth: "", ufc: -1, potassium: 9, pituitarySize: 0 });
  assert.deepEqual(e.map((x) => [x.field, x.code]), [["acth", "required"], ["ufc", "range"], ["potassium", "range"]]);
  assert.equal(predict({ acth: 50, ufc: 5, potassium: 0.5, pituitarySize: 0 }).ok, false);
});

test("ACTH = 0 y UFC = 0 no producen infinitos (transformación ln(x+1))", () => {
  const r = predict({ acth: 0, ufc: 0, potassium: 4, pituitarySize: 0 });
  assert.ok(Number.isFinite(r.lp));
});

test("monotonía: más ACTH sube la probabilidad; más potasio y tumor mayor la bajan", () => {
  const base = { acth: 80, ufc: 10, potassium: 3.5, pituitarySize: 3 };
  const inc = (v) => v.every((p, i) => i === 0 || p.p >= v[i - 1].p);
  const dec = (v) => v.every((p, i) => i === 0 || p.p <= v[i - 1].p);
  assert.ok(inc(sweep(base, "acth", 0, 500)));
  assert.ok(dec(sweep(base, "potassium", 1, 6)));
  assert.ok(dec(sweep(base, "pituitarySize", 0, 30)));
});
