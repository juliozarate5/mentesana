const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
    throw new Error("La variable de entorno GEMINI_API_KEY no está definida. Por favor, añádela a tu archivo .env");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configuración para el modelo, incluyendo la salida en formato JSON.
// const generationConfig = {
//     responseMimeType: "application/json",
// };

/**
 * Genera una ruta de terapia inicial basada en los datos del onboarding.
 * @param {object} userProfile - El perfil del usuario de la BD.
 * @param {object} clinicalOnboarding - El onboarding clínico del usuario de la BD.
 * @returns {Promise<object>} - Un objeto con la ruta de terapia generada.
 */
async function generateInitialTherapyPlan(userProfile, clinicalOnboarding) {
    // El "prompt" es la clave. Debe ser detallado y pedir una estructura específica.
    const prompt = `
    Eres un psicólogo experto en crear planes de terapia personalizados.
    Basado en la siguiente información de un usuario que acaba de completar su onboarding, genera una ruta de terapia inicial.

    Información del usuario:
    - Edad: ${userProfile.edad}
    - Género: ${userProfile.genero}
    - País: ${userProfile.pais}
    - Principales motivos de consulta: ${clinicalOnboarding.motivoPrincipal.join(", ")}
    - Nivel de ansiedad reciente (0-3, donde 3 es máximo): ${clinicalOnboarding.bienestarEmocionalInicial.nerviosoAnsioso}
    - Nivel de tristeza reciente (0-3, donde 3 es máximo): ${clinicalOnboarding.bienestarEmocionalInicial.tristeSinEsperanza}
    - Preferencias de contenido: ${clinicalOnboarding.preferenciaContenido.join(", ")}

    TAREA:
    1. Analiza la información del usuario y considera al menos dos enfoques terapéuticos posibles (ej: Terapia Cognitivo-Conductual, Terapia de Aceptación y Compromiso, Mindfulness, Terapia Centrada en Soluciones).
    2. Elige el enfoque que consideres MÁS adecuado para este caso específico.
    3. Determina una duración óptima para el plan inicial (entre 3 y 5 semanas) basándote en la complejidad de los motivos de consulta. Un caso más complejo podría necesitar 5 semanas, uno más sencillo podría necesitar 3 o 4.
    4. Genera la ruta de terapia para la duración que determinaste. Para cada semana, define:
       - Un "tema" principal.
       - Una "meta" clara.
       - Contenido de apoyo: al menos un "articulo" recomendado, un "ejercicio" práctico y un "video" sugerido. Para cada "ejercicio", proporciona un "titulo" y un array de "pasos" detallados sobre cómo realizarlo.

    Tu respuesta DEBE ser un bloque de código markdown con un objeto JSON que tenga la siguiente estructura exacta. No incluyas texto fuera del bloque de código markdown.
    Sé creativo y específico en tus recomendaciones, evitando planes genéricos. El plan debe reflejar claramente la información del usuario proporcionada.

    \`\`\`json
    {
      "terapiaRecomendada": "string (el nombre de la terapia que has elegido)",
      "resumen": "string (Un breve resumen del plan. Justifica por qué elegiste esta terapia sobre otras posibles alternativas para este usuario específico.)",
      "planSemanal": [
        { "semana": 1, "tema": "string", "meta": "string", "articulos": ["string"], "ejercicios": [{ "titulo": "string", "pasos": ["string"] }], "videos": ["string"] }
      ]
    }
    \`\`\`
    `;

    // DEBUG: Imprime el prompt en la consola para verificar que los datos dinámicos se están insertando.
    console.log("--- PROMPT PARA GENERAR PLAN INICIAL ---");
    console.log(prompt);

    return await callGemini(prompt);
}

/**
 * Adapta un plan de terapia existente basado en el progreso, historial de ánimo y perfil del usuario.
 * @param {object} currentPlan - El plan de terapia actual del usuario.
 * @param {object} userProfile - El perfil del usuario.
 * @param {object} clinicalOnboarding - Los datos del onboarding clínico.
 * @param {Array} moodHistory - Historial de los últimos registros de ánimo.
 * @returns {Promise<object>} - Un objeto con la ruta de terapia actualizada.
 */
