const { pool } = require('../config/database');

// ─── POST /api/asistencia/checkin ─────────────────────────────────────────────
const checkIn = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const ahora = new Date();
    const hoy = ahora.toISOString().split('T')[0];

    // Verificar si ya hay registro hoy
    const [existe] = await pool.query(
      'SELECT * FROM registros_asistencia WHERE usuario_id = ? AND fecha = ?',
      [usuarioId, hoy]
    );

    if (existe.length) {
      if (existe[0].hora_entrada) {
        return res.status(409).json({
          success: false,
          message: 'Ya registraste tu entrada hoy',
          data: existe[0],
        });
      }
    }

    let registro;

    if (existe.length) {
      await pool.query(
        'UPDATE registros_asistencia SET hora_entrada = ? WHERE usuario_id = ? AND fecha = ?',
        [ahora, usuarioId, hoy]
      );
      const [updated] = await pool.query(
        'SELECT * FROM registros_asistencia WHERE usuario_id = ? AND fecha = ?',
        [usuarioId, hoy]
      );
      registro = updated[0];
    } else {
      const [result] = await pool.query(
        'INSERT INTO registros_asistencia (usuario_id, fecha, hora_entrada) VALUES (?, ?, ?)',
        [usuarioId, hoy, ahora]
      );
      const [created] = await pool.query(
        'SELECT * FROM registros_asistencia WHERE id = ?',
        [result.insertId]
      );
      registro = created[0];
    }

    res.status(201).json({
      success: true,
      message: 'Entrada registrada exitosamente',
      data: registro,
    });
  } catch (error) {
    console.error('Error en checkIn:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ─── POST /api/asistencia/checkout ───────────────────────────────────────────
const checkOut = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const ahora = new Date();
    const hoy = ahora.toISOString().split('T')[0];
    const { observaciones } = req.body;

    const [rows] = await pool.query(
      'SELECT * FROM registros_asistencia WHERE usuario_id = ? AND fecha = ?',
      [usuarioId, hoy]
    );

    if (!rows.length || !rows[0].hora_entrada) {
      return res.status(400).json({
        success: false,
        message: 'No has registrado tu entrada hoy',
      });
    }

    if (rows[0].hora_salida) {
      return res.status(409).json({
        success: false,
        message: 'Ya registraste tu salida hoy',
        data: rows[0],
      });
    }

    const entrada = new Date(rows[0].hora_entrada);
    const duracionMin = Math.round((ahora - entrada) / 60000);

    await pool.query(
      `UPDATE registros_asistencia
       SET hora_salida = ?, duracion_min = ?, observaciones = ?
       WHERE usuario_id = ? AND fecha = ?`,
      [ahora, duracionMin, observaciones || null, usuarioId, hoy]
    );

    const [updated] = await pool.query(
      'SELECT * FROM registros_asistencia WHERE usuario_id = ? AND fecha = ?',
      [usuarioId, hoy]
    );

    res.json({
      success: true,
      message: 'Salida registrada exitosamente',
      data: updated[0],
    });
  } catch (error) {
    console.error('Error en checkOut:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ─── GET /api/asistencia/hoy ──────────────────────────────────────────────────
const registroHoy = async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const [rows] = await pool.query(
      'SELECT * FROM registros_asistencia WHERE usuario_id = ? AND fecha = ?',
      [req.user.id, hoy]
    );
    res.json({ success: true, data: rows[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ─── GET /api/asistencia/historial ────────────────────────────────────────────
const historial = async (req, res) => {
  try {
    const { desde, hasta, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const usuarioId = req.user.rol === 'admin' && req.query.usuario_id
      ? req.query.usuario_id
      : req.user.id;

    let query = `
      SELECT ra.*, u.nombre, u.apellido, u.email
      FROM registros_asistencia ra
      JOIN usuarios u ON u.id = ra.usuario_id
      WHERE ra.usuario_id = ?
    `;
    const params = [usuarioId];

    if (desde) { query += ' AND ra.fecha >= ?'; params.push(desde); }
    if (hasta) { query += ' AND ra.fecha <= ?'; params.push(hasta); }

    query += ' ORDER BY ra.fecha DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, params);

    // Total para paginación
    let countQuery = `
      SELECT COUNT(*) as total FROM registros_asistencia WHERE usuario_id = ?
    `;
    const countParams = [usuarioId];
    if (desde) { countQuery += ' AND fecha >= ?'; countParams.push(desde); }
    if (hasta) { countQuery += ' AND fecha <= ?'; countParams.push(hasta); }

    const [countResult] = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error) {
    console.error('Error en historial:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ─── GET /api/asistencia/reporte (admin) ─────────────────────────────────────
const reporte = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const hoy = new Date().toISOString().split('T')[0];

    const [rows] = await pool.query(`
      SELECT
        u.id, u.nombre, u.apellido, u.email,
        COUNT(ra.id) AS dias_trabajados,
        ROUND(AVG(ra.duracion_min), 0) AS promedio_minutos,
        SUM(ra.duracion_min) AS total_minutos,
        SUM(CASE WHEN ra.hora_salida IS NULL AND ra.hora_entrada IS NOT NULL THEN 1 ELSE 0 END) AS sin_salida
      FROM usuarios u
      LEFT JOIN registros_asistencia ra
        ON ra.usuario_id = u.id
        AND ra.fecha BETWEEN ? AND ?
      WHERE u.rol = 'empleado' AND u.activo = 1
      GROUP BY u.id
      ORDER BY u.apellido, u.nombre
    `, [desde || hoy.slice(0, 7) + '-01', hasta || hoy]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error en reporte:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = { checkIn, checkOut, registroHoy, historial, reporte };
