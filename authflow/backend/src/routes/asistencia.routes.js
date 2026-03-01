// ─── asistencia.routes.js ─────────────────────────────────────────────────────
const router = require('express').Router();
const { checkIn, checkOut, registroHoy, historial, reporte } = require('../controllers/asistencia.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

router.use(verifyToken); // Todas requieren autenticación

router.post('/checkin',  checkIn);
router.post('/checkout', checkOut);
router.get('/hoy',       registroHoy);
router.get('/historial', historial);
router.get('/reporte',   requireRole('admin'), reporte);

module.exports = router;
