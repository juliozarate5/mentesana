const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const dailyMoodController = require('../controllers/dailyMoodController');
const { protect } = require('../middleware/authMiddleware.js');

/**
 * @swagger
 * tags:
 *   name: Mood Tracking
 *   description: Endpoints para el registro y seguimiento del estado de ánimo diario.
 */

/**
 * @swagger
 * /api/moods:
 *   post:
 *     summary: Registra el estado de ánimo diario de un usuario.
 *     tags: [Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LogMoodRequest'
 *     responses:
 *       '201':
 *         description: Estado de ánimo registrado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg: { type: 'string' }
 *                 moodEntry:
 *                   $ref: '#/components/schemas/DailyMood'
 *       '400':
 *         description: Datos de entrada inválidos.
 *       '401':
 *         description: No autorizado.
 *       '500':
 *         description: Error interno del servidor.
 */
router.post(
    '/',
    [
        protect,
        check('mood', 'El estado de ánimo debe ser un número obligatorio entre 1 y 5.').isInt({ min: 1, max: 5 })
    ],
    dailyMoodController.logDailyMood
);

/**
 * @swagger
 * /api/moods/history:
 *   get:
 *     summary: Obtiene el historial de los últimos 30 registros de ánimo del usuario.
 *     tags: [Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Una lista con el historial de estados de ánimo.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DailyMood'
 *       '401':
 *         description: No autorizado.
 *       '500':
 *         description: Error interno del servidor.
 */
router.get(
    '/history',
    protect,
    dailyMoodController.getMoodHistory
);

/**
 * @swagger
 * /api/moods/voice:
 *   post:
 *     summary: Registra el estado de ánimo analizando un archivo de voz.
 *     tags: [Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               voiceMessage:
 *                 type: string
 *                 format: binary
 *                 description: El archivo de audio a analizar (e.g., .wav, .mp3, .ogg).
 *     responses:
 *       '201':
 *         description: Estado de ánimo registrado exitosamente a partir del análisis de voz.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DailyMood'
 *       '400':
 *         description: No se proporcionó un archivo de voz.
 *       '401':
 *         description: No autorizado.
 */
router.post('/voice', protect, dailyMoodController.logMoodFromVoice);

/**
 * @swagger
 * /api/moods/photo:
 *   post:
 *     summary: Registra el estado de ánimo analizando una foto del rostro.
 *     tags: [Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               facePhoto:
 *                 type: string
 *                 format: binary
 *                 description: El archivo de imagen a analizar (e.g., .jpeg, .png).
 *     responses:
 *       '201':
 *         description: Estado de ánimo registrado exitosamente a partir del análisis facial.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DailyMood'
 *       '400':
 *         description: No se proporcionó un archivo de imagen.
 *       '401':
 *         description: No autorizado.
 */
router.post('/photo', protect, dailyMoodController.logMoodFromPhoto);

module.exports = router;