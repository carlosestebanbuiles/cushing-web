// Estructura común: cabecera, pie, idioma y aviso profesional.
// Shared layout: header, footer, language and professional notice.

const ROOT = document.body.dataset.root || "./";
const PAGE = document.body.dataset.page || "";
// Sitio de pacientes: cabecera, menú y pie propios; sin enlaces a las herramientas.
const PATIENTS = document.body.dataset.site === "patients";

// ---------- Iconos (trazo, 24×24) / icons ----------
const P = {
  calculator: '<rect x="4" y="3" width="16" height="18" rx="2"/><rect x="8" y="7" width="8" height="3" rx="1"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01M16 17h.01"/>',
  flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/>',
  exchange: '<path d="M7 10h14l-4-4M17 14H3l4 4"/>',
  route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H12"/>',
  book: '<path d="M3 19a9 9 0 0 1 9 0 9 9 0 0 1 9 0V6a9 9 0 0 0-9 0 9 9 0 0 0-9 0z"/><path d="M12 6v13"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>',
  alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2.6 17.3A2 2 0 0 0 4.3 20.3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  file: '<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/><path d="M9 13h6M9 17h6"/>',
  shield: '<path d="M12 3a12 12 0 0 0 8.5 3A12 12 0 0 1 12 21 12 12 0 0 1 3.5 6 12 12 0 0 0 12 3"/><path d="m9 12 2 2 4-4"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  stethoscope: '<path d="M6 4H5a2 2 0 0 0-2 2v3.5a5.5 5.5 0 0 0 11 0V6a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 1 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  printer: '<path d="M17 17h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2"/><path d="M17 9V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v4"/><rect x="7" y="13" width="10" height="8" rx="2"/>',
  history: '<path d="M12 8v4l2 2"/><path d="M3.05 11a9 9 0 1 1 .5 4M3 20v-5h5"/>',
  users: '<circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 3.1a4 4 0 0 1 0 7.8M21 21v-2a4 4 0 0 0-3-3.9"/>',
  pulse: '<path d="M3 12h4l3 8 4-16 3 8h4"/>',
  scan: '<path d="M4 8V6a2 2 0 0 1 2-2h2M4 16v2a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v2M16 20h2a2 2 0 0 0 2-2v-2"/><circle cx="12" cy="12" r="3"/>',
  refresh: '<path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"/>',
  scale: '<path d="M7 20h10M12 4v16M5 8h14M5 8l-3 7a4 4 0 0 0 6 0zM19 8l-3 7a4 4 0 0 0 6 0z"/>',
};
export function icon(name, cls = "") {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ""}</svg>`;
}

const LOGO = `<svg viewBox="0 0 48 48" aria-hidden="true">
  <ellipse cx="17" cy="26" rx="12" ry="15" transform="rotate(-28 17 26)" fill="#64aee3" opacity=".85"/>
  <ellipse cx="29" cy="18" rx="10" ry="14" transform="rotate(30 29 18)" fill="#7cc48e" opacity=".8"/>
  <ellipse cx="31" cy="31" rx="11" ry="10" fill="#f4b083" opacity=".85"/>
