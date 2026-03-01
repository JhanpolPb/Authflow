const { body, validationResult } = require('express-validator');

// ─── Manejador de errores de validación ──────────────────────────────────────
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Error de validación',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Reglas de validación ─────────────────────────────────────────────────────
const loginRules = [
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
];

const registerRules = [
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido').isLength({ max: 100 }),
  body('apellido').trim().notEmpty().withMessage('El apellido es requerido').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/).withMessage('Debe contener al menos una mayúscula')
    .matches(/[0-9]/).withMessage('Debe contener al menos un número'),
  body('rol')
    .optional()
    .isIn(['admin', 'empleado']).withMessage('Rol inválido'),
];

const updateUserRules = [
  body('nombre').optional().trim().notEmpty().isLength({ max: 100 }),
  body('apellido').optional().trim().notEmpty().isLength({ max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('activo').optional().isBoolean(),
  body('rol').optional().isIn(['admin', 'empleado']),
];

module.exports = {
  handleValidationErrors,
  loginRules,
  registerRules,
  updateUserRules,
};
