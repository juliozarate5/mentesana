const User = require('../models/User.js');
const ClinicalOnboarding = require('../models/ClinicalOnboarding.js');
const asyncHandler = require('../utils/asyncHandler.js');

/**
 * @desc    Completar el onboarding clínico del usuario
 * @route   POST /api/onboarding/clinical
 * @access  Private
 */
const completeClinicalOnboarding = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const user = await User.findById(userId);
    // Prerrequisito: el usuario debe tener su perfil completo
    if (!user.userProfile) {
        res.status(400);
        throw new Error('Debe completar su perfil de usuario antes de iniciar el onboarding clínico.');
    }

    // Evitar que se complete más de una vez
    const existingOnboarding = await ClinicalOnboarding.findOne({ user: userId });
    if (existingOnboarding) {
        res.status(400);
        throw new Error('El onboarding clínico ya ha sido completado.');
    }

    // Crear el nuevo registro de onboarding
    const newOnboarding = await ClinicalOnboarding.create({
        user: userId,
        ...req.body
    });

    // Actualizar la referencia en el documento del usuario
    await User.findByIdAndUpdate(userId, { clinicalOnboarding: newOnboarding._id });

    res.status(201).json(newOnboarding);
});

module.exports = { completeClinicalOnboarding };