const mongoose = require('mongoose');

const ClinicalOnboardingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Cada usuario tiene un solo registro de onboarding
    },
    // 2. Motivo principal para usar la app
    motivoPrincipal: {
        type: [String],
        enum: [
            'Ansiedad', 'Tristeza o depresión', 'Insomnio', 'Duelos o pérdidas',
            'Rupturas amorosas', 'Estrés laboral o académico',
            'Quiero conocerme/mejorar emocionalmente', 'Otro'
        ],
        required: true
    },
    // 3. Cuestionario rápido de bienestar emocional inicial (línea base)
    bienestarEmocionalInicial: {
        // "En las últimas dos semanas, ¿qué tan seguido te has sentido nervioso, ansioso o al borde?"
        nerviosoAnsioso: { type: Number, min: 0, max: 3 }, // Escala de 0 a 3
        // "En las últimas dos semanas, ¿qué tan seguido te has sentido triste o sin esperanza?"
        tristeSinEsperanza: { type: Number, min: 0, max: 3 }, // Escala de 0 a 3
        fecha: { type: Date, default: Date.now }
    },
    // 4. Disponibilidad y frecuencia deseada
    frecuenciaDeseada: {
        type: String,
        enum: ['Diario', 'Cada dos días', 'Solo cuando lo necesite'],
        required: true
    },
    preferenciaContenido: {
        type: [String],
        enum: [
            'Ejercicios guiados', 'Conversación con IA',
            'Retos de bienestar', 'Recomendaciones tipo “snack” diario'
        ],
        default: []
    },
    // 5. Consentimiento informado
    consentimientoInformado: {
        terminosAceptados: { type: Boolean, required: true },
        iaNoReemplazaPsicologo: { type: Boolean, required: true },
        procesamientoDatosAceptado: { type: Boolean, required: true },
        modoAnonimoActivado: { type: Boolean, default: false }
    },
    // 6. Opcional (para versión avanzada)
    informacionAvanzada: {
        nivelEducativo: String,
        diagnosticoPrevio: String,
        enTerapiaOMedicacion: Boolean,
        herramientasAnteriores: [String]
    },
    isOnboardingComplete: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Middleware para marcar el onboarding como completo si se cumplen las condiciones
ClinicalOnboardingSchema.pre('save', function(next) {
    const ci = this.consentimientoInformado;
    if (
        this.motivoPrincipal.length > 0 && this.frecuenciaDeseada &&
        ci.terminosAceptados && ci.iaNoReemplazaPsicologo && ci.procesamientoDatosAceptado
    ) {
        this.isOnboardingComplete = true;
    }
    next();
});

module.exports = mongoose.model('ClinicalOnboarding', ClinicalOnboardingSchema);