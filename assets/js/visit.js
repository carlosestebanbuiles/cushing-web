// Hoja "Prepara tu consulta": todo ocurre en el navegador.
// No se guarda nada (ni localStorage ni servidor). Enviar = correo o menú de compartir del propio usuario.
import { getLang } from "./site.js";

const $ = (id) => document.getElementById(id);
const L = (es, en) => (getLang() === "es" ? es : en);
const form = $("visit-form");
const areas = [...document.querySelectorAll(".note-area")];

// Las casillas existen en ambos idiomas: se mantienen sincronizadas por posición.
function syncChecks(e) {
  const t = e.target;
  if (!t.matches("input[type=checkbox][data-group]")) return;
  const group = t.dataset.group;
  const own = [...t.closest("[lang]").querySelectorAll(`input[data-group="${group}"]`)];
  const idx = own.indexOf(t);
  document.querySelectorAll(`[lang] input[data-group="${group}"]`).forEach((c) => {
    const list = [...c.closest("[lang]").querySelectorAll(`input[data-group="${group}"]`)];
    if (list.indexOf(c) === idx) c.checked = t.checked;
  });
}
form.addEventListener("change", syncChecks);

// Altura automática de los cuadros de texto (también para imprimir completos).
const grow = (a) => { a.style.height = "auto"; a.style.height = `${Math.max(a.scrollHeight, 60)}px`; };
areas.forEach((a) => { a.addEventListener("input", () => grow(a)); grow(a); });

function checkedLabels(group) {
  const lang = getLang();
  const box = [...form.querySelectorAll(`input[data-group="${group}"]`)].filter((c) => c.closest("[lang]").getAttribute("lang") === lang);
  return box.filter((c) => c.checked).map((c) => c.parentElement.textContent.trim());
}

function hasContent() {
  return areas.some((a) => a.value.trim()) || document.querySelectorAll("input[data-group]:checked").length > 0;
}

function asText() {
  const sec = (title, body) => (body && body.trim() ? `${title}\n${body.trim()}\n` : "");
  const list = (items) => items.map((i) => `- ${i}`).join("\n");
  return [
    L("PREPARA TU CONSULTA", "PREPARE YOUR VISIT"),
    "",
    sec(L("Qué llevar:", "What to bring:"), list(checkedLabels("bring"))),
    sec(L("Mis síntomas y cambios:", "My symptoms and changes:"), $("f-symptoms").value),
    sec(L("Mis medicamentos:", "My medicines:"), $("f-meds").value),
    sec(L("Preguntas que quiero hacer:", "Questions I want to ask:"), [list(checkedLabels("ask")), $("f-otherq").value.trim()].filter(Boolean).join("\n")),
    sec(L("Lo que más me preocupa:", "What worries me most:"), $("f-worry").value),
  ].filter((x) => x !== "").join("\n");
}

function status(es, en) { $("status").textContent = L(es, en); }

$("b-print").addEventListener("click", () => { areas.forEach(grow); window.print(); });

$("b-copy").addEventListener("click", async () => {
  if (!hasContent()) return status("La hoja está vacía.", "The sheet is empty.");
  try { await navigator.clipboard.writeText(asText()); status("Texto copiado. Puedes pegarlo en una nota o un mensaje.", "Text copied. You can paste it into a note or message."); }
  catch { status("No se pudo copiar automáticamente.", "Could not copy automatically."); }
});

$("b-send").addEventListener("click", async () => {
  if (!hasContent()) return status("La hoja está vacía.", "The sheet is empty.");
  const title = L("Mi hoja para la consulta", "My sheet for the visit");
  const text = asText();
  if (navigator.share) {
    try { await navigator.share({ title, text }); return; } catch (e) { if (e && e.name === "AbortError") return; }
  }
  const body = encodeURIComponent(text);
  if (body.length > 1800) {
    try { await navigator.clipboard.writeText(text); } catch { /* sin portapapeles */ }
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(L("(El texto es largo: está copiado, pégalo aquí.)", "(The text is long: it is copied, paste it here.)"))}`;
    status("El texto es largo: lo copiamos para que lo pegues en el correo.", "The text is long: we copied it so you can paste it into the email.");
  } else {
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${body}`;
  }
});

$("b-clear").addEventListener("click", () => {
  if (hasContent() && !window.confirm(L("¿Borrar todo lo escrito?", "Clear everything you wrote?"))) return;
  form.reset();
  areas.forEach(grow);
  status("Hoja borrada.", "Sheet cleared.");
});

// Aviso antes de salir si hay contenido (nada se guarda).
window.addEventListener("beforeunload", (e) => { if (hasContent()) { e.preventDefault(); e.returnValue = ""; } });
