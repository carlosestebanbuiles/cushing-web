// Conversión de unidades. Cada analito tiene una unidad base (factor 1);
// los demás factores expresan cuántas unidades base equivalen a 1 unidad.
// Unit conversion. Each analyte has a base unit (factor 1); other factors
// express how many base units equal 1 of that unit.
//
// Masas molares: cortisol 362.46 g/mol; ACTH(1-39) 4541 g/mol; glucosa 180.16 g/mol.

const CORTISOL_NMOL_PER_UGDL = 10000 / 362.46; // 27.59
const ACTH_PMOL_PER_PGML = 1000 / 4541; // 0.2202
const GLUCOSE_MMOL_PER_MGDL = 10 / 180.16; // 0.0555

export const ANALYTES = {
  serumCortisol: {
    units: {
      "µg/dL": 1,
      "nmol/L": 1 / CORTISOL_NMOL_PER_UGDL,
      "µg/L": 0.1,
    },
    base: "µg/dL",
  },
  salivaryCortisol: {
    units: {
      "ng/dL": 1,
      "nmol/L": 1000 / CORTISOL_NMOL_PER_UGDL, // 1 nmol/L = 36.25 ng/dL
      "µg/dL": 1000,
      "ng/mL": 100,
    },
    base: "ng/dL",
  },
  urinaryCortisol: {
    units: {
      "µg/24 h": 1,
      "nmol/24 h": 1 / (CORTISOL_NMOL_PER_UGDL / 10), // 1 µg = 2.759 nmol
      "mg/24 h": 1000,
    },
    base: "µg/24 h",
  },
  acth: {
    units: {
      "pg/mL": 1,
      "ng/L": 1,
      "pmol/L": 1 / ACTH_PMOL_PER_PGML,
    },
    base: "pg/mL",
  },
  potassium: {
    units: { "mmol/L": 1, "mEq/L": 1 },
    base: "mmol/L",
  },
  glucose: {
    units: { "mg/dL": 1, "mmol/L": 1 / GLUCOSE_MMOL_PER_MGDL },
    base: "mg/dL",
  },
};

export function convert(analyte, value, from, to) {
  const a = ANALYTES[analyte];
  if (!a) throw new Error(`Unknown analyte: ${analyte}`);
  const f = a.units[from];
  const t = a.units[to];
  if (f === undefined || t === undefined) throw new Error(`Unknown unit for ${analyte}: ${from} / ${to}`);
  if (!Number.isFinite(value)) return NaN;
  return (value * f) / t;
}

export function convertAll(analyte, value, from) {
  const a = ANALYTES[analyte];
  return Object.keys(a.units).map((u) => ({ unit: u, value: convert(analyte, value, from, u) }));
}

// Resultado como múltiplo del límite superior de normalidad (×LSN / ×ULN).
// Admite unidades distintas para resultado y límite.
export function timesULN(analyte, value, valueUnit, uln, ulnUnit = valueUnit) {
  if (!(uln > 0) || !Number.isFinite(value) || value < 0) return NaN;
  return value / convert(analyte, uln, ulnUnit, valueUnit);
}

// Redondeo con cifras significativas razonables para mostrar.
export function fmt(x, digits = 3) {
  if (!Number.isFinite(x)) return "—";
  if (x === 0) return "0";
  const abs = Math.abs(x);
  const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : abs >= 1 ? 2 : Math.min(4, digits - Math.floor(Math.log10(abs)) - 1);
  return x.toFixed(Math.max(0, decimals));
}
