const express = require('express');
const router = express.Router();
const { completeClinicalOnboarding } = require('../controllers/onboardingController.js');
const { protect } = require('../middleware/authMiddleware.js');

/**
 * @swagger
 * tags:
 *   name: Onboarding
 *   description: API para el proceso de onboarding clínico
 */

/**
 * @swagger
 * /api/onboarding/clinical:
 *   post:
 *     summary: Completa el onboarding clínico para el usuario logueado
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClinicalOnboarding'
 *     responses:
 *       201:
 *         description: Onboarding completado exitosamente
 *       400:
 *         description: Datos inválidos, perfil no completado o onboarding ya realizado
 *       401:
 *         description: No autorizado
 */
router.post('/clinical', protect, completeClinicalOnboarding);

module.exports = router;