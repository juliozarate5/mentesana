const express = require('express');
const router = express.Router();
const { completeUserProfile, getCurrentUser } = require('../controllers/userController.js');
const { protect } = require('../middleware/authMiddleware.js');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API para la gestión del perfil de usuario
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Obtiene el perfil completo del usuario autenticado.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Devuelve la información del usuario junto con sus perfiles asociados
 *       (UserProfile, ClinicalOnboarding, TherapyPlan).
 *     responses:
 *       '200':
 *         description: Datos del usuario obtenidos exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '401':
 *         description: No autorizado.
 *       '404':
 *         description: Usuario no encontrado.
 */

/**
 * @swagger
 * /api/users/profile:
 *   post:
 *     summary: Crea o actualiza el perfil del usuario logueado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserProfile'
 *     responses:
 *       201:
 *         description: Perfil creado exitosamente
 *       200:
 *         description: Perfil actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/profile', protect, completeUserProfile);

router.get('/me', protect, getCurrentUser);

module.exports = router;