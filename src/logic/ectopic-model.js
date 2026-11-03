// Modelo de origen ectópico (Rivera-Martínez et al., Endocr Relat Cancer 2026; doi:10.1530/ERC-25-0348).
// Coeficientes y transformaciones idénticos a la herramienta original en R
// (github.com/carlosestebanbuiles/cushing-predictor, global.R y server.R):
//   lp = b0 + b1·ln(ACTH + 1) + b2·ln(UFC×ULN + 1) + b3·K + b4·diámetro
//   p  = 1 / (1 + e^(−lp))
//
// Ectopic-origin model; coefficients and transformations identical to the
// original R tool.

import { CRITERIA } from "./criteria.js";

export const MODEL = {
  id: "rivera2026-reduced",
  version: "1.0.0",
  coefficients: {
    intercept: -5.14695331,
    logActh: 3.09100154,
    logUfc: -0.03173828,
    potassium: -2.57720234,
    pituitarySize: -0.36923825,
  },
  // Rangos admitidos por la interfaz original (ui.R) y límites físicos razonables.
  limits: {
    acth: { min: 0, max: 5000, unit: "pg/mL" },
    ufc: { min: 0, max: 1000, unit: "×ULN" },
    potassium: { min: 1, max: 6, unit: "mmol/L" },
    pituitarySize: { min: 0, max: 30, unit: "mm" },
  },
};

export function validateInputs({ acth, ufc, potassium, pituitarySize }) {
  const errors = [];
  const check = (key, v) => {
    const l = MODEL.limits[key];
    if (v === null || v === undefined || v === "" || !Number.isFinite(Number(v))) errors.push({ field: key, code: "required" });
    else if (Number(v) < l.min || Number(v) > l.max) errors.push({ field: key, code: "range", min: l.min, max: l.max });
  };
  check("acth", acth);
  check("ufc", ufc);
  check("potassium", potassium);
  check("pituitarySize", pituitarySize);
  return errors;
}

export function linearPredictor({ acth, ufc, potassium, pituitarySize }) {
  const c = MODEL.coefficients;
  return (
    c.intercept +
    c.logActh * Math.log(acth + 1) +
    c.logUfc * Math.log(ufc + 1) +
    c.potassium * potassium +
    c.pituitarySize * pituitarySize
  );
}

export const logistic = (lp) => 1 / (1 + Math.exp(-lp));

export function band(prob) {
  const { low, high } = CRITERIA.ectopicBands;
  if (prob < low) return "low";
  if (prob < high) return "intermediate";
  return "high";
}

// Devuelve probabilidad, banda y la contribución de cada término al predictor lineal.
export function predict(inputs) {
  const x = {
    acth: Number(inputs.acth),
    ufc: Number(inputs.ufc),
    potassium: Number(inputs.potassium),
    pituitarySize: Number(inputs.pituitarySize),
  };
  const errors = validateInputs(x);
  if (errors.length) return { ok: false, errors };
  const c = MODEL.coefficients;
  const contributions = {
    intercept: c.intercept,
    acth: c.logActh * Math.log(x.acth + 1),
    ufc: c.logUfc * Math.log(x.ufc + 1),
    potassium: c.potassium * x.potassium,
    pituitarySize: c.pituitarySize * x.pituitarySize,
  };
  const lp = linearPredictor(x);
  const prob = logistic(lp);
  return { ok: true, inputs: x, lp, prob, band: band(prob), contributions };
}

// Curva de probabilidad al variar una variable, con las demás fijas.
export function sweep(inputs, variable, from, to, steps = 60) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const v = from + ((to - from) * i) / steps;
    const x = { ...inputs, [variable]: v };
    out.push({ x: v, p: logistic(linearPredictor(x)) });
  }
  return out;
}
