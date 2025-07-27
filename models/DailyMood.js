const mongoose = require('mongoose');
const { Schema } = mongoose;

const DailyMoodSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    mood: {
        type: Number,
        required: [true, 'El estado de ánimo es obligatorio.'],
        min: 1,
        max: 5
        // Escala: 1: Muy mal, 2: Mal, 3: Normal, 4: Bien, 5: Muy bien
    },
    note: {
        type: String,
        trim: true,
        maxlength: 500
    },
    voiceAnalysis: {
        type: String,
        trim: true
    },
    faceAnalysis: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

DailyMoodSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('DailyMood', DailyMoodSchema);