async function adaptTherapyPlan(currentPlan, userProfile, clinicalOnboarding, moodHistory) {
    // Convert Mongoose documents to plain objects to ensure clean JSON stringification
    const safeCurrentPlan = currentPlan.toObject();
    const safeUserProfile = userProfile.toObject();
    const safeClinicalOnboarding = clinicalOnboarding.toObject();

    const progressSummary = `Progreso actual: ${currentPlan.planSemanal.filter(w => w.completado).map(w => `Semana ${w.semana} completada`).join(', ') || 'Ninguna semana completada aún.'}`;

    const historyText = moodHistory && moodHistory.length > 0
        ? `Historial de ánimo reciente (escala 1-5):\n${moodHistory.map(m => {
            let entry = `- Fecha: ${new Date(m.date).toLocaleDateString()}, Ánimo: ${m.mood}/5`;
            if (m.note) entry += `, Nota del usuario: "${m.note}"`;
            if (m.voiceAnalysis) entry += `, Análisis de Voz: "${m.voiceAnalysis}"`;
            if (m.faceAnalysis) entry += `, Análisis Facial: "${m.faceAnalysis}"`;
            return entry;
          }).join('\n')}`
        : "No hay historial de ánimo reciente.";

    const prompt = `
    Eres un psicólogo experto que revisa el progreso de un paciente para adaptar su plan de terapia.

    DATOS DEL PACIENTE:
    - Perfil: ${JSON.stringify(safeUserProfile)}
    - Onboarding Inicial: ${JSON.stringify(safeClinicalOnboarding)}

    PLAN DE TERAPIA ACTUAL:
    ${JSON.stringify(safeCurrentPlan)}

    PROGRESO Y ESTADO RECIENTE:
    - ${progressSummary}
    - ${historyText}

    TAREA:
    Basado en TODA la información anterior (perfil, onboarding, progreso y ánimo), revisa y adapta el plan de terapia. La duración del plan puede mantenerse o ajustarse (entre 3 y 5 semanas en total) si lo consideras clínicamente apropiado.
    - Para cada semana, asegúrate de que haya contenido de apoyo relevante: artículos, videos y ejercicios con un título y pasos detallados.
    - Si el progreso es bueno y el ánimo es consistentemente positivo, considera proponer actividades ligeramente más avanzadas o incluso acortar el plan si los objetivos principales se están cumpliendo.
    - Si el progreso es lento o el ánimo es bajo o volátil, refuerza conceptos básicos o introduce técnicas de afrontamiento en las próximas semanas, actualizando el contenido de apoyo.
    - Si el plan ya es adecuado, puedes mantenerlo, pero justifica por qué.

    Devuelve el plan COMPLETO y actualizado (con su duración ajustada si es el caso) EXCLUSIVAMENTE como un bloque de código markdown con un objeto JSON que tenga la misma estructura del plan original. No incluyas texto fuera del bloque de código markdown.
    Añade una clave "justificacion" a CUALQUIER semana que modifiques, explicando el motivo del cambio basado en los datos proporcionados.

    \`\`\`json
    {
      "terapiaRecomendada": "string",
      "resumen": "string",
      "planSemanal": [
        { "semana": 1, "tema": "string", "meta": "string", "articulos": ["string"], "ejercicios": [{ "titulo": "string", "pasos": ["string"] }], "videos": ["string"] }
      ]
    }
    \`\`\`
    `;

    // DEBUG: Imprime el prompt en la consola para verificar que los datos dinámicos se están insertando.
    console.log("--- PROMPT PARA ADAPTAR PLAN ---");
    console.log(prompt);

    return await callGemini(prompt);
}

/**
 * Analiza un archivo de audio para determinar el estado de ánimo del hablante.
 * @param {object} audioFile - El objeto de archivo de audio de express-fileupload.
 * @returns {Promise<{moodScore: number, description: string}>} - El puntaje y la descripción del ánimo.
 */
async function analyzeMoodFromVoice(audioFile) {
    const prompt = `
    Analiza el siguiente clip de audio. Basándote en el tono, el ritmo, la inflexión y la energía de la voz, determina el estado de ánimo de la persona.
    Devuelve tu respuesta EXCLUSIVAMENTE como un bloque de código markdown con un objeto JSON que tenga la siguiente estructura. No incluyas texto fuera del bloque de código markdown.
    \`\`\`json
    {
      "moodScore": number,
      "description": "string"
    }
    \`\`\`
    El 'moodScore' debe ser un número entero del 1 al 5 (1=Muy mal, 2=Mal, 3=Normal, 4=Bien, 5=Muy bien).
    La 'description' debe ser un breve resumen en español de tu análisis vocal que justifique la puntuación.
    `;

    const audioPart = {
        inlineData: {
            data: audioFile.data.toString("base64"),
            mimeType: audioFile.mimetype,
        },
    };

    // Para peticiones multimodales, el prompt y el audio se envían en un array.
    const contents = [prompt, audioPart];

    return await callGemini(contents);
}

