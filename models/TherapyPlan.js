const mongoose = require('mongoose');
const { Schema } = mongoose;

const EjercicioSchema = new Schema({
    titulo: { type: String, required: true },
    pasos: { type: [String], required: true }
}, { _id: false });

const PlanSemanalSchema = new Schema({
    semana: { type: Number, required: true },
    tema: { type: String, required: true },
    meta: { type: String, required: true },
    articulos: { type: [String], default: [] },
    ejercicios: { type: [EjercicioSchema], default: [] },
    videos: { type: [String], default: [] },
    justificacion: String, // Para guardar la razón de las actualizaciones
    completado: { type: Boolean, default: false }
}, { _id: false });

const TherapyPlanSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    terapiaRecomendada: { type: String, required: true },
    resumen: { type: String, required:true },
    planSemanal: [PlanSemanalSchema],
    historial: [{
        plan: {
            terapiaRecomendada: String,
            resumen: String,
            planSemanal: [PlanSemanalSchema]
        },
        fecha: { type: Date, default: Date.now },
        motivoActualizacion: String // ej: "Reporte de estado emocional: Estresado"
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('TherapyPlan', TherapyPlanSchema);