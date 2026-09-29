// =========================================================================
// LÓGICA DE LA ENCUESTA - PSICOLOGÍA UCSUR
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {

    // Referencias al DOM
    const surveyForm = document.getElementById('surveyForm');
    const sectionConsent = document.getElementById('sectionConsent');
    const sectionDemographics = document.getElementById('sectionDemographics');
    const sectionQuestions = document.getElementById('sectionQuestions');
    const screenDeclined = document.getElementById('screenDeclined');
    const screenSuccess = document.getElementById('screenSuccess');
    const progressWrapper = document.getElementById('progressWrapper');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressPercent = document.getElementById('progressPercent');
    const btnSubmit = document.getElementById('btnSubmit');

    // Inicializar Firebase (si está disponible y configurado)
    let db = null;
    let isFirebaseReady = false;

    const fbConfig = window.FIREBASE_CONFIG || {};
    const collectionName = window.COLLECTION_NAME || "respuestas_inteligencia_emocional";

    try {
        if (typeof firebase !== 'undefined' && fbConfig.apiKey && !fbConfig.apiKey.includes("TU_API_KEY")) {
            if (!firebase.apps.length) {
                firebase.initializeApp(fbConfig);
            }
            db = firebase.firestore();
            isFirebaseReady = true;
            console.log("🔥 Firebase Firestore conectado.");
        } else {
            console.log("ℹ️ Operando en Modo Local (LocalStorage).");
        }
    } catch (err) {
        console.warn("Aviso Firebase:", err);
    }

    // 1. Manejo del Consentimiento Informado
    const consentRadios = document.querySelectorAll('input[name="consentimiento"]');
    
    consentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const valor = e.target.value;

            // Actualizar estilo visual del radio seleccionado
            document.querySelectorAll('.custom-option-label').forEach(lbl => lbl.classList.remove('checked'));
            e.target.closest('.custom-option-label').classList.add('checked');

            if (valor === "Acepto participar") {
                // Mostrar secciones de datos y preguntas
                sectionDemographics.style.display = 'block';
                sectionQuestions.style.display = 'block';
                screenDeclined.style.display = 'none';
                progressWrapper.style.display = 'block';

                showToast("¡Consentimiento aceptado! Por favor, completa tus datos.", "success");

                // Scroll suave a los datos del participante
                setTimeout(() => {
                    sectionDemographics.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 150);

            } else if (valor === "No acepto participar") {
                // Ocultar todo y mostrar pantalla de agradecimiento/rechazo
                sectionDemographics.style.display = 'none';
                sectionQuestions.style.display = 'none';
                surveyForm.style.display = 'none';
                progressWrapper.style.display = 'none';
                screenDeclined.style.display = 'block';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            updateProgress();
        });
    });

    // 2. Estilo y evento al seleccionar opciones de la escala Likert
    const likertRadios = document.querySelectorAll('.likert-option input[type="radio"]');
    likertRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const groupName = e.target.name;
            const parentBlock = e.target.closest('.question-block');

            // Quitar clase 'selected' de las otras opciones de la misma pregunta
            document.querySelectorAll(`input[name="${groupName}"]`).forEach(r => {
                r.closest('.likert-option').classList.remove('selected');
            });

            // Activar clase en la opción seleccionada
            e.target.closest('.likert-option').classList.add('selected');
            if (parentBlock) {
                parentBlock.classList.add('answered');
            }

            updateProgress();
        });
    });

    // 3. Monitorear cambios en datos demográficos
    const inputEdad = document.getElementById('inputEdad');
    const selectGenero = document.getElementById('selectGenero');
    const selectCiclo = document.getElementById('selectCiclo');

    if (inputEdad) inputEdad.addEventListener('input', updateProgress);
    if (selectGenero) selectGenero.addEventListener('change', updateProgress);
    if (selectCiclo) selectCiclo.addEventListener('change', updateProgress);

    // 4. Calcular Progreso
    function updateProgress() {
        const consent = document.querySelector('input[name="consentimiento"]:checked');
        if (!consent || consent.value !== "Acepto participar") {
            if (progressBarFill) progressBarFill.style.width = '0%';
            if (progressPercent) progressPercent.textContent = '0%';
            return;
        }

        const totalItems = 18; // 3 demográficos + 15 preguntas
        let answered = 0;

        if (inputEdad && inputEdad.value && parseInt(inputEdad.value) >= 15) answered++;
        if (selectGenero && selectGenero.value) answered++;
        if (selectCiclo && selectCiclo.value) answered++;

        for (let i = 1; i <= 15; i++) {
            if (document.querySelector(`input[name="p${i}"]:checked`)) {
                answered++;
            }
        }

        const percent = Math.round((answered / totalItems) * 100);
        if (progressBarFill) progressBarFill.style.width = `${percent}%`;
        if (progressPercent) progressPercent.textContent = `${percent}% (${answered} de ${totalItems} completados)`;
    }

    // 5. Envío del Formulario
    surveyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validar consentimiento
        const consent = document.querySelector('input[name="consentimiento"]:checked');
        if (!consent || consent.value !== "Acepto participar") {
            showToast("Debes aceptar participar para enviar el cuestionario.", "error");
            sectionConsent.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        // Validar demográficos
        const edadVal = inputEdad.value.trim();
        const generoVal = selectGenero.value;
        const cicloVal = selectCiclo.value;

        if (!edadVal || parseInt(edadVal) < 15 || parseInt(edadVal) > 99) {
            showToast("Por favor, ingresa una edad válida (entre 15 y 99 años).", "error");
            inputEdad.focus();
            inputEdad.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (!generoVal) {
            showToast("Por favor, selecciona tu género.", "error");
            selectGenero.focus();
            selectGenero.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (!cicloVal) {
            showToast("Por favor, selecciona tu ciclo académico.", "error");
            selectCiclo.focus();
            selectCiclo.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // Validar las 15 preguntas
        const respuestas = {};
        let sumaTotal = 0;
        let missingQ = null;

        for (let i = 1; i <= 15; i++) {
            const checked = document.querySelector(`input[name="p${i}"]:checked`);
            if (!checked) {
                missingQ = i;
                break;
            }
            const val = parseInt(checked.value);
            const labelText = checked.dataset.label || checked.parentElement.textContent.trim();
            const questionText = document.querySelector(`#qBlock_${i} .question-text`)?.textContent.trim() || `Pregunta ${i}`;

            respuestas[`p${i}`] = {
                pregunta: questionText,
                valor: val,
                textoOpcion: labelText
            };
            sumaTotal += val;
        }

        if (missingQ) {
            showToast(`Falta responder la Pregunta ${missingQ}.`, "error");
            const block = document.getElementById(`qBlock_${missingQ}`);
            if (block) {
                block.scrollIntoView({ behavior: 'smooth', block: 'center' });
                block.style.border = '2px solid #ef4444';
                setTimeout(() => block.style.border = '', 2500);
            }
            return;
        }

        // Estructura del registro
        const registro = {
            fechaEnvio: new Date().toISOString(),
            timestamp: Date.now(),
            consentimiento: "Acepto participar",
            demograficos: {
                edad: parseInt(edadVal),
                genero: generoVal,
                ciclo: cicloVal
            },
            respuestas: respuestas,
            puntuacionTotal: sumaTotal,
            promedioGeneral: parseFloat((sumaTotal / 15).toFixed(2))
        };

        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando respuestas...`;

        try {
            // Guardar en Firestore si está conectado
            if (isFirebaseReady && db) {
                await db.collection(collectionName).add({
                    ...registro,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log("✅ Guardado en Firebase Cloud Firestore.");
            }

            // Guardar también siempre localmente para disponibilidad offline
            saveLocal(registro);

            // Mostrar pantalla de éxito
            surveyForm.style.display = 'none';
            progressWrapper.style.display = 'none';
            screenSuccess.style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
            showToast("¡Tus respuestas fueron enviadas correctamente!", "success");

        } catch (error) {
            console.error("Error al enviar a Firebase:", error);
            saveLocal(registro);
            surveyForm.style.display = 'none';
            progressWrapper.style.display = 'none';
            screenSuccess.style.display = 'block';
            showToast("Respuestas guardadas localmente.", "success");
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Enviar Formulario`;
        }
    });

    function saveLocal(data) {
        const list = JSON.parse(localStorage.getItem('encuesta_respuestas') || '[]');
        list.push(data);
        localStorage.setItem('encuesta_respuestas', JSON.stringify(list));
    }

    // Helper para notificaciones Toast
    function showToast(message, type = "info") {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '<i class="fa-solid fa-circle-info"></i>';
        if (type === 'success') icon = '<i class="fa-solid fa-circle-check"></i>';
        if (type === 'error') icon = '<i class="fa-solid fa-triangle-exclamation"></i>';

        toast.innerHTML = `${icon} <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

});
