# 📚 Sistema de Control de Asistencias Escolar

Sistema completo de gestión de asistencias escolares con aplicación web (Node.js + Express) y aplicación móvil (Android - Kotlin).

---

## 🎯 Descripción del Sistema

Este sistema permite:
- **Página Web**: Gestión completa de carreras, semestres, materias, grupos, alumnos y horarios por administradores y prefectos
- **App Móvil**: Registro de asistencias por maestros en tiempo real

---

## 🗄️ Estructura de la Base de Datos

### Jerarquía del Sistema:
```
Carrera
  ├── Semestres (1-12)
  ├── Materias
  └── PlanEstudios (Carrera + Semestre + Materia)
      └── Grupos (con turno, periodo, año)
          └── Alumnos (con foto en Base64)
              └── Asignaciones (Grupo + Materia + Maestro + Horario)
                  └── Asistencias
```

### Tablas Principales:
- **Carreras**: Programas educativos
- **Semestres**: Periodos académicos por carrera
- **Materias**: Asignaturas por carrera
- **PlanEstudios**: Relaciona qué materias se cursan en qué semestre
- **Grupos**: Grupos de alumnos (Ej: 3A Matutino)
- **Alumnos**: Estudiantes con foto en Base64
- **Maestros**: Profesores y usuarios del sistema (admin, prefecto, maestro)
- **Horarios**: 40 bloques de tiempo (5 días × 8 bloques)
- **Asignaciones**: Relaciona Grupo + Materia + Maestro + Horario
- **Asistencias**: Registros de asistencia diaria

---

## 🚀 Instalación y Configuración

### 1. Prerrequisitos
- Node.js (v14 o superior)
- MySQL (v8 o superior)
- Git

### 2. Clonar el Repositorio
```bash
git clone <url-del-repositorio>
cd proyectofinal
```

### 3. Instalar Dependencias
```bash
npm install
```

### 4. Crear la Base de Datos

#### Paso 1: Crear la base de datos
```sql
CREATE DATABASE SistemaAsistenciaEscolar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE SistemaAsistenciaEscolar;
```

#### Paso 2: Crear las tablas
Ejecuta el script SQL proporcionado en las instrucciones para crear todas las tablas:
- Carreras
- Semestres
- Materias
- PlanEstudios
- Grupos
- Alumnos
- Maestros
- Horarios
- Asignaciones
- Asistencias

#### Paso 3: Inicializar Horarios
```bash
# Ejecuta el archivo inicializar_horarios.sql
mysql -u root -p SistemaAsistenciaEscolar < inicializar_horarios.sql
```

Este script crea 40 horarios:
- 5 días (Lunes a Viernes)
- 8 bloques por día (07:00 - 14:10)
- Receso de 30 min entre bloque 4 y 5 (10:20 - 10:50)

### 5. Configurar Conexión a Base de Datos

Edita `modules/model.js` con tus credenciales:

```javascript
const conexion = mysql.createConnection({
    host: "localhost",          // Tu host
    port: 3306,                 // Tu puerto
    user: "root",               // Tu usuario
    password: "tu_password",    // Tu contraseña
    database: "SistemaAsistenciaEscolar"
});
```

### 6. Crear Usuario Administrador Inicial

```sql
INSERT INTO Maestros (nombre_usuario, contrasena, tipo_usuario, nombre_completo, apellido_paterno, activo)
VALUES ('admin', 'admin123', 'admin', 'Administrador', 'Sistema', TRUE);
```

### 7. Iniciar el Servidor
```bash
npm start
```

El servidor estará corriendo en: `http://localhost:4000`

---

## 📱 Uso del Sistema

### Acceso Web
1. Abre tu navegador en `http://localhost:4000`
2. Inicia sesión con las credenciales del administrador
3. Navega por las diferentes secciones

### Flujo de Trabajo Recomendado:

#### 1️⃣ Configuración Inicial
1. **Usuarios del Sistema**: Crear admins y prefectos
2. **Carreras**: Registrar carreras (Ej: ISC, Mecatrónica)
3. **Semestres**: Registrar semestres por cada carrera (1° a 12°)
4. **Materias**: Registrar materias por cada carrera
5. **Plan de Estudios**: Asignar materias a semestres

#### 2️⃣ Gestión de Grupos y Alumnos
6. **Grupos**: Crear grupos (Ej: 3A Matutino, Agosto-Diciembre 2025)
7. **Alumnos**: Registrar alumnos con foto (cascada: Carrera → Semestre → Grupo)

