const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Asegura que cada usuario tenga un solo perfil
    },
    pseudonimo: {
        type: String,
        trim: true
    },
    edad: {
        type: Number,
        required: [true, 'La edad es obligatoria para continuar'],
        min: [13, 'Debes ser mayor de 13 años para usar la aplicación.']
    },
    genero: {
        type: String,
        enum: ['Masculino', 'Femenino', 'No binario', 'Otro', 'Prefiero no decirlo']
    },
    pais: {
        type: String,
        trim: true,
        required: [true, 'El país es obligatorio para continuar']
    },
    // Este campo se puede usar para controlar el flujo de la app
    isProfileComplete: {
        type: Boolean,
        default: true // Se asume completo al crearse con los datos requeridos
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);