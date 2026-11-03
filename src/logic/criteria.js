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
  oldfield1991: {
    short: "Oldfield 1991",
    full: "Oldfield EH, Doppman JL, Nieman LK, et al. Petrosal sinus sampling with and without corticotropin-releasing hormone for the differential diagnosis of Cushing's syndrome. N Engl J Med. 1991;325(13):897-905.",
    doi: "10.1056/NEJM199109263251301",
  },
  findling2004: {
    short: "Findling 2004",
    full: "Findling JW, Kehoe ME, Raff H. Identification of patients with Cushing's disease with negative pituitary adrenocorticotropin gradients during inferior petrosal sinus sampling: prolactin as an index of pituitary venous effluent. J Clin Endocrinol Metab. 2004;89(12):6005-6009.",
    doi: "10.1210/jc.2004-1378",
  },
  sharma2011: {
    short: "Sharma 2011",
    full: "Sharma ST, Raff H, Nieman LK. Prolactin as a marker of successful catheterization during IPSS in patients with ACTH-dependent Cushing's syndrome. J Clin Endocrinol Metab. 2011;96(12):3687-3694.",
    url: "https://pubmed.ncbi.nlm.nih.gov/22031511/",
  },
  mulligan2012: {
    short: "Mulligan 2012",
    full: "Mulligan GB, Faiman C, Gupta M, et al. Prolactin measurement during inferior petrosal sinus sampling improves the localization of pituitary adenomas in Cushing's disease. Clin Endocrinol (Oxf). 2012;77(2):268-274.",
    doi: "10.1111/j.1365-2265.2012.04339.x",
  },
  rivera2026: {
    short: "Rivera-Martínez 2026",
    full: "Rivera-Martínez WA, Builes-Montaño CE, Aristizábal Henao N, et al. Predictive model for the diagnosis of ectopic Cushing syndrome. Endocr Relat Cancer. 2026;33:e250348.",
    doi: "10.1530/ERC-25-0348",
  },
};

// Enlace de una referencia: DOI si existe; si no, URL (p. ej. PubMed).
export const refUrl = (r) => (r.doi ? `https://doi.org/${r.doi}` : r.url);

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
    refs: ["fleseriu2021", "oldfield1991"],
    status: "verified",
  },
  // --- Cateterismo de senos petrosos: prolactina y lateralización ---
  ipssProlactin: {
    successFrom: 1.8, // IPS:P prolactina basal ≥ 1,8 (ipsilateral al gradiente de ACTH dominante): canulación adecuada
    failBelow: 1.2, // < 1,2 en los casos con canulación fallida de Findling 2004
    refs: ["findling2004", "sharma2011"],
    status: "verified",
  },
  ipssNormalized: {
    cdFrom: 1.3, // ACTH IPS:P dominante / prolactina IPS:P basal ipsilateral ≥ 1,3: enfermedad de Cushing
    easAtMost: 0.7, // ≤ 0,7: secreción ectópica; 0,7–1,3: no diagnóstico
    refs: ["sharma2011"],
    status: "verified",
  },
  ipssLateralization: {
    intersinusFrom: 1.4, // gradiente intersinusal de ACTH (o ajustado por prolactina) ≥ 1,4
    refs: ["oldfield1991", "mulligan2012"],
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