#### 3️⃣ Asignación de Horarios
8. **Maestros**: Registrar maestros del sistema
9. **Asignaciones**: Asignar horarios de clases
   - Seleccionar: Carrera → Grupo → Materia → Maestro → Horario
   - El sistema muestra solo horarios disponibles (no ocupados)

#### 4️⃣ Registro de Asistencias
10. **App Móvil**: Los maestros registran asistencias desde su dispositivo
11. **Visualizar**: Ver estadísticas y reportes

---

## 🎨 Características Principales

### ✨ Página Web (Admin/Prefectos)

#### Gestión de Carreras
- Crear, editar y eliminar carreras
- Código único por carrera

#### Gestión de Semestres
- Crear semestres por carrera (1° a 12°)
- Nombres personalizables
- No permite duplicados por carrera

#### Gestión de Materias
- Materias asignadas a carreras específicas
- Código, horas por semana y créditos
- Filtros por carrera

#### Plan de Estudios
- Vista visual por semestre
- Asignar materias a semestres
- Validación de duplicados
- Tarjetas agrupadas por semestre

#### Gestión de Grupos
- **Cascada**: Carrera → Semestre → Grupo
- Información: turno (Matutino/Vespertino), periodo, año
- Filtros por carrera y semestre

#### Gestión de Alumnos
- **Cascada completa**: Carrera → Semestre → Grupo
- Campos separados: nombre, apellido paterno, apellido materno
- **Carga de foto**: Conversión automática a Base64
- Vista previa de foto antes de guardar
- Validación de matrícula única
- Máximo 2MB por foto

#### Asignaciones de Horarios
- Asignar: Grupo + Materia + Maestro + Horario
- **Horarios disponibles**: Solo muestra horarios libres
- Validación de conflictos:
  - El grupo no puede tener dos clases a la misma hora
  - El maestro no puede estar en dos lugares al mismo tiempo
- Vista por día de la semana
- Filtros por carrera y grupo

#### Visualización de Datos
- Filtros por carrera, semestre y grupo
- Muestra estructura completa del sistema
- Lista de alumnos con fotos por grupo

### 📱 App Móvil (Maestros)
- Login con credenciales
- Ver asignaciones del maestro
- Lista de alumnos con fotos
- Registro rápido de asistencias
- Estados: Asistencia, Falta, Justificante

---

## 🔌 API REST

La API REST está disponible en `/api` y sigue el estándar JSON.

### Principales Endpoints:

#### Autenticación
- `POST /api/login` - Login de usuarios

#### Carreras
- `GET /api/carreras` - Listar carreras
- `POST /api/carreras` - Crear carrera
- `PUT /api/carreras/:id` - Actualizar carrera
- `DELETE /api/carreras/:id` - Eliminar carrera

#### Semestres
- `GET /api/semestres` - Listar semestres
- `GET /api/semestres?id_carrera=X` - Filtrar por carrera
- `POST /api/semestres` - Crear semestre
- `PUT /api/semestres/:id` - Actualizar semestre
- `DELETE /api/semestres/:id` - Eliminar semestre

#### Materias
- `GET /api/materias` - Listar materias
- `GET /api/materias?id_carrera=X` - Filtrar por carrera
- `POST /api/materias` - Crear materia
- `PUT /api/materias/:id` - Actualizar materia
- `DELETE /api/materias/:id` - Eliminar materia

#### Plan de Estudios
- `GET /api/plan-estudios` - Listar plan de estudios
- `GET /api/plan-estudios?id_carrera=X` - Filtrar por carrera
- `POST /api/plan-estudios` - Asignar materia a semestre
- `DELETE /api/plan-estudios/:id` - Quitar materia

#### Grupos
- `GET /api/grupos` - Listar grupos
- `GET /api/grupos?id_carrera=X&id_semestre=Y` - Filtrar
- `POST /api/grupos` - Crear grupo
- `PUT /api/grupos/:id` - Actualizar grupo
- `DELETE /api/grupos/:id` - Eliminar grupo

#### Alumnos
- `GET /api/alumnos` - Listar alumnos
- `GET /api/alumnos/grupo/:id` - Alumnos por grupo
- `POST /api/alumnos` - Registrar alumno (con foto Base64)
- `PUT /api/alumnos/:id` - Actualizar alumno
- `DELETE /api/alumnos/:id` - Eliminar alumno

#### Horarios
- `GET /api/horarios` - Listar todos los horarios
- `GET /api/horarios/disponibles?id_grupo=X&id_maestro=Y` - Horarios libres

