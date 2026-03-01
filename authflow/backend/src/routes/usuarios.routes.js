const router = require('express').Router();
const { listar, obtener, actualizar, eliminar } = require('../controllers/usuarios.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { updateUserRules, handleValidationErrors } = require('../middleware/validation.middleware');

router.use(verifyToken);
router.use(requireRole('admin')); // Solo admins

router.get('/',     listar);
router.get('/:id',  obtener);
router.put('/:id',  updateUserRules, handleValidationErrors, actualizar);
router.delete('/:id', eliminar);

module.exports = router;
