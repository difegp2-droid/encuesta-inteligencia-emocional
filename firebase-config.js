// =========================================================================
// CONFIGURACIÓN DE FIREBASE PARA LA ENCUESTA - UCSUR PSICOLOGÍA
// =========================================================================

const firebaseConfig = {
    apiKey: "AIzaSyDsE-qUtnT2f7ITSLahzNBLhx7EJLFF89A",
    authDomain: "encuesta-psicologia-ucsur.firebaseapp.com",
    projectId: "encuesta-psicologia-ucsur",
    storageBucket: "encuesta-psicologia-ucsur.firebasestorage.app",
    messagingSenderId: "806161078555",
    appId: "1:806161078555:web:49dadf2b6316f7d4f9dbbe"
};

const COLLECTION_NAME = "respuestas_inteligencia_emocional";

// Exponer en window para compatibilidad directa
if (typeof window !== 'undefined') {
    window.FIREBASE_CONFIG = firebaseConfig;
    window.COLLECTION_NAME = COLLECTION_NAME;
}

// Exportar para módulos ES6 si se usan en servidor web
export { firebaseConfig, COLLECTION_NAME };