/**
 * Analiza una foto del rostro de una persona para determinar su estado de ánimo.
 * @param {object} photoFile - El objeto de archivo de imagen de express-fileupload.
 * @returns {Promise<{moodScore: number, description: string}>} - El puntaje y la descripción del ánimo.
 */
async function analyzeMoodFromPhoto(photoFile) {
    const prompt = `
    Analiza la siguiente foto del rostro de una persona. Tu tarea es describir la expresión facial y inferir un posible estado de ánimo momentáneo.

    Instrucciones:
    1.  Describe los indicadores faciales que observas (ojos, boca, cejas). Por ejemplo, si ves una sonrisa, descríbela. Si ves una expresión neutra o triste, descríbela.
    2.  Basado en esos indicadores, asigna una puntuación de ánimo en 'moodScore'.
    3.  En el campo 'description', genera una descripción breve en español que resuma tu análisis. Por ejemplo: "Se observa una sonrisa y ojos entrecerrados, indicadores comunes de alegría." o "La expresión es neutra, con los labios rectos, lo que podría sugerir un estado de ánimo calmado o bajo."
    4.  Es CRUCIAL que NO realices un diagnóstico clínico como "depresión". Tu análisis debe basarse únicamente en la expresión visible en la foto.

    Devuelve tu respuesta EXCLUSIVAMENTE como un bloque de código markdown con un objeto JSON que tenga la siguiente estructura. No incluyas texto fuera del bloque de código markdown.
    \`\`\`json
    {
      "moodScore": number,
      "description": "string"
    }
    \`\`\`
    El 'moodScore' debe ser un número entero del 1 al 5 (1=Muy mal, 2=Mal, 3=Normal, 4=Bien, 5=Muy bien).
    `;

    const imagePart = {
        inlineData: {
            data: photoFile.data.toString("base64"),
            mimeType: photoFile.mimetype,
        },
    };

    // Para peticiones multimodales, el prompt y la imagen se envían en un array.
    const contents = [prompt, imagePart];

    return await callGemini(contents);
}

/**
 * Función genérica para llamar a la API de Gemini y parsear la respuesta.
 * @param {string} prompt - El prompt a enviar.
 * @returns {Promise<object>}
 */
async function callGemini(prompt) {
    try {
        // WARNING: Adjusting safety settings is necessary for therapy-related content
        // but should be done with care. These settings lower the threshold for what is blocked.
        const safetySettings = [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
        ];

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            // generationConfig,
            safetySettings,
        });

        const result = await model.generateContent(prompt); // prompt can be string or array for multimodal
        const response = result.response;

        // Check if the response was blocked by safety settings before proceeding
        if (!response || !response.text) {
            const blockReason = response?.promptFeedback?.blockReason;
            console.error("Respuesta de Gemini bloqueada. Razón:", blockReason, "Detalles:", response?.promptFeedback);
            throw new Error(`La respuesta de la IA fue bloqueada por políticas de seguridad. Razón: ${blockReason}`);
        }

        const text = response.text();

        // DEBUG: Log the raw response to see what Gemini is returning
        console.log("--- RAW RESPONSE FROM GEMINI ---");
        console.log(text);

        // Robust JSON parsing: extract the JSON block from markdown code fences
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);

        if (!match || !match[1]) {
            throw new Error("No se encontró un objeto JSON válido en la respuesta de la IA.");
        }

        const jsonString = match[1];
        return JSON.parse(jsonString);
    } catch (error) {
        // Log the full, detailed error for better debugging
        console.error("Error detallado al llamar a la API de Gemini:", error);
        throw new Error("No se pudo generar la respuesta del asistente de IA.");
    }
}

module.exports = {
    generateInitialTherapyPlan,
    adaptTherapyPlan,
    analyzeMoodFromVoice,
    analyzeMoodFromPhoto,
};