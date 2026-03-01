import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Verificando sesión...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/dashboard" replace />;

  return children;
};
