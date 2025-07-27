const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Registra un nuevo usuario.
 */
exports.registerUser = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400);
        throw new Error(errors.array().map(e => e.msg).join(', '));
    }

    const { nombre, apellido, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
        res.status(400);
        throw new Error('El usuario ya existe');
    }

    user = new User({ nombre, apellido, email, password });
    await user.save(); // La contraseña se hashea con el hook pre-save

    // Preparamos el objeto de usuario para devolverlo, excluyendo la contraseña.
    const userResponse = user.toObject();
    delete userResponse.password;

    const payload = { user: { id: user.id } };

    jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '5h' },
        (err, token) => {
            if (err) throw err;
            res.status(201).json({
                token,
                user: userResponse
            });
        }
    );
});

/**
 * Autentica a un usuario y devuelve un token JWT junto con su plan de terapia.
 */
exports.loginUser = asyncHandler(async (req, res) => {
    // Validar entradas
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400);
        throw new Error(errors.array().map(e => e.msg).join(', '));
    }

    const { email, password } = req.body;

    // 1. Verificar si el usuario existe
    let user = await User.findOne({ email });
    if (!user) {
        res.status(400);
        throw new Error('Credenciales inválidas');
    }

    // 2. Verificar la contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        res.status(400);
        throw new Error('Credenciales inválidas');
    }

    // 3. Si las credenciales son correctas, buscar de nuevo al usuario
    //    y popular (cargar) su plan de terapia asociado.
    const fullUser = await User.findById(user.id)
        .select('-password') // Excluir la contraseña de la respuesta
        .populate('userProfile')
        .populate('clinicalOnboarding')
        .populate('therapyPlan');

    // 4. Crear y firmar el JWT
    const payload = { user: { id: user.id } };

    jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '5h' },
        (err, token) => {
            if (err) throw err;
            res.json({
                token,
                user: fullUser
            });
        }
    );
});