#  AuthFlow – Sistema de Gestión de Usuarios con Autenticación

Sistema Full Stack de control de asistencia empresarial (Check-in / Check-out) con autenticación JWT, roles de usuario y panel de administración.

---

##  Arquitectura del Proyecto

```
authflow/
├── backend/
│   ├── src/
│   │   ├── app.js                    # Entry point / Express
│   │   ├── config/
│   │   │   ├── database.js           # Pool de conexión MySQL
│   │   │   └── schema.sql            # Schema BD + datos iniciales
│   │   ├── controllers/
│   │   │   ├── auth.controller.js    # login, register, refresh, logout
│   │   │   ├── asistencia.controller.js  # check-in, check-out, historial
│   │   │   └── usuarios.controller.js    # CRUD usuarios (admin)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js    # verifyToken, requireRole
│   │   │   └── validation.middleware.js  # express-validator rules
│   │   └── routes/
│   │       ├── auth.routes.js
│   │       ├── asistencia.routes.js
│   │       └── usuarios.routes.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx                   # Router principal
    │   ├── index.css                 # Estilos globales
    │   ├── context/
    │   │   └── AuthContext.jsx       # Estado global de auth
    │   ├── services/
    │   │   └── api.js                # Axios + interceptors JWT
    │   └── components/
    │       ├── auth/
    │       │   ├── Login.jsx
    │       │   └── PrivateRoute.jsx
    │       ├── dashboard/
    │       │   └── Dashboard.jsx     # Panel empleado
    │       └── admin/
    │           └── AdminPanel.jsx    # Panel admin
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

##  Instalación y configuración

### 1. Base de datos MySQL

```sql
-- Ejecutar el archivo schema:
mysql -u root -p < backend/src/config/schema.sql
```

Esto crea la base de datos `authflow_db` con las tablas `usuarios`, `registros_asistencia` y `refresh_tokens`, además de un usuario admin inicial.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales de MySQL y JWT secret

npm install
npm run dev        # Desarrollo con nodemon
# npm start        # Producción
```

El servidor arranca en **http://localhost:5000**

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

La app arranca en **http://localhost:5173** (Vite proxea `/api` → puerto 5000)

---

##  Credenciales iniciales

| Campo | Valor |
|-------|-------|
| Email | admin@authflow.com |
| Password | 123456 |
| Rol | admin |

> ⚠️ Cambia esta contraseña en producción.

---

## 📡 API REST – Endpoints

### Auth (públicos)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/refresh` | Renovar access token |
| POST | `/api/auth/logout` | Cerrar sesión |

### Auth (protegidos)
| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/auth/me` | todos | Perfil del usuario autenticado |
| POST | `/api/auth/register` | admin | Crear nuevo usuario |

### Asistencia (requieren JWT)
| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| POST | `/api/asistencia/checkin` | todos | Registrar entrada |
| POST | `/api/asistencia/checkout` | todos | Registrar salida |
| GET | `/api/asistencia/hoy` | todos | Registro del día actual |
| GET | `/api/asistencia/historial` | todos | Historial paginado |
| GET | `/api/asistencia/reporte` | admin | Reporte por empleado |

### Usuarios (solo admin)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/usuarios` | Listar usuarios |
| GET | `/api/usuarios/:id` | Obtener usuario |
| PUT | `/api/usuarios/:id` | Actualizar usuario |
| DELETE | `/api/usuarios/:id` | Desactivar usuario |

---

##  Flujo de Autenticación JWT

```
Login ──► accessToken (8h) + refreshToken (7d)
          │
          ▼
    Cada request: Authorization: Bearer <accessToken>
          │
          ▼
    Si 401 TOKEN_EXPIRED ──► interceptor llama /auth/refresh
                              ──► nuevo accessToken automáticamente
```

#Autor

Jhanpol Parra
---

##  Schema de BD

```
usuarios
  id, nombre, apellido, email, password (bcrypt), rol, activo, created_at

registros_asistencia
  id, usuario_id (FK), fecha, hora_entrada, hora_salida, duracion_min, observaciones

refresh_tokens
  id, usuario_id (FK), token, expira_en
```

---

##  Seguridad implementada

- Contraseñas hasheadas con **bcrypt** (salt 10)
- Tokens **JWT** firmados con secret de entorno
- Middleware **verifyToken** valida token Y estado del usuario en BD
- Middleware **requireRole** para proteger rutas por rol
- **Refresh token rotation** almacenado en BD
- Validación de inputs con **express-validator**
- CORS restringido al origen del frontend
