const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserProfileSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    pseudonimo: {
        type: String,
        trim: true
    },
    edad: {
        type: Number,
        required: [true, 'La edad es obligatoria.']
    },
    genero: {
        type: String,
        enum: ['Masculino', 'Femenino', 'No binario', 'Otro', 'Prefiero no decirlo']
    },
    pais: {
        type: String,
        required: [true, 'El país es obligatorio.'],
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);