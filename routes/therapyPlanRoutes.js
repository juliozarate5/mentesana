const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const therapyPlanController = require('../controllers/therapyPlanController');
const { protect } = require('../middleware/authMiddleware.js'); // Asumiendo que tienes un middleware de autenticación

/**
 * @swagger
 * tags:
 *   name: Therapy Plan
 *   description: Operaciones relacionadas con el plan de terapia generado por IA.
 */

/**
 * @swagger
 * /api/therapy-plan:
 *   post:
 *     summary: Crea un plan de terapia inicial para el usuario autenticado.
 *     tags: [Therapy Plan]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Genera un plan de terapia personalizado utilizando la IA de Gemini basado en el perfil y
 *       el onboarding clínico del usuario. Este endpoint debe ser llamado después de que el usuario
 *       haya completado su onboarding.
 *     responses:
 *       '201':
 *         description: Plan de terapia creado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TherapyPlan'
 *       '400':
 *         description: Solicitud incorrecta (ej. el onboarding no está completo o el plan ya existe).
 *       '401':
 *         description: No autorizado (token no válido o no proporcionado).
 *       '500':
 *         description: Error interno del servidor.
 */
router.post(
    '/',
    protect,
    therapyPlanController.createInitialPlan
);

/**
 * @swagger
 * /api/therapy-plan/current:
 *   get:
 *     summary: Obtiene el plan de terapia actual del usuario autenticado.
 *     tags: [Therapy Plan]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: El plan de terapia actual del usuario.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TherapyPlan'
 *       '401':
 *         description: No autorizado.
 *       '404':
 *         description: No se encontró un plan de terapia para este usuario.
 *       '500':
 *         description: Error interno del servidor.
 */
router.get(
    '/current',
    protect,
    therapyPlanController.getCurrentPlan
);

/**
 * @swagger
 * /api/therapy-plan/history:
 *   get:
 *     summary: Obtiene el historial de versiones del plan de terapia.
 *     tags: [Therapy Plan]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Una lista con las versiones anteriores del plan de terapia.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       '401':
 *         description: No autorizado.
 *       '404':
 *         description: No se encontró un plan de terapia.
 */
router.get('/history', protect, therapyPlanController.getPlanHistory);

/**
 * @swagger
 * /api/therapy-plan/week/{weekNumber}:
 *   patch:
 *     summary: Marca una semana del plan como completada o no completada.
 *     tags: [Therapy Plan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: weekNumber
 *         required: true
 *         schema:
 *           type: integer
 *         description: El número de la semana a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - completado
 *             properties:
 *               completado:
 *                 type: boolean
 *                 description: El nuevo estado de completado para la semana.
 *                 example: true
 *     responses:
 *       '200':
 *         description: El plan de terapia actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TherapyPlan'
 *       '400':
 *         description: Datos inválidos.
 *       '401':
 *         description: No autorizado.
 *       '404':
 *         description: Plan o semana no encontrados.
 */
router.patch('/week/:weekNumber', protect, therapyPlanController.updateWeekStatus);

/**
 * @swagger
 * /api/therapy-plan/adapt:
 *   post:
 *     summary: Adapta el plan de terapia de forma holística.
 *     tags: [Therapy Plan]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Activa una revisión completa por parte de la IA del plan de terapia del usuario.
 *       La IA considera el perfil del usuario, el onboarding, el historial de ánimo y el progreso
 *       de los ejercicios completados para proponer un plan adaptado y mejorado.
 *     responses:
 *       '200':
 *         description: El plan de terapia ha sido adaptado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "El plan de terapia ha sido adaptado a tu progreso."
 *                 plan:
 *                   $ref: '#/components/schemas/TherapyPlan'
 *       '400':
 *         description: Falta información del usuario para realizar la adaptación.
 *       '401':
 *         description: No autorizado.
 *       '404':
 *         description: No se encontró un plan de terapia para adaptar.
 *       '500':
 *         description: Error interno del servidor.
 */
router.post('/adapt', protect, therapyPlanController.adaptPlan);

module.exports = router;