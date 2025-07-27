const ClinicalOnboarding = require('../models/ClinicalOnboarding.js');
const User = require('../models/User.js');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Completa el onboarding clínico para el usuario logueado
 * @route   POST /api/onboarding/clinical
 * @access  Private
 */
exports.completeClinicalOnboarding = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // 1. Verificar que el perfil de usuario esté completo
    const user = await User.findById(userId);
    if (!user.userProfile) {
        res.status(400);
        throw new Error('El perfil de usuario debe completarse antes de iniciar el onboarding clínico.');
    }

    // 2. Verificar que el onboarding no se haya completado previamente
    if (user.clinicalOnboarding) {
        res.status(400);
        throw new Error('El onboarding clínico ya ha sido completado para este usuario.');
    }

    // 3. Crear y guardar el nuevo documento de onboarding
    const onboardingData = { ...req.body, user: userId };
    const clinicalOnboarding = new ClinicalOnboarding(onboardingData);
    await clinicalOnboarding.save();

    // 4. Vincular el onboarding al documento del usuario
    user.clinicalOnboarding = clinicalOnboarding._id;
    await user.save();

    res.status(201).json(clinicalOnboarding);
});