</svg>`;

// ---------- Idioma / language ----------
function storageGet(store, k) { try { return window[store].getItem(k); } catch { return null; } }
function storageSet(store, k, v) { try { window[store].setItem(k, v); } catch { /* sin almacenamiento */ } }

function initialLang() {
  const q = new URLSearchParams(location.search).get("lang");
  if (q === "es" || q === "en") return q;
  const s = storageGet("localStorage", "lang");
  if (s === "es" || s === "en") return s;
  return (navigator.language || "es").toLowerCase().startsWith("en") ? "en" : "es";
}

export function getLang() { return document.documentElement.dataset.lang || "es"; }

export function setLang(lang) {
  document.documentElement.dataset.lang = lang;
  document.documentElement.lang = lang;
  storageSet("localStorage", "lang", lang);
  // Atributos traducibles: data-es-placeholder / data-en-placeholder, data-es-title...
  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    el.dataset.i18nAttr.split(",").forEach((attr) => {
      const v = el.dataset[lang + attr.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())];
      if (v !== undefined) el.setAttribute(attr, v);
    });
  });
  const titleEl = document.querySelector(`meta[name="title-${lang}"]`);
  if (titleEl) document.title = titleEl.content;
  document.querySelectorAll(".lang-toggle button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
}

// ---------- Cabecera / header ----------
const NAV = [
  { key: "tools", href: "herramientas/", es: "Herramientas", en: "Tools" },
  { key: "route", href: "profesionales/", es: "Ruta diagnóstica", en: "Diagnostic pathway" },
  { key: "evidence", href: "evidencia/", es: "Evidencia", en: "Evidence" },
  { key: "about", href: "acerca/", es: "Acerca de", en: "About" },
];
const NAV_PATIENTS = [
  { key: "p-home", href: "pacientes/", es: "Inicio", en: "Home" },
  { key: "p-understand", href: "pacientes/entender/", es: "Entender el Cushing", en: "Understanding Cushing's" },
  { key: "p-tests", href: "pacientes/pruebas/", es: "Mis pruebas", en: "My tests" },
  { key: "p-stages", href: "pacientes/etapas/", es: "Etapas", en: "Stages" },
  { key: "p-visit", href: "pacientes/consulta/", es: "Prepara tu consulta", en: "Prepare your visit" },
];
const L = (es, en) => `<span lang="es">${es}</span><span lang="en">${en}</span>`;

function renderHeader() {
  const el = document.getElementById("site-header");
  if (!el) return;
  el.outerHTML = `
  <a class="skip" href="#main">${L("Saltar al contenido", "Skip to content")}</a>
  <header class="site-header">
    <div class="container">
      <a class="brand" href="${ROOT}${PATIENTS ? "pacientes/" : ""}">${LOGO}
        <span><span class="brand-name">Cushing</span>
        <span class="brand-tag">${PATIENTS ? L("Información clara para ti y quienes te cuidan", "Clear information for you and those who care for you") : L("Herramientas y conocimiento para profesionales", "Tools and knowledge for clinicians")}</span></span>
      </a>
      <button class="menu-btn" aria-expanded="false" aria-controls="main-nav">${icon("menu")}<span class="sr-only">${L("Menú", "Menu")}</span></button>
      <nav class="nav" id="main-nav" aria-label="${"Principal"}">
        ${(PATIENTS ? NAV_PATIENTS : NAV).map((n) => `<a href="${ROOT}${n.href}"${n.key === PAGE ? ' aria-current="page"' : ""}>${L(n.es, n.en)}</a>`).join("")}
      </nav>
      <div class="header-tools">
        <span class="badge-pre">${PATIENTS ? L("Demo · borrador", "Demo · draft") : L("Versión preliminar", "Preliminary version")}</span>
        <div class="lang-toggle" role="group" aria-label="Idioma / Language">
          <button type="button" data-lang="es" aria-pressed="false">ES</button>
          <button type="button" data-lang="en" aria-pressed="false">EN</button>
        </div>
      </div>
    </div>
  </header>`;
  document.querySelectorAll(".lang-toggle button").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
  const btn = document.querySelector(".menu-btn");
  const nav = document.getElementById("main-nav");
  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
}

// ---------- Pie / footer ----------
function renderFooter() {
  const el = document.getElementById("site-footer");
  if (!el) return;
  if (PATIENTS) {
    el.outerHTML = `
  <footer class="site-footer">
    <div class="container">
      <p>${L(
        "Esta información es general y educativa. No reemplaza la orientación de tu equipo de salud, que conoce tu caso. Ante cualquier duda sobre tus resultados o tu tratamiento, consúltales.",
        "This information is general and educational. It does not replace advice from your care team, who know your case. If you have any doubt about your results or treatment, ask them."
      )}</p>
      <p class="small">${L("Este sitio no recoge ni guarda ningún dato.", "This site does not collect or store any data.")}</p>
      <div class="footer-row">
        <span>${L("Propuesta conceptual · demo de pacientes", "Concept proposal · patient demo")}</span>
        <nav aria-label="Pie"><a href="${ROOT}pacientes/entender/#preguntas">${L("Preguntas frecuentes", "FAQ")}</a></nav>
      </div>
    </div>
  </footer>`;
    return;
  }
  const slot = (es, en, name) => `<div class="logo-slot"><span>${L(es, en)}</span><strong>${name}</strong></div>`;
  el.outerHTML = `
  <footer class="site-footer">
    <div class="container">
      <div>${L("Instituciones participantes (espacios reservados para logotipos oficiales)", "Participating institutions (placeholders for official logos)")}</div>
      <div class="logos">
        ${slot("Elaborado por", "Developed by", "Hospital Universitario Ramón y Cajal")}
        ${slot("Elaborado por", "Developed by", "Hospital Pablo Tobón Uribe")}
        ${slot("Con el aval de", "Endorsed by", L("Por confirmar", "To be confirmed"))}
      </div>
      <p class="small">${L(
        "Herramienta de apoyo para profesionales de la salud. No sustituye el juicio clínico ni la valoración por un especialista. Los cálculos se realizan en su navegador: no se envía ni se guarda ningún dato.",
        "Decision-support tool for healthcare professionals. It does not replace clinical judgement or specialist assessment. Calculations run in your browser: no data is sent or stored."
      )}</p>
      <div class="footer-row">
        <span>${L("Propuesta conceptual · versión 0.1", "Concept proposal · version 0.1")}</span>
        <nav aria-label="Pie">
          <a href="${ROOT}acerca/#aviso">${L("Aviso legal", "Legal notice")}</a>
          <a href="${ROOT}acerca/#privacidad">${L("Privacidad", "Privacy")}</a>
          <a href="${ROOT}evidencia/#citar">${L("Cómo citar", "How to cite")}</a>
          <a href="https://github.com/carlosestebanbuiles">GitHub</a>
        </nav>
      </div>
    </div>
  </footer>`;
}

// ---------- Aviso de uso profesional / professional notice ----------
function renderGate() {
  if (storageGet("sessionStorage", "proGate") === "1") return;
  const wrap = document.createElement("div");
  wrap.className = "gate";
  wrap.setAttribute("role", "dialog");
  wrap.setAttribute("aria-modal", "true");
  wrap.setAttribute("aria-labelledby", "gate-title");
  wrap.innerHTML = `
    <div class="card">
      <div class="icon-bubble" style="margin-bottom:14px">${icon("stethoscope")}</div>
      <h2 id="gate-title">${L("Contenido para profesionales de la salud", "Content for healthcare professionals")}</h2>
      <p>${L(
        "Este sitio contiene herramientas de apoyo diagnóstico dirigidas a profesionales de la salud. Sus resultados requieren interpretación clínica en el contexto de cada paciente.",
        "This site contains diagnostic support tools intended for healthcare professionals. Results require clinical interpretation in the context of each patient."
      )}</p>
      <p class="muted small">${L(
        "Si usted es paciente o familiar, consulte a su equipo tratante para interpretar sus resultados.",
        "If you are a patient or relative, please ask your care team to interpret your results."
      )}</p>
      <div class="sticky-actions" style="margin-top:18px">
        <button class="btn btn-primary" type="button" id="gate-ok">${L("Soy profesional de la salud", "I am a healthcare professional")}</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  const ok = wrap.querySelector("#gate-ok");
  ok.focus();
  ok.addEventListener("click", () => {
    storageSet("sessionStorage", "proGate", "1");
    wrap.remove();
  });
}

// ---------- Init ----------
document.querySelectorAll("[data-icon]").forEach((el) => { el.innerHTML = icon(el.dataset.icon) + el.innerHTML; });
renderHeader();
renderFooter();
setLang(initialLang());
if (!PATIENTS && document.body.dataset.gate !== "off") renderGate();
