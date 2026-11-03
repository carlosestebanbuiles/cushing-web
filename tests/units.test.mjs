import { test } from "node:test";
import assert from "node:assert/strict";
import { convert, timesULN, ANALYTES } from "../src/logic/units.js";

const close = (a, b, tol = 1e-3) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test("cortisol sérico: 1,8 µg/dL ≈ 50 nmol/L; 2 µg/dL ≈ 55 nmol/L; 5 µg/dL ≈ 138 nmol/L", () => {
  close(convert("serumCortisol", 1.8, "µg/dL", "nmol/L"), 49.66);
  close(convert("serumCortisol", 2, "µg/dL", "nmol/L"), 55.18);
  close(convert("serumCortisol", 5, "µg/dL", "nmol/L"), 137.95);
  close(convert("serumCortisol", 10, "µg/L", "µg/dL"), 1);
});

test("cortisol salival: 145 ng/dL ≈ 4 nmol/L", () => {
  close(convert("salivaryCortisol", 145, "ng/dL", "nmol/L"), 4.0, 5e-3);
  close(convert("salivaryCortisol", 1, "ng/mL", "ng/dL"), 100);
});

test("cortisol urinario: 1 µg/24 h = 2,759 nmol/24 h", () => {
  close(convert("urinaryCortisol", 1, "µg/24 h", "nmol/24 h"), 2.759);
  close(convert("urinaryCortisol", 0.05, "mg/24 h", "µg/24 h"), 50);
});

test("ACTH: 10 pg/mL ≈ 2,2 pmol/L; 20 pg/mL ≈ 4,4 pmol/L", () => {
  close(convert("acth", 10, "pg/mL", "pmol/L"), 2.202);
  close(convert("acth", 20, "pg/mL", "pmol/L"), 4.404);
  close(convert("acth", 7, "ng/L", "pg/mL"), 7);
});

test("glucosa: 100 mg/dL ≈ 5,55 mmol/L", () => {
  close(convert("glucose", 100, "mg/dL", "mmol/L"), 5.551);
});

test("ida y vuelta para todas las unidades", () => {
  for (const [name, a] of Object.entries(ANALYTES)) {
    for (const u of Object.keys(a.units)) close(convert(name, convert(name, 37.3, a.base, u), u, a.base), 37.3, 1e-9);
  }
});

test("×LSN con unidades mixtas", () => {
  close(timesULN("urinaryCortisol", 300, "µg/24 h", 50, "µg/24 h"), 6);
  close(timesULN("urinaryCortisol", 827.7, "nmol/24 h", 50, "µg/24 h"), 6);
  assert.ok(Number.isNaN(timesULN("urinaryCortisol", 100, "µg/24 h", 0)));
});
