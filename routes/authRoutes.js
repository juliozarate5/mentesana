const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController.js');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API para autenticación de usuarios
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - apellido
 *               - email
 *               - password
 *             properties:
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       '201':
 *         description: Usuario registrado exitosamente. Devuelve un token y el objeto del nuevo usuario.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNj..."
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       '400':
 *         description: Datos inválidos o el usuario ya existe
 *       '500':
 *         description: Error del servidor
 */
router.post('/register', registerUser);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesión y obtiene el token y los datos del usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       '200':
 *         description: Login exitoso. Devuelve un token y el objeto completo del usuario con sus perfiles asociados.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNj..."
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       '400':
 *         description: Credenciales inválidas
 *       '500':
 *         description: Error del servidor
 */
router.post('/login', loginUser);

module.exports = router;