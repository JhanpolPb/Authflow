const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateAccessToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }

    const usuario = rows[0];
    const passwordValido = await bcrypt.compare(password, usuario.password);

    if (!passwordValido) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }

    const accessToken = generateAccessToken(usuario);
    const refreshToken = generateRefreshToken(usuario);

    // Guardar refresh token en BD
    const expiraEn = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (usuario_id, token, expira_en) VALUES (?, ?, ?)',
      [usuario.id, refreshToken, expiraEn]
    );

    const { password: _, ...usuarioSinPassword } = usuario;

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        usuario: usuarioSinPassword,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ─── POST /api/auth/register ─────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { nombre, apellido, email, password, rol = 'empleado' } = req.body;

    const [existe] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existe.length) {
      return res.status(409).json({ success: false, message: 'El email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, apellido, email, password, rol) VALUES (?, ?, ?, ?, ?)',
      [nombre, apellido, email, passwordHash, rol]
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: { id: result.insertId, nombre, apellido, email, rol },
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token requerido' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    const [rows] = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = ? AND usuario_id = ? AND expira_en > NOW()',
      [refreshToken, decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Refresh token inválido o expirado' });
    }

    const [usuarios] = await pool.query(
      'SELECT id, nombre, apellido, email, rol FROM usuarios WHERE id = ? AND activo = 1',
      [decoded.id]
    );

    if (!usuarios.length) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }

    const newAccessToken = generateAccessToken(usuarios[0]);

    res.json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Refresh token inválido' });
  }
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }

    res.json({ success: true, message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const me = async (req, res) => {
  res.json({ success: true, data: req.user });
};

module.exports = { login, register, refresh, logout, me };
