const express = require('express')
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorMiddleware.js');
const fileUpload = require('express-fileupload');

const app = express()

app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Permite métodos
        allowedHeaders: ['Content-Type', 'Authorization'], // Cabeceras permitidas
    })
)
app.use(express.json())

// Middleware para manejar la subida de archivos
app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10 MB por archivo
}));
app.use(express.urlencoded({ extended: false }))

// Middleware para servir archivos estáticos
app.use('/uploads', express.static('uploads'));

// --- Rutas de la API ---
app.use('/api/auth', require('./routes/authRoutes.js'));
app.use('/api/users', require('./routes/userRoutes.js'));
app.use('/api/onboarding', require('./routes/onboardingRoutes.js'));
app.use('/api/moods', require('./routes/dailyMoodRoutes.js'));
app.use('/api/therapy-plan', require('./routes/therapyPlanRoutes.js'));

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
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '60c72b2f9b1d8c001f8e4d29' },
                        nombre: { type: 'string', example: 'Juan' },
                        apellido: { type: 'string', example: 'Pérez' },
                        email: { type: 'string', example: 'juan.perez@example.com' },
                        userProfile: {
                            description: 'El perfil demográfico del usuario (puede ser el ID o el objeto poblado).',
                            oneOf: [{ type: 'string' }, { '$ref': '#/components/schemas/UserProfile' }]
                        },
                        clinicalOnboarding: {
                            description: 'El onboarding clínico del usuario (puede ser el ID o el objeto poblado).',
                            oneOf: [{ type: 'string' }, { '$ref': '#/components/schemas/ClinicalOnboarding' }]
                        },
                        therapyPlan: {
                            description: 'El plan de terapia del usuario (puede ser el ID o el objeto poblado).',
                            oneOf: [{ type: 'string' }, { '$ref': '#/components/schemas/TherapyPlan' }]
                        }
                    }
                },
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
                },
                TherapyPlan: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', description: 'ID único del plan de terapia.', example: '60c72b2f9b1d8c001f8e4d2a' },
                        user: { type: 'string', description: 'ID del usuario al que pertenece el plan.', example: '60c72b2f9b1d8c001f8e4d29' },
                        terapiaRecomendada: { type: 'string', description: 'Nombre de la terapia recomendada por la IA.', example: 'Terapia Cognitivo-Conductual (TCC)' },
                        resumen: { type: 'string', description: 'Breve resumen del plan de terapia.', example: 'Un plan de 4 semanas enfocado en identificar y reestructurar patrones de pensamiento negativos.' },
                        planSemanal: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    semana: { type: 'number', example: 1 },
                                    tema: { type: 'string', example: 'Introducción a la TCC y psicoeducación' },
                                    meta: { type: 'string', example: 'Comprender la relación entre pensamientos, emociones y conductas.' },
                                    articulos: { type: 'array', items: { type: 'string' }, example: ['Artículo: ¿Qué es la reestructuración cognitiva?'] },
                                    ejercicios: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                titulo: { type: 'string', example: 'Registro de Pensamientos Automáticos' },
                                                pasos: { type: 'array', items: { type: 'string' }, example: ['Paso 1: Identifica la situación.', 'Paso 2: Anota la emoción que sentiste.', 'Paso 3: Escribe el pensamiento automático que tuviste.'] }
                                            }
                                        }
                                    },
                                    videos: { type: 'array', items: { type: 'string' }, example: ['Video: El modelo ABC de la TCC explicado'] },
                                    justificacion: { type: 'string', description: 'Razón de la última actualización de esta semana.', example: 'Ajustado para incluir una técnica de respiración debido al estrés reportado.' },
                                    completado: { type: 'boolean', example: false }
                                }
                            }
                        },
                        historial: {
                            type: 'array',
                            description: 'Historial de versiones anteriores del plan.',
                            items: {
                                type: 'object'
                            }
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                UpdateEmotionalStateRequest: {
                    type: 'object',
                    required: ['emotionalState'],
                    properties: {
                        emotionalState: {
                            type: 'string',
                            description: 'El estado emocional reportado por el usuario.',
                            example: 'Estresado por el trabajo'
                        }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        msg: { type: 'string', description: 'Mensaje de error descriptivo.' },
                        status: { type: 'number', description: 'Código de estado HTTP (opcional).' }
                    }
                },
                DailyMood: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '60c72b2f9b1d8c001f8e4d2b' },
                        user: { type: 'string', example: '60c72b2f9b1d8c001f8e4d29' },
                        mood: {
                            type: 'number',
                            description: 'Valor numérico del estado de ánimo (1: Muy mal, 2: Mal, 3: Normal, 4: Bien, 5: Muy bien).',
                            example: 4
                        },
                        note: {
                            type: 'string',
                            description: 'Nota opcional sobre el estado de ánimo.',
                            example: 'Tuve un buen día en el trabajo.'
                        },
                        voiceAnalysis: {
                            type: 'string',
                            description: 'Análisis textual del estado de ánimo generado por la IA a partir de un mensaje de voz.',
                            example: 'El tono de voz es enérgico y el ritmo es rápido, lo que sugiere un estado de ánimo positivo.'
                        },
                        faceAnalysis: {
                            type: 'string',
                            description: 'Análisis textual del estado de ánimo generado por la IA a partir de una foto del rostro.',
                            example: 'La sonrisa y los ojos entrecerrados sugieren un estado de alegría.'
                        },
                        date: { type: 'string', format: 'date-time' }
                    }
                },
                LogMoodRequest: {
                    type: 'object',
                    required: ['mood'],
                    properties: {
                        mood: {
                            type: 'number',
                            description: 'El estado de ánimo seleccionado en una escala de 1 a 5 (1: Muy mal, 5: Muy bien).',
                            minimum: 1,
                            maximum: 5,
                            example: 4
                        },
                        note: {
                            type: 'string',
                            description: 'Una nota opcional para dar contexto al estado de ánimo.'
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