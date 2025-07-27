const TherapyPlan = require('../models/TherapyPlan');
const User = require('../models/User');
const ClinicalOnboarding = require('../models/ClinicalOnboarding');
const UserProfile = require('../models/UserProfile');
const geminiService = require('../services/geminiService');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const DailyMood = require('../models/DailyMood');

/**
 * Crea el plan de terapia inicial para un usuario.
 * Se debe llamar después de que el onboarding clínico esté completo.
 */
exports.createInitialPlan = asyncHandler(async (req, res) => {
    const userId = req.user.id; // Asumimos que el ID del usuario viene del middleware de auth

    // Verificar si ya existe un plan para no duplicarlo
    const existingPlan = await TherapyPlan.findOne({ user: userId });
    if (existingPlan) {
        res.status(400);
        throw new Error('El usuario ya tiene un plan de terapia.');
    }

    // 1. Obtener los datos necesarios del usuario
    const userProfile = await UserProfile.findOne({ user: userId });
    const clinicalOnboarding = await ClinicalOnboarding.findOne({ user: userId });

    if (!userProfile || !clinicalOnboarding || !clinicalOnboarding.isOnboardingComplete) {
        res.status(400);
        throw new Error('El perfil y el onboarding deben estar completos para generar un plan.');
    }

    // 2. Generar el plan de terapia con Gemini
    const generatedPlan = await geminiService.generateInitialTherapyPlan(userProfile, clinicalOnboarding);

    // 3. Crear y guardar el nuevo documento de TherapyPlan
    const newPlan = new TherapyPlan({
        user: userId,
        ...generatedPlan
    });
    await newPlan.save();

    // 4. Vincular el plan al usuario
    await User.findByIdAndUpdate(userId, { therapyPlan: newPlan._id });

    res.status(201).json({
        msg: 'Plan de terapia inicial generado y guardado exitosamente.',
        plan: newPlan
    });
});

/**
 * Obtiene el plan de terapia actual del usuario.
 */
exports.getCurrentPlan = asyncHandler(async (req, res) => {
    const plan = await TherapyPlan.findOne({ user: req.user.id });
    if (!plan) {
        res.status(404);
        throw new Error('No se encontró un plan de terapia para este usuario.');
    }
    res.json(plan);
});

/**
 * Obtiene el historial de versiones del plan de terapia del usuario.
 */
exports.getPlanHistory = asyncHandler(async (req, res) => {
    const plan = await TherapyPlan.findOne({ user: req.user.id }).select('historial');
    if (!plan) {
        res.status(404);
        throw new Error('No se encontró un plan de terapia para este usuario.');
    }
    res.json(plan.historial);
});

exports.updateWeekStatus = asyncHandler(async (req, res) => {
    const { weekNumber } = req.params;
    const { completado } = req.body;

    // Validación más robusta: verifica que 'completado' exista y sea un booleano.
    if (completado === undefined || typeof completado !== 'boolean') {
        res.status(400);
        throw new Error('El cuerpo de la solicitud debe contener el campo "completado" con un valor booleano (true o false).');
    }

    const plan = await TherapyPlan.findOne({ user: req.user.id });

    if (!plan) {
        res.status(404);
        throw new Error('No se encontró un plan de terapia para este usuario.');
    }

    const weekIndex = plan.planSemanal.findIndex(w => w.semana == weekNumber);

    if (weekIndex === -1) {
        res.status(404);
        throw new Error(`La semana ${weekNumber} no se encontró en el plan.`);
    }

    plan.planSemanal[weekIndex].completado = completado;
    await plan.save();

    res.json(plan);
});

/**
 * Adapta el plan de terapia basado en el progreso, historial de ánimo y perfil del usuario.
 */
exports.adaptPlan = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    // We still need the current plan to pass to Gemini
    const currentPlan = await TherapyPlan.findOne({ user: userId });
    if (!currentPlan) {
        res.status(404);
        throw new Error('No se encontró un plan de terapia para adaptar.');
    }

    const userProfile = await UserProfile.findOne({ user: userId });
    const clinicalOnboarding = await ClinicalOnboarding.findOne({ user: userId });
    const moodHistory = await DailyMood.find({ user: userId }).sort({ date: -1 }).limit(30);

    if (!userProfile || !clinicalOnboarding) {
        res.status(400);
        throw new Error('Falta información del perfil o del onboarding para adaptar el plan.');
    }

    const adaptedPlanData = await geminiService.adaptTherapyPlan(currentPlan, userProfile, clinicalOnboarding, moodHistory);

    // ** THE FIX **
    // Remove the 'historial' field from the AI's response to prevent update conflicts.
    // The history is managed separately by the $push operator below.
    delete adaptedPlanData.historial;

    // Prepare the history entry
    const planToHistory = {
        plan: {
            terapiaRecomendada: currentPlan.terapiaRecomendada,
            resumen: currentPlan.resumen,
            planSemanal: currentPlan.planSemanal
        },
        motivoActualizacion: 'Adaptación periódica del plan basada en progreso y estado general.'
    };

    // Perform an atomic update using findOneAndUpdate to prevent versioning errors
    const updatedPlan = await TherapyPlan.findOneAndUpdate(
        { user: userId },
        {
            $set: adaptedPlanData, // Set the new plan data from Gemini
            $push: {
                historial: {
                    $each: [planToHistory],
                    $position: 0, // Add to the beginning of the array
                    $slice: 10    // Keep only the 10 most recent history entries
                }
            }
        },
        { new: true, runValidators: true } // Return the updated document
    );

    if (!updatedPlan) {
        res.status(404);
        throw new Error('No se pudo encontrar y actualizar el plan de terapia.');
    }

    res.json({ msg: 'El plan de terapia ha sido adaptado a tu progreso.', plan: updatedPlan });
});