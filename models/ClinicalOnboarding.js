const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClinicalOnboardingSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    motivoPrincipal: {
        type: [String],
        enum: ['Ansiedad', 'Tristeza o depresión', 'Insomnio', 'Duelos o pérdidas', 'Rupturas amorosas', 'Estrés laboral o académico', 'Quiero conocerme/mejorar emocionalmente', 'Otro'],
        required: true
    },
    bienestarEmocionalInicial: {
        nerviosoAnsioso: { type: Number, min: 0, max: 3, default: 0 },
        tristeSinEsperanza: { type: Number, min: 0, max: 3, default: 0 }
    },
    frecuenciaDeseada: {
        type: String,
        enum: ['Diario', 'Cada dos días', 'Solo cuando lo necesite']
    },
    preferenciaContenido: {
        type: [String],
        enum: ['Ejercicios guiados', 'Conversación con IA', 'Retos de bienestar', 'Recomendaciones tipo “snack” diario']
    },
    consentimientoInformado: {
        terminosAceptados: { type: Boolean, required: true },
        iaNoReemplazaPsicologo: { type: Boolean, required: true },
        procesamientoDatosAceptado: { type: Boolean, required: true },
        modoAnonimoActivado: { type: Boolean, default: false }
    },
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

// Middleware para marcar el onboarding como completo si se proporcionan los datos necesarios
ClinicalOnboardingSchema.pre('save', function(next) {
    if (this.isNew && this.motivoPrincipal && this.consentimientoInformado.terminosAceptados) {
        this.isOnboardingComplete = true;
    }
    next();
});

module.exports = mongoose.model('ClinicalOnboarding', ClinicalOnboardingSchema);