// Puntos de corte y referencias usados por todas las herramientas.
// Cada criterio declara su fuente y su estado de verificación.
// status: "verified"  -> cifra comprobada en el texto de la fuente citada
//         "review"    -> cifra de uso habitual; requiere confirmación del equipo clínico
//
// Cutoffs and references used by every tool. Each criterion declares its
// source and verification status (see above).

export const REFERENCES = {
  nieman2008: {
    short: "Nieman 2008",
    full: "Nieman LK, Biller BMK, Findling JW, et al. The diagnosis of Cushing's syndrome: an Endocrine Society clinical practice guideline. J Clin Endocrinol Metab. 2008;93(5):1526-1540.",
    doi: "10.1210/jc.2008-0125",
  },
  fleseriu2021: {
    short: "Fleseriu 2021",
    full: "Fleseriu M, Auchus R, Bancos I, et al. Consensus on diagnosis and management of Cushing's disease: a guideline update. Lancet Diabetes Endocrinol. 2021;9(12):847-875.",
    doi: "10.1016/S2213-8587(21)00235-7",
  },
  nieman1993: {
    short: "Nieman 1993",
    full: "Nieman LK, Oldfield EH, Wesley R, et al. A simplified morning ovine corticotropin-releasing hormone stimulation test for the differential diagnosis of adrenocorticotropin-dependent Cushing's syndrome. J Clin Endocrinol Metab. 1993;77(5):1308-1312.",
    doi: "10.1210/jcem.77.5.8077325",
  },
  rivera2026: {
    short: "Rivera-Martínez 2026",
    full: "Rivera-Martínez WA, Builes-Montaño CE, Aristizábal Henao N, et al. Predictive model for the diagnosis of ectopic Cushing syndrome. Endocr Relat Cancer. 2026;33:e250348.",
    doi: "10.1530/ERC-25-0348",
  },
};

export const CRITERIA = {
  // --- Tamizaje / screening ---
  dst1mg: {
    abnormalAbove_ugdl: 1.8, // = 50 nmol/L (la guía da ambos valores; se compara en la unidad introducida)
    abnormalAbove_nmoll: 50,
    overtAbove_ugdl: 5.0, // = 138 nmol/L; nota descriptiva, sin efecto en la conclusión
    overtAbove_nmoll: 138,
    refs: ["nieman2008", "fleseriu2021"],
    status: "verified",
  },
  ufc: {
    abnormalAboveULN: 1, // > ULN del ensayo
    pseudoOverlapUpToULN: 3, // hipercortisolismo no neoplásico casi siempre <3×ULN
    refs: ["nieman2008", "fleseriu2021"],
    status: "verified",
  },
  lnsc: {
    abnormalAboveULN: 1, // > ULN del ensayo (Nieman 2008 cita 145 ng/dL = 4 nmol/L para su ensayo)
    refs: ["nieman2008"],
    status: "verified",
  },
  // --- Dependencia de ACTH / ACTH dependence ---
  acth: {
    independentBelow_pgml: 10, // < 10 pg/mL (2.2 pmol/L)
    dependentAbove_pgml: 20, // > 20 pg/mL (4.4 pmol/L); 10-20 indeterminado
    refs: ["fleseriu2021"],
    status: "review",
  },
  // --- Origen / origin ---
  stimulation: {
    // CRH o desmopresina: aumento porcentual sobre el basal
    acthRisePct: 35,
    cortisolRisePct: 20,
    refs: ["nieman1993", "fleseriu2021"],
    status: "review", // verificado para CRH ovino; la extensión a desmopresina requiere confirmación
  },
  hddst: {
    suppressionPct: 50, // supresión de cortisol > 50 % del basal favorece EC
    refs: ["fleseriu2021"],
    status: "review",
  },
  mri: {
    macroadenomaFrom_mm: 10, // >= 10 mm con pruebas dinámicas concordantes: no requiere CSPI
    smallBelow_mm: 6, // < 6 mm: realizar CSPI; 6-9 mm: la mayoría recomienda CSPI
    refs: ["fleseriu2021"],
    status: "verified",
  },
  ipss: {
    basalRatio: 2, // gradiente central:periférico >= 2 basal
    stimulatedRatio: 3, // >= 3 tras estímulo
    refs: ["fleseriu2021"],
    status: "verified",
  },
  // --- Posoperatorio / postoperative ---
  remission: {
    cortisolBelow_ugdl: 2, // < 2 µg/dL (55 nmol/L); se compara en la unidad introducida
    cortisolBelow_nmoll: 55,
    refs: ["fleseriu2021"],
    status: "verified",
  },
  // --- Modelo de origen ectópico / ectopic model ---
  ectopicBands: {
    // Umbrales operativos de la herramienta original (cushing-predictor)
    low: 0.05,
    high: 0.25,
    refs: ["rivera2026"],
    status: "review",
  },
};