#### Asignaciones
- `GET /api/asignaciones` - Listar asignaciones
- `POST /api/asignaciones` - Crear asignación
- `DELETE /api/asignaciones/:id` - Eliminar asignación

#### Asistencias
- `GET /api/asistencias` - Listar asistencias
- `GET /api/asistencias/lista-alumnos?id_asignacion=X` - Lista para pasar
- `POST /api/asistencias/registrar` - Registrar asistencias masivo

---

## 📂 Estructura del Proyecto

```
proyectofinal/
├── app.js                    # Servidor Express principal
├── package.json              # Dependencias del proyecto
├── inicializar_horarios.sql  # Script para crear horarios
├── modules/
│   └── model.js             # Modelo de datos y consultas
├── router/
│   └── apiRouter.js         # Rutas de la API REST
├── utils/
│   ├── BaseModel.js         # Clase base para operaciones DB
│   ├── logger.js            # Sistema de logs
│   └── middleware.js        # Middlewares de validación
├── views/                    # Vistas EJS
│   ├── login.ejs
│   ├── carreras.ejs
│   ├── semestres.ejs
│   ├── materias.ejs
│   ├── planEstudios.ejs
│   ├── grupos.ejs
│   ├── alumnos.ejs
│   ├── asignaciones.ejs
│   ├── usuarios.ejs
│   ├── visualizar.ejs
│   └── partials/
│       ├── header.ejs
│       └── footer.ejs
├── public/
│   ├── css/                 # Estilos CSS
│   │   ├── admin.css
│   │   ├── carreras.css
│   │   ├── semestres.css
│   │   ├── materias.css
│   │   ├── planEstudios.css
│   │   ├── grupos.css
│   │   ├── alumnos.css
│   │   ├── asignaciones.css
│   │   └── ...
│   ├── js/                  # JavaScript frontend
│   │   ├── common.js
│   │   ├── carreras.js
│   │   ├── semestres.js
│   │   ├── materias.js
│   │   ├── planEstudios.js
│   │   ├── grupos.js
│   │   ├── alumnos.js
│   │   ├── asignaciones.js
│   │   └── ...
│   └── img/                 # Imágenes del sistema
└── README.md                # Este archivo
```

---

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Entorno de ejecución
- **Express.js** - Framework web
- **MySQL2** - Driver de MySQL
- **EJS** - Motor de plantillas

### Frontend
- **HTML5** - Estructura
- **CSS3** - Estilos (con gradientes y animaciones)
- **JavaScript (Vanilla)** - Interactividad
- **Font Awesome** - Iconos

---

## 🔐 Seguridad

- Validación de datos en cliente y servidor
- Prevención de SQL Injection con prepared statements
- Verificación de relaciones antes de eliminar
- Validación de duplicados
- Control de acceso por tipo de usuario

---

## 👨‍💻 Desarrollo

### Comandos Útiles
```bash
npm start          # Iniciar servidor
npm run dev        # Modo desarrollo (con nodemon)
```

### Convenciones de Código
- **Base de datos**: snake_case (`id_carrera`, `nombre_carrera`)
- **JavaScript**: camelCase para variables locales
- **SQL**: Nombres descriptivos en español

---

## 📝 Notas Importantes

1. **Fotos de Alumnos**: Se guardan en Base64 en la base de datos (campo LONGTEXT)
2. **Horarios**: Deben inicializarse una sola vez con el script SQL
3. **Cascada**: Siempre seguir el orden: Carrera → Semestre → Grupo → Alumno
4. **Validaciones**: El sistema previene duplicados y conflictos automáticamente
5. **Eliminar**: No se puede eliminar si hay registros relacionados

---

## 🐛 Solución de Problemas

### Error de conexión a MySQL
- Verifica que MySQL esté corriendo
- Comprueba las credenciales en `modules/model.js`
- Asegúrate que la base de datos existe

### Las fotos no se cargan
- Verifica el tamaño (máx 2MB)
- Comprueba el formato (JPG, PNG)
- Revisa que el campo `foto_base64` sea LONGTEXT

### Los horarios no aparecen
- Ejecuta el script `inicializar_horarios.sql`
- Verifica que la tabla Horarios tenga 40 registros

---

## 📞 Soporte

Para reportar problemas o sugerencias, contacta al administrador del sistema.

---

## 📄 Licencia

Este proyecto es de uso educativo.

---

**Desarrollado para el Sistema de Control de Asistencias Escolar** 🎓