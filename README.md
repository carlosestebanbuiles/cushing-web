# Cushing · Herramientas para profesionales / Tools for clinicians

Sitio web estático y bilingüe (ES/EN) con herramientas de apoyo diagnóstico para el síndrome de Cushing ACTH-dependiente.
Static bilingual (ES/EN) website with diagnostic support tools for ACTH-dependent Cushing's syndrome.

> **Versión preliminar (0.1).** Dirigido a profesionales de la salud. No sustituye el juicio clínico.
> **Preliminary version (0.1).** For healthcare professionals. Does not replace clinical judgement.

## Herramientas / Tools

| Herramienta | Qué hace | Fuente |
|---|---|---|
| Modelo de origen ectópico | Probabilidad de secreción ectópica de ACTH con ACTH, CLU (×LSN), potasio nadir y diámetro de lesión hipofisaria | Rivera-Martínez et al., *Endocr Relat Cancer* 2026, [doi:10.1530/ERC-25-0348](https://doi.org/10.1530/ERC-25-0348) |
| Interpretación integrada | Tamizaje → dependencia de ACTH → origen (RM, CRH/desmopresina, dexametasona a dosis altas, cateterismo) → posoperatorio | Nieman 2008; Fleseriu 2021; Nieman 1993 |
| Conversor de unidades | Cortisol sérico, salival y urinario, ACTH, potasio, glucosa; múltiplo del LSN | Masas molares estándar |

## Estructura / Structure

```
index.html                     Inicio / Home
herramientas/                  Herramientas / Tools
  origen-ectopico/             Calculadora del modelo
  interpretacion/              Interpretación integrada
  conversor/                   Conversor de unidades
profesionales/                 Ruta diagnóstica (borrador)
evidencia/                     Transparencia del modelo, criterios, cómo citar
acerca/                        Equipo, aviso legal, privacidad
src/logic/                     Lógica clínica (sin interfaz) / clinical logic (no UI)
  criteria.js                  Puntos de corte + fuentes + estado de verificación
  ectopic-model.js             Modelo logístico (idéntico a cushing-predictor/global.R)
  interpretation.js            Motor de reglas
  messages.js                  Textos ES/EN de cada hallazgo
  units.js                     Conversión de unidades
assets/                        CSS, JS de interfaz, imágenes
tests/                         Pruebas automáticas (node --test)
```

La lógica clínica está separada de la interfaz: cualquier revisor puede verificar fórmulas y puntos de corte en `src/logic/` sin leer código de interfaz. La tabla de criterios de la página *Evidencia* se genera desde `criteria.js`, así que siempre coincide con lo que calculan las herramientas.

## Ejecutar en local / Run locally

```bash
python3 -m http.server 8000   # luego abrir http://localhost:8000
npm test                      # pruebas (Node ≥ 18, sin dependencias)
```

## Publicación / Deployment

Cada *push* a `main` ejecuta las pruebas y, si pasan, publica el sitio en GitHub Pages (`.github/workflows/pages.yml`). Activar una sola vez en *Settings → Pages → Source: GitHub Actions*.

El sitio usa rutas relativas y no depende de nada propio de GitHub: puede copiarse tal cual a otro servidor.

## Cambiar una fórmula o un punto de corte / Changing a formula or cutoff

1. Editar `src/logic/criteria.js` (o `ectopic-model.js`), indicando la fuente y el estado (`verified` / `review`).
2. Actualizar o añadir la prueba correspondiente en `tests/`.
3. Añadir la entrada en el historial de versiones (`evidencia/index.html`).
4. Abrir un *pull request*: las pruebas se ejecutan automáticamente.

## Privacidad / Privacy

Todos los cálculos se ejecutan en el navegador. No hay servidor, analítica ni cookies de seguimiento. Solo se guarda localmente el idioma elegido.

## Cómo citar / How to cite

Rivera-Martínez WA, Builes-Montaño CE, Aristizábal Henao N, et al. Predictive model for the diagnosis of ectopic Cushing syndrome. *Endocr Relat Cancer*. 2026;33:e250348. doi:10.1530/ERC-25-0348

Herramienta original en Shiny: [cushing-predictor](https://github.com/carlosestebanbuiles/cushing-predictor).

## Contacto / Contact

Carlos Builes · [github.com/carlosestebanbuiles](https://github.com/carlosestebanbuiles)
