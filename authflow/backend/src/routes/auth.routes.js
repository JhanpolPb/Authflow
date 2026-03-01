const router = require('express').Router();
const { login, register, refresh, logout, me } = require('../controllers/auth.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { loginRules, registerRules, handleValidationErrors } = require('../middleware/validation.middleware');

// Rutas públicas
router.post('/login',   loginRules,    handleValidationErrors, login);
router.post('/refresh', refresh);
router.post('/logout',  logout);

// Solo admins pueden crear usuarios directamente desde aquí
router.post('/register', verifyToken, requireRole('admin'), registerRules, handleValidationErrors, register);

// Ruta protegida
router.get('/me', verifyToken, me);

module.exports = router;
