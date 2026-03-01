import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { asistenciaService } from '../../services/api';

const formatTime = (dt) => dt ? new Date(dt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '--:--';
const formatDuration = (min) => {
  if (!min) return '0h 0min';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}min`;
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [registro, setRegistro]   = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState(null);

  const cargarDatos = useCallback(async () => {
    const [hoyRes, histRes] = await Promise.all([
      asistenciaService.hoy(),
      asistenciaService.historial({ limit: 7 }),
    ]);
    setRegistro(hoyRes.data.data);
    setHistorial(histRes.data.data);
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const handleAccion = async (tipo) => {
    setLoading(true);
    setMsg(null);
    try {
      tipo === 'checkin'
        ? await asistenciaService.checkIn()
        : await asistenciaService.checkOut();
      await cargarDatos();
      setMsg({ tipo: 'success', texto: tipo === 'checkin' ? 'Entrada registrada' : 'Salida registrada' });
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.response?.data?.message || 'Error al registrar' });
    } finally {
      setLoading(false);
    }
  };

  const estado = !registro ? 'sin-registro'
    : !registro.hora_entrada ? 'sin-entrada'
    : !registro.hora_salida  ? 'activo'
    : 'completado';

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar-brand">AuthFlow</div>
        <div className="topbar-user">
          <span>{user.nombre} {user.apellido}</span>
          <span className="badge badge-empleado">{user.rol}</span>
          <button className="btn btn-ghost" onClick={logout}>Salir</button>
        </div>
      </header>

      <main className="main-content">
        <h2 className="page-title">Panel de Empleado</h2>
        <p className="page-subtitle">{new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

        {msg && (
          <div className={`alert alert-${msg.tipo}`}>{msg.texto}</div>
        )}

        {/* ── Tarjeta de registro hoy ── */}
        <div className="card card-checkin">
          <h3>Registro de Hoy</h3>
          <div className="checkin-times">
            <div className="time-block">
              <span className="time-label">Entrada</span>
              <span className="time-value entrada">{formatTime(registro?.hora_entrada)}</span>
            </div>
            <div className="time-divider">→</div>
            <div className="time-block">
              <span className="time-label">Salida</span>
              <span className="time-value salida">{formatTime(registro?.hora_salida)}</span>
            </div>
            <div className="time-block">
              <span className="time-label">Duración</span>
              <span className="time-value">{formatDuration(registro?.duracion_min)}</span>
            </div>
          </div>

          <div className="checkin-actions">
            {estado === 'sin-registro' || estado === 'sin-entrada' ? (
              <button
                className="btn btn-success btn-lg"
                onClick={() => handleAccion('checkin')}
                disabled={loading}
              >
                {loading ? 'Registrando...' : '🟢 Registrar Entrada'}
              </button>
            ) : estado === 'activo' ? (
              <button
                className="btn btn-danger btn-lg"
                onClick={() => handleAccion('checkout')}
                disabled={loading}
              >
                {loading ? 'Registrando...' : '🔴 Registrar Salida'}
              </button>
            ) : (
              <div className="estado-completado"> Jornada completada hoy</div>
            )}
          </div>
        </div>

        {/* ── Historial reciente ── */}
        <div className="card">
          <h3>Últimos 7 registros</h3>
          {historial.length === 0 ? (
            <p className="empty-msg">Sin registros recientes</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Entrada</th>
                  <th>Salida</th>
                  <th>Duración</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.fecha).toLocaleDateString('es-CO')}</td>
                    <td>{formatTime(r.hora_entrada)}</td>
                    <td>{formatTime(r.hora_salida)}</td>
                    <td>{formatDuration(r.duracion_min)}</td>
                    <td>
                      <span className={`badge ${r.hora_salida ? 'badge-success' : 'badge-warning'}`}>
                        {r.hora_salida ? 'Completo' : 'Sin salida'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
