// =========================================================================
// LÓGICA DEL PANEL DE RESPUESTAS Y DASHBOARD - PSICOLOGÍA UCSUR
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {

    const QUESTIONS_LABELS = [
        "P1: Me doy cuenta de lo que siento en todo momento",
        "P2: Presto atención a mis emociones, aunque esté ocupado...",
        "P3: Fácil identificar qué emoción siento",
        "P4: Noto cambios de ánimo a lo largo del día",
        "P5: Pienso en cómo me siento antes de actuar",
        "P6: Identifico emoción y situación que la provoca",
        "P7: Claridad cuando siento tristeza",
        "P8: Pensamientos afectan lo que siento",
        "P9: Explicar con palabras lo que siento",
        "P10: Situación provocó mi estado de ánimo",
        "P11: Encuentro forma de sentirme mejor",
        "P12: Control bajo presión académica",
        "P13: Me calmo antes de reaccionar",
        "P14: Actitud positiva a pesar de problemas",
        "P15: Manejo estrés sin que me desborde"
    ];

    let allResponses = [];
    let chartQuestionsInstance = null;
    let chartGenderInstance = null;
    let chartCiclosInstance = null;
    let db = null;
    let isFirebaseReady = false;

    // Elementos del DOM
    const statTotalCount = document.getElementById('statTotalCount');
    const statMeanScore = document.getElementById('statMeanScore');
    const statGenderRatio = document.getElementById('statGenderRatio');
    const statGenderDetail = document.getElementById('statGenderDetail');
    const statMeanAge = document.getElementById('statMeanAge');
    const tableBody = document.getElementById('tableBody');
    const tableCountSummary = document.getElementById('tableCountSummary');
    const searchInput = document.getElementById('searchInput');
    const filterGenero = document.getElementById('filterGenero');
    const btnExportExcel = document.getElementById('btnExportExcel');
    const btnRefresh = document.getElementById('btnRefresh');
    const btnSeedDemoData = document.getElementById('btnSeedDemoData');
    const btnClearLocal = document.getElementById('btnClearLocal');
    const firebaseStatusBadge = document.getElementById('firebaseStatusBadge');
    const firebaseStatusText = document.getElementById('firebaseStatusText');
    const firebaseConfigBanner = document.getElementById('firebaseConfigBanner');

    const fbConfig = window.FIREBASE_CONFIG || {};
    const collectionName = window.COLLECTION_NAME || "respuestas_inteligencia_emocional";

    // Función auxiliar para clasificar nivel de IE
    function getNivelIE(puntuacion) {
        if (!puntuacion || isNaN(puntuacion)) return { label: 'Sin datos', class: '' };
        if (puntuacion >= 55) return { label: 'Alto', class: 'badge-level-alto' };
        if (puntuacion >= 35) return { label: 'Medio', class: 'badge-level-medio' };
        return { label: 'Bajo', class: 'badge-level-bajo' };
    }

    // Inicializar conexión a Firestore o LocalStorage
    function initBackend() {
        try {
            if (typeof firebase !== 'undefined' && fbConfig.apiKey && !fbConfig.apiKey.includes("TU_API_KEY")) {
                if (!firebase.apps.length) {
                    firebase.initializeApp(fbConfig);
                }
                db = firebase.firestore();
                isFirebaseReady = true;
                
                if (firebaseStatusBadge) firebaseStatusBadge.className = "connection-badge online";
                if (firebaseStatusText) firebaseStatusText.textContent = "Firebase Conectado (En Vivo)";
                if (firebaseConfigBanner) firebaseConfigBanner.style.display = 'none';

                // Escuchar cambios en tiempo real desde Firestore
                db.collection(collectionName).onSnapshot((snapshot) => {
                    const firestoreData = [];
                    snapshot.forEach(doc => {
                        firestoreData.push({ id: doc.id, ...doc.data() });
                    });
                    
                    const localData = getLocalStorageData();
                    allResponses = firestoreData.length > 0 ? firestoreData : localData;
                    renderDashboard();
                }, (error) => {
                    console.error("Error al escuchar Firestore:", error);
                    loadFromLocalStorage();
                });

            } else {
                showLocalStorageMode();
            }
        } catch (e) {
            console.warn("Fallo de inicialización Firebase, pasando a LocalStorage:", e);
            showLocalStorageMode();
        }
    }

    function showLocalStorageMode() {
        if (firebaseStatusBadge) firebaseStatusBadge.className = "connection-badge offline";
        if (firebaseStatusText) firebaseStatusText.textContent = "Modo Local (LocalStorage)";
        if (firebaseConfigBanner) firebaseConfigBanner.style.display = 'block';
        loadFromLocalStorage();
    }

    function getLocalStorageData() {
        return JSON.parse(localStorage.getItem('encuesta_respuestas') || '[]');
    }

    function loadFromLocalStorage() {
        allResponses = getLocalStorageData();
        renderDashboard();
    }

    // Renderizado Global del Dashboard
    function renderDashboard() {
        updateStatistics();
        renderCharts();
        renderTable();
    }

    // 1. Estadísticas Generales
    function updateStatistics() {
        const total = allResponses.length;
        if (statTotalCount) statTotalCount.textContent = total;

        if (total === 0) {
            if (statMeanScore) statMeanScore.textContent = "0.0";
            if (statGenderRatio) statGenderRatio.textContent = "-";
            if (statGenderDetail) statGenderDetail.textContent = "0 F / 0 M";
            if (statMeanAge) statMeanAge.textContent = "0";
            return;
        }

        // Puntuación Media
        const sumScores = allResponses.reduce((acc, curr) => acc + (curr.puntuacionTotal || 0), 0);
        const meanScore = (sumScores / total).toFixed(1);
        if (statMeanScore) statMeanScore.textContent = `${meanScore} / 75`;

        // Género y Edad
        let femCount = 0;
        let mascCount = 0;
        let sumAge = 0;

        allResponses.forEach(r => {
            const g = r.demograficos?.genero;
            if (g === 'Femenino') femCount++;
            else if (g === 'Masculino') mascCount++;
            
            sumAge += Number(r.demograficos?.edad) || 0;
        });

        const femPercent = Math.round((femCount / total) * 100);
        if (statGenderRatio) statGenderRatio.textContent = `${femPercent}% Fem`;
        if (statGenderDetail) statGenderDetail.textContent = `${femCount} Femenino / ${mascCount} Masculino`;

        const meanAge = (sumAge / total).toFixed(1);
        if (statMeanAge) statMeanAge.textContent = `${meanAge} años`;
    }

    // 2. Gráficos con Chart.js
    function renderCharts() {
        renderQuestionsChart();
        renderGenderChart();
        renderCiclosChart();
    }

    function renderQuestionsChart() {
        const ctx = document.getElementById('chartQuestions');
        if (!ctx || typeof Chart === 'undefined') return;

        const questionAverages = [];
        for (let i = 1; i <= 15; i++) {
            const key = `p${i}`;
            let sum = 0;
            let count = 0;
            allResponses.forEach(r => {
                if (r.respuestas && r.respuestas[key]) {
                    sum += Number(r.respuestas[key].valor) || 0;
                    count++;
                }
            });
            const avg = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
            questionAverages.push(avg);
        }

        if (chartQuestionsInstance) chartQuestionsInstance.destroy();

        chartQuestionsInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: QUESTIONS_LABELS.map((_, idx) => `P${idx + 1}`),
                datasets: [{
                    label: 'Puntaje Promedio (1 a 5)',
                    data: questionAverages,
                    backgroundColor: 'rgba(2, 132, 199, 0.85)',
                    borderColor: '#0284c7',
                    borderWidth: 1.5,
                    borderRadius: 8,
                    hoverBackgroundColor: '#0a3d62'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: function(items) {
                                const index = items[0].dataIndex;
                                return QUESTIONS_LABELS[index];
                            },
                            label: function(context) {
                                return `Promedio: ${context.raw} / 5.00 puntos`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        ticks: { stepSize: 1, font: { weight: '600' } },
                        grid: { color: 'rgba(226, 232, 240, 0.8)' }
                    },
                    x: {
                        ticks: { font: { weight: '700' } },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    function renderGenderChart() {
        const ctx = document.getElementById('chartGender');
        if (!ctx || typeof Chart === 'undefined') return;

        let f = 0, m = 0;
        allResponses.forEach(r => {
            if (r.demograficos?.genero === 'Femenino') f++;
            if (r.demograficos?.genero === 'Masculino') m++;
        });

        if (chartGenderInstance) chartGenderInstance.destroy();

        chartGenderInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Femenino', 'Masculino'],
                datasets: [{
                    data: [f, m],
                    backgroundColor: ['#ec4899', '#0284c7'],
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: { font: { weight: '700' }, padding: 16 }
                    }
                },
                cutout: '65%'
            }
        });
    }

    function renderCiclosChart() {
        const ctx = document.getElementById('chartCiclos');
        if (!ctx || typeof Chart === 'undefined') return;

        const ciclosMap = {};
        allResponses.forEach(r => {
            const c = r.demograficos?.ciclo || 'Sin especificar';
            ciclosMap[c] = (ciclosMap[c] || 0) + 1;
        });

        const labels = Object.keys(ciclosMap).sort();
        const data = labels.map(l => ciclosMap[l]);

        if (chartCiclosInstance) chartCiclosInstance.destroy();

        chartCiclosInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['Sin datos'],
                datasets: [{
                    label: 'Estudiantes',
                    data: data.length ? data : [0],
                    backgroundColor: 'rgba(16, 185, 129, 0.85)',
                    borderColor: '#10b981',
                    borderWidth: 1.5,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        ticks: { precision: 0, font: { weight: '600' } },
                        grid: { color: 'rgba(226, 232, 240, 0.8)' }
                    },
                    x: {
                        ticks: { font: { weight: '600' } },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // 3. Renderizado de Tabla con Filtros
    function renderTable() {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        const searchTerm = (searchInput ? searchInput.value : '').toLowerCase().trim();
        const selectedGender = filterGenero ? filterGenero.value : 'ALL';

        const filtered = allResponses.filter(r => {
            const matchesGender = selectedGender === 'ALL' || r.demograficos?.genero === selectedGender;
            const searchStr = `${r.demograficos?.edad || ''} ${r.demograficos?.genero || ''} ${r.demograficos?.ciclo || ''} ${r.puntuacionTotal || ''}`.toLowerCase();
            const matchesSearch = !searchTerm || searchStr.includes(searchTerm);

            return matchesGender && matchesSearch;
        });

        if (tableCountSummary) {
            tableCountSummary.textContent = `Mostrando ${filtered.length} de ${allResponses.length} registros`;
        }

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="23" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                        <i class="fa-solid fa-inbox" style="font-size: 2.2rem; margin-bottom: 0.65rem; color: #cbd5e1; display: block;"></i>
                        No se encontraron respuestas registradas aún.
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach((r, idx) => {
            const tr = document.createElement('tr');
            
            const fecha = r.fechaEnvio ? new Date(r.fechaEnvio).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : 'Reciente';
            const generoBadge = r.demograficos?.genero === 'Femenino' 
                ? '<span class="badge-tag badge-f">F</span>' 
                : '<span class="badge-tag badge-m">M</span>';

            const nivel = getNivelIE(r.puntuacionTotal);

            let pCols = '';
            for (let i = 1; i <= 15; i++) {
                const val = r.respuestas && r.respuestas[`p${i}`] ? r.respuestas[`p${i}`].valor : '-';
                pCols += `<td style="text-align: center; font-weight: 700; color: var(--primary);">${val}</td>`;
            }

            tr.innerHTML = `
                <td><strong>${idx + 1}</strong></td>
                <td style="color: var(--text-muted); font-size: 0.82rem;">${fecha}</td>
                <td><strong>${r.demograficos?.edad || '-'}</strong></td>
                <td>${generoBadge} ${r.demograficos?.genero || '-'}</td>
                <td><strong>${r.demograficos?.ciclo || '-'}</strong></td>
                <td><span class="badge-tag badge-score">${r.puntuacionTotal || '-'} pts</span></td>
                <td><span class="badge-tag ${nivel.class}">${nivel.label}</span></td>
                <td><strong>${r.promedioGeneral || '-'}</strong></td>
                ${pCols}
            `;

            tableBody.appendChild(tr);
        });
    }

    // 4. Exportar a Excel (.xlsx) Profesional y Formateado para Tesis/SPSS
    function exportToExcel() {
        if (allResponses.length === 0) {
            alert("No hay respuestas para exportar. Envía al menos una encuesta primero.");
            return;
        }

        if (typeof XLSX === 'undefined') {
            alert("Cargando la librería de Excel. Por favor, reintenta en un momento.");
            return;
        }

        const workbook = XLSX.utils.book_new();

        // -------------------------------------------------------------
        // HOJA 1: MATRIZ NUMÉRICA (Ideal para importar en SPSS, JASP o R)
        // -------------------------------------------------------------
        const spssMatrix = allResponses.map((r, i) => {
            const nivel = getNivelIE(r.puntuacionTotal);
            const row = {
                "ID": i + 1,
                "FECHA_REGISTRO": r.fechaEnvio || new Date().toISOString(),
                "EDAD": Number(r.demograficos?.edad) || "",
                "GENERO": r.demograficos?.genero || "",
                "GENERO_NUM": r.demograficos?.genero === "Femenino" ? 1 : (r.demograficos?.genero === "Masculino" ? 2 : ""),
                "CICLO": r.demograficos?.ciclo || "",
                "PUNTAJE_TOTAL_IE": Number(r.puntuacionTotal) || 0,
                "NIVEL_IE": nivel.label,
                "PROMEDIO_IE": Number(r.promedioGeneral) || 0
            };

            // P1 a P15 como valores numéricos puros (1-5)
            for (let q = 1; q <= 15; q++) {
                const item = r.respuestas ? r.respuestas[`p${q}`] : null;
                row[`P${q}`] = item ? Number(item.valor) : "";
            }

            return row;
        });

        const sheet1 = XLSX.utils.json_to_sheet(spssMatrix);

        // Anchos de columna automáticos para que se vea impecable
        sheet1['!cols'] = [
            { wch: 6 },  // ID
            { wch: 22 }, // FECHA
            { wch: 8 },  // EDAD
            { wch: 12 }, // GENERO
            { wch: 13 }, // GENERO_NUM
            { wch: 14 }, // CICLO
            { wch: 18 }, // TOTAL
            { wch: 12 }, // NIVEL
            { wch: 14 }, // PROMEDIO
            ...Array(15).fill({ wch: 6 }) // P1 a P15
        ];

        XLSX.utils.book_append_sheet(workbook, sheet1, "Matriz Numérica (SPSS)");

        // -------------------------------------------------------------
        // HOJA 2: RESPUESTAS DESCRIPTIVAS COMPLETAS (Texto legible)
        // -------------------------------------------------------------
        const descriptiveRows = allResponses.map((r, i) => {
            const nivel = getNivelIE(r.puntuacionTotal);
            const row = {
                "N°": i + 1,
                "Fecha y Hora": r.fechaEnvio ? new Date(r.fechaEnvio).toLocaleString('es-PE') : "",
                "Edad (Años)": r.demograficos?.edad || "",
                "Género": r.demograficos?.genero || "",
                "Ciclo": r.demograficos?.ciclo || "",
                "Puntaje Total (15-75)": r.puntuacionTotal || 0,
                "Nivel de Inteligencia Emocional": nivel.label,
                "Media (1-5)": r.promedioGeneral || 0
            };

            for (let q = 1; q <= 15; q++) {
                const item = r.respuestas ? r.respuestas[`p${q}`] : null;
                row[`Ítem ${q}: ${QUESTIONS_LABELS[q - 1] || ''}`] = item ? `${item.valor} - ${item.textoOpcion}` : "";
            }

            return row;
        });

        const sheet2 = XLSX.utils.json_to_sheet(descriptiveRows);
        sheet2['!cols'] = [
            { wch: 6 },
            { wch: 20 },
            { wch: 12 },
            { wch: 12 },
            { wch: 14 },
            { wch: 22 },
            { wch: 28 },
            { wch: 14 },
            ...Array(15).fill({ wch: 42 })
        ];

        XLSX.utils.book_append_sheet(workbook, sheet2, "Respuestas Detalladas");

        // -------------------------------------------------------------
        // HOJA 3: RESUMEN Y PROMEDIOS POR ÍTEM
        // -------------------------------------------------------------
        const summaryData = [
            { "MÉTRICA": "Total de Participantes", "VALOR": allResponses.length },
            { "MÉTRICA": "Puntuación Media General", "VALOR": (allResponses.reduce((a, b) => a + (b.puntuacionTotal || 0), 0) / (allResponses.length || 1)).toFixed(2) },
            { "MÉTRICA": "Puntuación Mínima Registrada", "VALOR": Math.min(...allResponses.map(r => r.puntuacionTotal || 75)) },
            { "MÉTRICA": "Puntuación Máxima Registrada", "VALOR": Math.max(...allResponses.map(r => r.puntuacionTotal || 15)) },
            { "MÉTRICA": "", "VALOR": "" },
            { "MÉTRICA": "PROMEDIO POR CADA ÍTEM (ESCALA 1 A 5)", "VALOR": "" }
        ];

        for (let q = 1; q <= 15; q++) {
            let sum = 0, count = 0;
            allResponses.forEach(r => {
                if (r.respuestas && r.respuestas[`p${q}`]) {
                    sum += Number(r.respuestas[`p${q}`].valor) || 0;
                    count++;
                }
            });
            const avg = count > 0 ? (sum / count).toFixed(2) : 0;
            summaryData.push({
                "MÉTRICA": `Ítem ${q}: ${QUESTIONS_LABELS[q - 1]}`,
                "VALOR": `${avg} pts`
            });
        }

        const sheet3 = XLSX.utils.json_to_sheet(summaryData);
        sheet3['!cols'] = [{ wch: 55 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, sheet3, "Resumen Psicométrico");

        // Descargar archivo Excel formateado
        const dateStr = new Date().toISOString().slice(0, 10);
        const filename = `Escala_Inteligencia_Emocional_UCSUR_${dateStr}.xlsx`;
        XLSX.writeFile(workbook, filename);
    }

    // 5. Generar Datos Demo de Prueba
    function seedDemoData() {
        const ciclos = ["II Ciclo", "IV Ciclo", "VI Ciclo", "VIII Ciclo", "X Ciclo"];
        const generos = ["Femenino", "Masculino", "Femenino", "Femenino", "Masculino"];
        const newItems = [];

        for (let i = 0; i < 5; i++) {
            const respuestas = {};
            let total = 0;
            for (let q = 1; q <= 15; q++) {
                const val = Math.floor(Math.random() * 5) + 1;
                total += val;
                respuestas[`p${q}`] = {
                    pregunta: QUESTIONS_LABELS[q - 1],
                    valor: val,
                    textoOpcion: ["Nada de acuerdo", "Algo de acuerdo", "Bastante de acuerdo", "Muy de acuerdo", "Totalmente de acuerdo"][val - 1]
                };
            }

            const item = {
                fechaEnvio: new Date(Date.now() - (i * 3600000 * 4)).toISOString(),
                consentimiento: "Acepto participar",
                demograficos: {
                    edad: Math.floor(Math.random() * 7) + 18,
                    genero: generos[i],
                    ciclo: ciclos[i]
                },
                respuestas: respuestas,
                puntuacionTotal: total,
                promedioGeneral: parseFloat((total / 15).toFixed(2))
            };
            newItems.push(item);
        }

        const current = getLocalStorageData();
        const updated = [...current, ...newItems];
        localStorage.setItem('encuesta_respuestas', JSON.stringify(updated));
        allResponses = updated;
        renderDashboard();
    }

    // 6. Limpiar Datos Locales
    function clearLocalData() {
        if (confirm("¿Estás seguro de que deseas borrar las respuestas guardadas localmente en este navegador?")) {
            localStorage.removeItem('encuesta_respuestas');
            allResponses = [];
            renderDashboard();
        }
    }

    // Event Listeners
    if (searchInput) searchInput.addEventListener('input', renderTable);
    if (filterGenero) filterGenero.addEventListener('change', renderTable);
    if (btnExportExcel) btnExportExcel.addEventListener('click', exportToExcel);
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            if (isFirebaseReady) initBackend();
            else loadFromLocalStorage();
        });
    }
    if (btnSeedDemoData) btnSeedDemoData.addEventListener('click', seedDemoData);
    if (btnClearLocal) btnClearLocal.addEventListener('click', clearLocalData);

    // Inicializar
    initBackend();

});
