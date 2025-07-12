const express = require('express');
const router = express.Router();
const { completeUserProfile } = require('../controllers/userController.js');
const { protect } = require('../middleware/authMiddleware.js');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API para la gestión del perfil de usuario
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

module.exports = router;