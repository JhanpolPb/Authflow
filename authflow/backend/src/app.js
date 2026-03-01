require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');

const app = express();

// ─── Middlewares globales ────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth.routes'));
app.use('/api/asistencia', require('./routes/asistencia.routes'));
app.use('/api/usuarios',   require('./routes/usuarios.routes'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_, res) => res.status(404).json({ success: false, message: 'Ruta no encontrada' }));

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

testConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 AuthFlow API corriendo en http://localhost:${PORT}`);
    console.log(`📦 Entorno: ${process.env.NODE_ENV || 'development'}`);
  });
});
