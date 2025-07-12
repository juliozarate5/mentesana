const errorHandler = (err, req, res, next) => {
	let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
	let message = err.message;

	// Manejar errores específicos de Mongoose para respuestas más claras
	if (err.name === 'ValidationError') {
		statusCode = 400;
		message = Object.values(err.errors).map(val => val.message).join(', ');
	}

	if (err.name === 'CastError' && err.kind === 'ObjectId') {
		statusCode = 404;
		message = 'Recurso no encontrado.';
	}

	res.status(statusCode).json({
		message: message,
		stack: process.env.NODE_ENV === 'production' ? null : err.stack,
	});
};

module.exports = { errorHandler };