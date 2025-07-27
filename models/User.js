const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true
    },
    apellido: {
        type: String,
        required: [true, 'El apellido es obligatorio'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+\@.+\..+/, 'Por favor, introduce un email válido']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
    },
    // Referencia al perfil del usuario, se llenará después del registro.
    userProfile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserProfile'
    },
    // Referencia al onboarding clínico, se llenará después del perfil.
    clinicalOnboarding: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClinicalOnboarding'
    },
    // Referencia al plan de terapia generado por la IA.
    therapyPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TherapyPlan'
    }
}, {
    timestamps: true, // Añade automáticamente los campos createdAt y updatedAt
    toJSON: { virtuals: true }, // Asegura que las propiedades virtuales se incluyan en las respuestas JSON
    toObject: { virtuals: true }
});

// Propiedad virtual para determinar si el perfil de usuario está completo.
// Esto no se guarda en la BD, se calcula al momento de la consulta.
UserSchema.virtual('isProfileComplete').get(function() {
    // El perfil se considera completo si el campo userProfile tiene un ObjectId.
    return !!this.userProfile;
});

// Propiedad virtual para determinar si el onboarding clínico está completo.
// Requiere que el campo 'clinicalOnboarding' esté poblado.
UserSchema.virtual('isOnboardingComplete').get(function() {
    // El onboarding se considera completo si el objeto poblado existe y su flag es true.
    return this.clinicalOnboarding ? this.clinicalOnboarding.isOnboardingComplete : false;
});

// Hook (middleware) de Mongoose para hashear la contraseña antes de guardarla
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('User', UserSchema);