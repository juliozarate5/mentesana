const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const asyncHandler = require('../utils/asyncHandler.js');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        // Obtener el token del encabezado "Bearer <token>"
        token = req.headers.authorization.split(' ')[1];

        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Obtener el usuario del token y adjuntarlo al objeto de la solicitud
        req.user = await User.findById(decoded.user.id).select('-password');

        if (!req.user) {
            res.status(401);
            throw new Error('No autorizado, usuario no encontrado');
        }

        next();
    } else {
        res.status(401);
        throw new Error('No autorizado, no se proporcionó un token');
    }
});

module.exports = { protect };