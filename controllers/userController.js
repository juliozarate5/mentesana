const User = require('../models/User.js');
const UserProfile = require('../models/UserProfile.js');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Crea o actualiza el perfil demográfico de un usuario.
 * @route   POST /api/users/profile
 * @access  Private
 */
exports.completeUserProfile = asyncHandler(async (req, res) => {
    const { pseudonimo, edad, genero, pais } = req.body;
    const userId = req.user.id;

    let userProfile = await UserProfile.findOne({ user: userId });

    if (userProfile) {
        // Actualizar perfil existente
        userProfile = await UserProfile.findOneAndUpdate(
            { user: userId },
            { $set: { pseudonimo, edad, genero, pais } },
            { new: true, runValidators: true }
        );
        return res.status(200).json(userProfile);
    }

    // Crear nuevo perfil
    userProfile = new UserProfile({ user: userId, pseudonimo, edad, genero, pais });
    await userProfile.save();

    // Vincular el perfil al documento del usuario
    await User.findByIdAndUpdate(userId, { userProfile: userProfile._id });

    res.status(201).json(userProfile);
});

/**
 * @desc    Obtiene el perfil completo del usuario autenticado.
 * @route   GET /api/users/me
 * @access  Private
 */
exports.getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)
        .select('-password') // Excluir la contraseña de la respuesta
        .populate('userProfile')
        .populate('clinicalOnboarding')
        .populate('therapyPlan');

    res.json(user);
});