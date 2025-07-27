const DailyMood = require('../models/DailyMood');
const { validationResult } = require('express-validator');
const geminiService = require('../services/geminiService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Registra un nuevo estado de ánimo diario para el usuario autenticado.
 */
exports.logDailyMood = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400);
        throw new Error(errors.array().map(e => e.msg).join(', '));
    }

    const { mood, note } = req.body;
    const userId = req.user.id;

    const newMoodEntry = new DailyMood({
        user: userId,
        mood,
        note
    });

    await newMoodEntry.save();

    res.status(201).json({
        msg: 'Estado de ánimo registrado exitosamente.',
        moodEntry: newMoodEntry
    });
});

/**
 * Obtiene el historial de estados de ánimo del usuario (últimos 30).
 */
exports.getMoodHistory = asyncHandler(async (req, res) => {
    const history = await DailyMood.find({ user: req.user.id }).sort({ date: -1 }).limit(30);
    res.json(history);
});

/**
 * Registra un estado de ánimo analizando un mensaje de voz.
 */
exports.logMoodFromVoice = asyncHandler(async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0 || !req.files.voiceMessage) {
        res.status(400);
        throw new Error('No se ha subido ningún archivo de voz.');
    }

    const voiceFile = req.files.voiceMessage;

    const analysis = await geminiService.analyzeMoodFromVoice(voiceFile);

    const newMoodEntry = new DailyMood({ user: req.user.id, mood: analysis.moodScore, voiceAnalysis: analysis.description });
    await newMoodEntry.save();

    res.status(201).json({ msg: 'Estado de ánimo registrado exitosamente a partir de la voz.', moodEntry: newMoodEntry });
});

/**
 * Registra un estado de ánimo analizando una foto del rostro.
 */
exports.logMoodFromPhoto = asyncHandler(async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0 || !req.files.facePhoto) {
        res.status(400);
        throw new Error('No se ha subido ninguna foto.');
    }

    const photoFile = req.files.facePhoto;

    const analysis = await geminiService.analyzeMoodFromPhoto(photoFile);

    const newMoodEntry = new DailyMood({ user: req.user.id, mood: analysis.moodScore, faceAnalysis: analysis.description });
    await newMoodEntry.save();

    res.status(201).json({ msg: 'Estado de ánimo registrado exitosamente a partir de la foto.', moodEntry: newMoodEntry });
});