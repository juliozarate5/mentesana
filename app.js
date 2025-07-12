const express = require('express')
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorMiddleware.js');

const app = express()

app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Permite métodos
        allowedHeaders: ['Content-Type', 'Authorization'], // Cabeceras permitidas
    })
)
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Middleware para servir archivos estáticos
app.use('/uploads', express.static('uploads'));

// --- Rutas de la API ---
app.use('/api/auth', require('./routes/authRoutes.js'));
app.use('/api/users', require('./routes/userRoutes.js'));
app.use('/api/onboarding', require('./routes/onboardingRoutes.js'));

// --- Configuración de Swagger ---
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Terapia Conversacional con IA',
            version: '1.0.0',
            description: 'Documentación de la API para la aplicación de bienestar emocional',
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                UserProfile: {
                    type: 'object',
                    required: ['edad', 'pais'],
                    properties: {
                        pseudonimo: { type: 'string', description: 'Alias opcional para el usuario' },
                        edad: { type: 'number', description: 'Edad del usuario', example: 25 },
                        genero: { type: 'string', enum: ['Masculino', 'Femenino', 'No binario', 'Otro', 'Prefiero no decirlo'] },
                        pais: { type: 'string', description: 'País de residencia del usuario', example: 'España' }
                    }
                },
                ClinicalOnboarding: {
                    type: 'object',
                    properties: {
                        motivoPrincipal: {
                            type: 'array',
                            items: { type: 'string', enum: ['Ansiedad', 'Tristeza o depresión', 'Insomnio', 'Duelos o pérdidas', 'Rupturas amorosas', 'Estrés laboral o académico', 'Quiero conocerme/mejorar emocionalmente', 'Otro'] }
                        },
                        bienestarEmocionalInicial: {
                            type: 'object',
                            properties: {
                                nerviosoAnsioso: { type: 'number', min: 0, max: 3, example: 2 },
                                tristeSinEsperanza: { type: 'number', min: 0, max: 3, example: 1 }
                            }
                        },
                        frecuenciaDeseada: { type: 'string', enum: ['Diario', 'Cada dos días', 'Solo cuando lo necesite'] },
                        preferenciaContenido: {
                            type: 'array',
                            items: { type: 'string', enum: ['Ejercicios guiados', 'Conversación con IA', 'Retos de bienestar', 'Recomendaciones tipo “snack” diario'] }
                        },
                        consentimientoInformado: {
                            type: 'object',
                            required: ['terminosAceptados', 'iaNoReemplazaPsicologo', 'procesamientoDatosAceptado'],
                            properties: {
                                terminosAceptados: { type: 'boolean', example: true },
                                iaNoReemplazaPsicologo: { type: 'boolean', example: true },
                                procesamientoDatosAceptado: { type: 'boolean', example: true },
                                modoAnonimoActivado: { type: 'boolean', example: false }
                            }
                        },
                        informacionAvanzada: {
                            type: 'object',
                            properties: {
                                nivelEducativo: { type: 'string' },
                                diagnosticoPrevio: { type: 'string' },
                                enTerapiaOMedicacion: { type: 'boolean' },
                                herramientasAnteriores: { type: 'array', items: { type: 'string' } }
                            }
                        }
                    }
                }
            }
        },
    },
    apis: ['./routes/*.js'], // Apunta a los archivos de rutas para encontrar los comentarios de Swagger
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- Ruta para manejar 404 ---
// Debe ir después de todas las rutas válidas
app.use((req, res) => {
    return res.status(404).json({
        msj: 'Not Found',
        status: 404,
    })
})

// --- Manejador de errores global ---
// Debe ser el último middleware
app.use(errorHandler);

module.exports = app