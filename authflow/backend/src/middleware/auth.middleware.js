const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// ─── Verificar Access Token ───────────────────────────────────────────────────
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que el usuario sigue activo en BD
    const [rows] = await pool.query(
      'SELECT id, nombre, apellido, email, rol, activo FROM usuarios WHERE id = ?',
      [decoded.id]
    );

    if (!rows.length || !rows[0].activo) {
      return res.status(401).json({ success: false, message: 'Usuario inactivo o no encontrado' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
};

// ─── Verificar Rol ────────────────────────────────────────────────────────────
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción',
      });
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };
