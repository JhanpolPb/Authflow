const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// ─── GET /api/usuarios ────────────────────────────────────────────────────────
const listar = async (req, res) => {
  try {
    const { activo, rol, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, nombre, apellido, email, rol, activo, created_at
      FROM usuarios WHERE 1=1
    `;
    const params = [];

    if (activo !== undefined) { query += ' AND activo = ?'; params.push(activo); }
    if (rol) { query += ' AND rol = ?'; params.push(rol); }
    if (search) {
      query += ' AND (nombre LIKE ? OR apellido LIKE ? OR email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY apellido, nombre LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, params);
    const [count] = await pool.query('SELECT COUNT(*) as total FROM usuarios', []);

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count[0].total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ─── GET /api/usuarios/:id ────────────────────────────────────────────────────
const obtener = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, apellido, email, rol, activo, created_at FROM usuarios WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ─── PUT /api/usuarios/:id ────────────────────────────────────────────────────
const actualizar = async (req, res) => {
  try {
    const { nombre, apellido, email, rol, activo, password } = req.body;
    const campos = [];
    const valores = [];

    if (nombre !== undefined)   { campos.push('nombre = ?');   valores.push(nombre); }
    if (apellido !== undefined) { campos.push('apellido = ?'); valores.push(apellido); }
    if (email !== undefined)    { campos.push('email = ?');    valores.push(email); }
    if (rol !== undefined)      { campos.push('rol = ?');      valores.push(rol); }
    if (activo !== undefined)   { campos.push('activo = ?');   valores.push(activo); }
    if (password)               { campos.push('password = ?'); valores.push(await bcrypt.hash(password, 10)); }

    if (!campos.length) {
      return res.status(400).json({ success: false, message: 'No se enviaron campos a actualizar' });
    }

    valores.push(req.params.id);
    await pool.query(`UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`, valores);

    const [updated] = await pool.query(
      'SELECT id, nombre, apellido, email, rol, activo FROM usuarios WHERE id = ?',
      [req.params.id]
    );

    res.json({ success: true, message: 'Usuario actualizado', data: updated[0] });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'El email ya está en uso' });
    }
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ─── DELETE /api/usuarios/:id (desactivar) ────────────────────────────────────
const eliminar = async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'No puedes desactivar tu propio usuario' });
    }
    await pool.query('UPDATE usuarios SET activo = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Usuario desactivado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = { listar, obtener, actualizar, eliminar };
