const User = require('../models/User.js');
const bcrypt = require('bcryptjs');
const jwt =require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler.js');

// Función auxiliar para generar un token JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

/**
 * @desc    Registrar un nuevo usuario
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
    const { nombre, apellido, email, password } = req.body;

    if (!nombre || !apellido || !email || !password) {
        res.status(400);
        throw new Error('Por favor, complete todos los campos');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('El usuario ya existe con ese email');
    }

    const user = await User.create({ nombre, apellido, email, password });

    if (user) {
        res.status(201).json({
            _id: user.id,
            nombre: user.nombre,
            email: user.email,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Datos de usuario inválidos');
    }
});

/**
 * @desc    Autenticar (login) un usuario
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user.id,
            nombre: user.nombre,
            email: user.email,
            token: generateToken(user._id),
            isProfileComplete: !!user.userProfile, // Devuelve true si el perfil existe
            isOnboardingComplete: !!user.clinicalOnboarding, // Devuelve true si el onboarding existe
        });
    } else {
        res.status(401);
        throw new Error('Email o contraseña inválidos');
    }
});

module.exports = { registerUser, loginUser };