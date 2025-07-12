const User = require('../models/User.js');
const UserProfile = require('../models/UserProfile.js');
const asyncHandler = require('../utils/asyncHandler.js');

/**
 * @desc    Crear o actualizar el perfil de un usuario
 * @route   POST /api/users/profile
 * @access  Private
 */
const completeUserProfile = asyncHandler(async (req, res) => {
    const { edad, pais } = req.body;
    const userId = req.user.id; // Obtenido del middleware de autenticación

    if (!edad || !pais) {
        res.status(400);
        throw new Error('La edad y el país son obligatorios.');
    }

    // Busca si ya existe un perfil para evitar duplicados
    let userProfile = await UserProfile.findOne({ user: userId });
    let statusCode = 200; // OK por defecto para actualizaciones

    if (userProfile) {
        // Si ya existe, lo actualiza
        userProfile = await UserProfile.findByIdAndUpdate(userProfile._id, req.body, { new: true, runValidators: true });
    } else {
        // Si no existe, crea uno nuevo
        userProfile = await UserProfile.create({
            user: userId,
            ...req.body
        });
        // Actualiza la referencia en el documento del usuario
        await User.findByIdAndUpdate(userId, { userProfile: userProfile._id });
        statusCode = 201; // Created
    }

    res.status(statusCode).json(userProfile);
});

module.exports = { completeUserProfile };