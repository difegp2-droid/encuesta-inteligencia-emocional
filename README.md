# 🧠 Encuesta Psicométrica - Inteligencia Emocional (UCSUR 2026-2)

Aplicación web completa para la recopilación y análisis psicométrico de datos sobre Inteligencia Emocional en estudiantes de Psicología de la **Universidad Científica del Sur**.

---

## 🚀 ¿Cómo abrir y usar el proyecto?

### 1. Vía Servidor Local (XAMPP / Apache):
Si tienes XAMPP encendido:
- **Formulario de la Encuesta**: [http://localhost/encuesta/](http://localhost/encuesta/)
- **Panel de Respuestas y Estadísticas**: [http://localhost/encuesta/respuestas.html](http://localhost/encuesta/respuestas.html)

---

## 📋 Estructura y Características

1. **`index.html` (Formulario de Encuesta)**:
   - **Consentimiento Informado Obligatorio**: Con opciones *"Acepto participar"* / *"No acepto participar"*.
   - **Datos Sociodemográficos**: Edad, Género (*Femenino / Masculino*), y Ciclo (*I Ciclo al XII Ciclo*).
   - **15 Ítems Psicométricos**: Con escala Likert de 5 opciones:
     1. *Nada de acuerdo*
     2. *Algo de acuerdo*
     3. *Bastante de acuerdo*
     4. *Muy de acuerdo*
     5. *Totalmente de acuerdo*
   - Barra de progreso en tiempo real y validación fluida.
   - Guardado automático tanto en **Firebase Cloud Firestore** (en la nube) como respaldo en **LocalStorage**.

2. **`respuestas.html` (Dashboard y Análisis de Datos)**:
   - **Tarjetas de Estadísticas**: Total de participantes, Puntaje global medio (15 a 75 pts), Ratio de género y Edad promedio.
   - **Gráficos Interactivos (Chart.js)**:
     - Promedio por cada una de las 15 preguntas.
     - Gráfico de dona de distribución de género.
     - Gráfico de barras de participación por ciclo académico.
   - **Matriz de Respuestas**: Tabla con todas las respuestas (P1 a P15).
   - **Exportación Directa**:
     - 📊 **Botón "Exportar a Excel (.xlsx)"**: Listo para abrir en Excel o importar en software estadístico como **SPSS / JASP / R**.
     - 📄 **Botón "Exportar CSV"**.
   - **Generador de Datos Demo**: Permite generar respuestas simuladas con un solo clic para verificar gráficos de inmediato.

---

## 🔥 ¿Cómo conectarlo a Firebase (para que cualquiera responda desde su celular)?

Por defecto el sistema funciona inmediatamente en modo local. Si deseas compartir el enlace por WhatsApp/redes para recibir respuestas en vivo desde cualquier parte:

1. Ingresa a [Firebase Console](https://console.firebase.google.com/) con tu cuenta Google.
2. Crea un proyecto (ej. `encuesta-ucsur`).
3. Ve a **Firestore Database** -> **Crear base de datos** -> Selecciona **"Modo de prueba"**.
4. Ve a la tuerca ⚙️ de Configuración del Proyecto -> Registrar aplicación Web (`</>`).
5. Copia tus credenciales en el archivo [`firebase-config.js`](file:///c:/xampp/htdocs/encuesta/firebase-config.js):
```javascript
export const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```
6. ¡Listo! Todas las respuestas se guardarán en la nube en tiempo real.
