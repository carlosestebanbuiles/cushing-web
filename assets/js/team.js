// Responsables del sitio: una sola fuente para Acerca de (profesionales) y Pacientes.
const ROOT = document.body.dataset.root || "./";
const PATIENTS = document.body.dataset.site === "patients";
const el = document.getElementById("team");
if (el) el.innerHTML = `
        <article class="person">
          <img src="${ROOT}assets/img/equipo/araujo-castro.webp?v=2" alt="Dra. Marta Araujo-Castro" width="240" height="240" loading="lazy">
          <div>
            <h3>Dra. Marta Araujo-Castro</h3>
            <p class="role"><span lang="es">Endocrinología y Nutrición · Hospital Universitario Ramón y Cajal, Madrid</span><span lang="en">Endocrinology and Nutrition · Ramón y Cajal University Hospital, Madrid</span></p>
            <div lang="es">
              <p>Especialista en Endocrinología y Nutrición y coordinadora de la Unidad de Hipófisis y de la Unidad de Patología Suprarrenal del Servicio de Endocrinología y Nutrición del Hospital Universitario Ramón y Cajal (Madrid), centro de referencia nacional para el abordaje de patología hipotálamo-hipofisaria compleja.</p>
              <p>Cuenta con amplia experiencia clínica e investigadora en el diagnóstico y tratamiento de las enfermedades hipofisarias, especialmente la enfermedad de Cushing, la acromegalia y los tumores hipofisarios. Su actividad investigadora se centra en la medicina personalizada y la identificación de biomarcadores que permitan optimizar el diagnóstico, el pronóstico y el tratamiento de estas enfermedades. Es autora de más de 200 publicaciones científicas indexadas en PubMed.</p>
              <p>Compagina su actividad en el ámbito público con la consulta privada en el Hospital Ruber Internacional, dentro del programa de Segunda Opinión Médica (Expert Opinion Program), y en el Hospital Universitario HM de Tres Cantos.</p>
            </div>
            <div lang="en">
              <p>Specialist in Endocrinology and Nutrition and coordinator of the Pituitary Unit and the Adrenal Unit of the Department of Endocrinology and Nutrition at Ramón y Cajal University Hospital (Madrid), a national reference center for complex hypothalamic-pituitary disease.</p>
              <p>She has extensive clinical and research experience in the diagnosis and treatment of pituitary diseases, especially Cushing's disease, acromegaly and pituitary tumors. Her research focuses on personalized medicine and on identifying biomarkers to optimize the diagnosis, prognosis and treatment of these diseases. She has authored more than 200 scientific publications indexed in PubMed.</p>
              <p>Alongside her public-sector work, she has a private practice at Hospital Ruber Internacional, within the Expert Opinion (second medical opinion) Program, and at HM Tres Cantos University Hospital.</p>
            </div>
          </div>
        </article>

        <article class="person">
          <img src="${ROOT}assets/img/equipo/builes-montano.webp" alt="Dr. Carlos E. Builes-Montaño" width="240" height="240" loading="lazy">
          <div>
            <h3>Dr. Carlos E. Builes-Montaño</h3>
            <p class="role"><span lang="es">Endocrinología · Hospital Pablo Tobón Uribe y Universidad de Antioquia, Medellín</span><span lang="en">Endocrinology · Hospital Pablo Tobón Uribe and University of Antioquia, Medellín</span></p>
            <div lang="es">
              <p>Endocrinólogo y doctor en Medicina Clínica por la Universidad de Antioquia. Ejerce desde 2013 en el Hospital Pablo Tobón Uribe (Medellín, Colombia), con énfasis en enfermedades endocrinas raras, incluidos los tumores hipofisarios. Realizó una pasantía en neuroendocrinología en la Università degli Studi di Napoli Federico II (Italia).</p>
              <p>Es profesor asociado de Endocrinología y Metabolismo de la Universidad de Antioquia, donde dirigió la Sección de Endocrinología y Metabolismo y su programa de residencia entre 2018 y 2024. Su investigación abarca las enfermedades endocrinas raras (síndrome de Cushing, tumores suprarrenales e hipofisarios, enfermedad ocular tiroidea), la diabetes, el modelado matemático de fenómenos biológicos y los gemelos digitales, así como la epidemiología clínica: modelos pronósticos, revisiones sistemáticas y metodología de consenso.</p>
              <p>${PATIENTS ? "Es coautor de un modelo para orientar el diagnóstico del síndrome de Cushing de origen ectópico." : "Es coautor del modelo predictivo de síndrome de Cushing ectópico en el que se basa la calculadora de este sitio."} Es fundador y director científico de Festina Lente, dedicada al diseño metodológico de investigación clínica y desarrollo de consensos.</p>
            </div>
            <div lang="en">
              <p>Endocrinologist with a PhD in Clinical Medicine from the University of Antioquia. He has practised since 2013 at Hospital Pablo Tobón Uribe (Medellín, Colombia), with an emphasis on rare endocrine diseases, including pituitary tumors. He completed a training placement in neuroendocrinology at the Università degli Studi di Napoli Federico II (Italy).</p>
              <p>He is Associate Professor of Endocrinology and Metabolism at the University of Antioquia, where he headed the Endocrinology and Metabolism Section and its residency program from 2018 to 2024. His research covers rare endocrine diseases (Cushing's syndrome, adrenal and pituitary tumors, thyroid eye disease), diabetes, mathematical modelling of biological phenomena and digital twins, as well as clinical epidemiology: prognostic models, systematic reviews and consensus methodology.</p>
              <p>${PATIENTS ? "He is a co-author of a model that helps guide the diagnosis of ectopic Cushing's syndrome." : "He is a co-author of the predictive model for ectopic Cushing\'s syndrome on which this site\'s calculator is based."} He is the founder and scientific director of Festina Lente, dedicated to the methodological design of clinical research and consensus development.</p>
            </div>
          </div>
        </article>

        <article class="person">
          <span class="avatar" aria-hidden="true">?</span>
          <div>
            <h3><span lang="es">Tercer responsable</span><span lang="en">Third author</span></h3>
            <p class="small muted"><span lang="es">Pendiente: nombre, filiación, breve reseña y foto.</span><span lang="en">Pending: name, affiliation, short bio and photo.</span></p>
          </div>
        </article>
`;
