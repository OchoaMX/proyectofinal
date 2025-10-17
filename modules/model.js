import mysql from "mysql2";
import BaseModel from "../utils/BaseModel.js";
import logger from "../utils/logger.js";

// Configuración de conexión para Railway
const conexion = mysql.createConnection({
    host: "centerbeam.proxy.rlwy.net",
    port: 48742,
    user: "root",
    password: "QoeVPzHfoWKnrDHZoxgtXXMreyIQhpnI",
    database: "SistemaAsistenciaEscolar"
});

// Abrir conexión
conexion.connect((error) => {
    if(error){
        logger.error("Error de conexión a la base de datos", error);
    } else {
        logger.info("Conectado a la base de datos SistemaAsistenciaEscolar - Nueva estructura");
    }
});

// Instancia del modelo base
const baseModel = new BaseModel(conexion);
const asistenciaDB = {};

// ========== FUNCIONES PARA CARRERAS ==========
asistenciaDB.insertarCarrera = (carrera) => baseModel.create('Carreras', carrera);
asistenciaDB.obtenerCarreras = () => baseModel.findAll('Carreras', '', [], 'nombre_carrera');
asistenciaDB.obtenerCarreraPorId = (id) => baseModel.findById('Carreras', id, 'id_carrera');
asistenciaDB.actualizarCarrera = (id, carrera) => baseModel.update('Carreras', id, carrera, 'id_carrera');
asistenciaDB.eliminarCarrera = (id) => baseModel.delete('Carreras', id, 'id_carrera');
asistenciaDB.verificarRelacionesCarrera = async (idCarrera) => {
    const totalSemestres = await baseModel.countRelated('Semestres', 'id_carrera', idCarrera);
    const totalMaterias = await baseModel.countRelated('Materias', 'id_carrera', idCarrera);
    const totalGrupos = await baseModel.countRelated('Grupos', 'id_carrera', idCarrera);
    return (totalSemestres + totalMaterias + totalGrupos) > 0;
};

// ========== FUNCIONES PARA SEMESTRES ==========
asistenciaDB.insertarSemestre = (semestre) => baseModel.create('Semestres', semestre);
asistenciaDB.obtenerSemestres = () => {
    const sql = `
        SELECT 
            s.id_semestre,
            s.id_carrera,
            s.numero_semestre,
            s.nombre_semestre,
            c.nombre_carrera
        FROM Semestres s
        JOIN Carreras c ON s.id_carrera = c.id_carrera
        ORDER BY c.nombre_carrera, s.numero_semestre
    `;
    return baseModel.query(sql);
};

asistenciaDB.obtenerSemestresPorCarrera = (idCarrera) => {
    const sql = `
        SELECT 
            s.id_semestre,
            s.id_carrera,
            s.numero_semestre,
            s.nombre_semestre,
            c.nombre_carrera
        FROM Semestres s
        JOIN Carreras c ON s.id_carrera = c.id_carrera
        WHERE s.id_carrera = ?
        ORDER BY s.numero_semestre
    `;
    return baseModel.query(sql, [idCarrera]);
};

asistenciaDB.obtenerSemestrePorId = (id) => {
    const sql = `
        SELECT 
            s.id_semestre,
            s.id_carrera,
            s.numero_semestre,
            s.nombre_semestre,
            c.nombre_carrera
        FROM Semestres s
        JOIN Carreras c ON s.id_carrera = c.id_carrera
        WHERE s.id_semestre = ?
    `;
    return baseModel.query(sql, [id]).then(result => result[0]);
};

asistenciaDB.actualizarSemestre = (id, semestre) => baseModel.update('Semestres', id, semestre, 'id_semestre');
asistenciaDB.eliminarSemestre = (id) => baseModel.delete('Semestres', id, 'id_semestre');

asistenciaDB.verificarSemestreEnUso = async (idSemestre) => {
    // Verificar en PlanEstudios usando id_semestre
    const totalPlan = await baseModel.countRelated('PlanEstudios', 'id_semestre', idSemestre);
    
    // Verificar en Grupos usando id_semestre (ahora es foreign key)
    const totalGrupos = await baseModel.countRelated('Grupos', 'id_semestre', idSemestre);
    
    // Verificar en Alumnos usando id_semestre
    const totalAlumnos = await baseModel.countRelated('Alumnos', 'id_semestre', idSemestre);
    
    return (totalPlan + totalGrupos + totalAlumnos) > 0;
};

asistenciaDB.verificarSemestreDuplicado = async (idCarrera, numeroSemestre, idSemestreExcluir = null) => {
    let sql = 'SELECT COUNT(*) as count FROM Semestres WHERE id_carrera = ? AND numero_semestre = ?';
    const params = [idCarrera, numeroSemestre];
    
    if (idSemestreExcluir) {
        sql += ' AND id_semestre != ?';
        params.push(idSemestreExcluir);
    }
    
    const resultado = await baseModel.query(sql, params);
    return resultado[0].count > 0;
};

asistenciaDB.generarSemestresMultiples = async (idCarrera, cantidadSemestres) => {
    const nombres = {
        1: 'Primer Semestre',
        2: 'Segundo Semestre',
        3: 'Tercer Semestre',
        4: 'Cuarto Semestre',
        5: 'Quinto Semestre',
        6: 'Sexto Semestre',
        7: 'Séptimo Semestre',
        8: 'Octavo Semestre',
        9: 'Noveno Semestre',
        10: 'Décimo Semestre',
        11: 'Décimo Primer Semestre',
        12: 'Décimo Segundo Semestre'
    };

    // Verificar qué semestres ya existen para esta carrera
    const semestresExistentes = await asistenciaDB.obtenerSemestresPorCarrera(idCarrera);
    const numerosExistentes = new Set(semestresExistentes.map(s => s.numero_semestre));

    // Crear array de semestres a insertar (solo los que no existen)
    const semestresAInsertar = [];
    for (let i = 1; i <= cantidadSemestres; i++) {
        if (!numerosExistentes.has(i)) {
            semestresAInsertar.push({
                id_carrera: idCarrera,
                numero_semestre: i,
                nombre_semestre: nombres[i] || `${i}° Semestre`
            });
        }
    }

    // Si no hay semestres nuevos que insertar
    if (semestresAInsertar.length === 0) {
        return {
            success: false,
            message: `Ya existen todos los semestres del 1 al ${cantidadSemestres} para esta carrera`,
            insertados: 0,
            existentes: semestresExistentes.length
        };
    }

    // Insertar los semestres nuevos
    let insertados = 0;
    const errores = [];

    for (const semestre of semestresAInsertar) {
        try {
            await asistenciaDB.insertarSemestre(semestre);
            insertados++;
        } catch (error) {
            errores.push(`Error al insertar semestre ${semestre.numero_semestre}: ${error.message}`);
        }
    }

    return {
        success: insertados > 0,
        message: insertados > 0 ? 
            `Se generaron ${insertados} semestre(s) correctamente` : 
            'No se pudo generar ningún semestre',
        insertados,
        existentes: semestresExistentes.length,
        errores: errores.length > 0 ? errores : null
    };
};

// ========== FUNCIONES PARA MAESTROS (FUSIONADA CON USUARIOS) ==========
asistenciaDB.insertarMaestro = (maestro) => baseModel.create('Maestros', maestro);

asistenciaDB.obtenerMaestros = () => {
    const sql = `
        SELECT 
            id_maestro,
            nombre_usuario,
            tipo_usuario,
            nombre_completo,
            apellido_paterno,
            apellido_materno,
            activo
        FROM Maestros
        ORDER BY nombre_completo
    `;
    return baseModel.query(sql);
};

asistenciaDB.obtenerMaestroPorId = async (id) => {
    const sql = `
        SELECT 
            id_maestro,
            nombre_usuario,
            tipo_usuario,
            nombre_completo,
            apellido_paterno,
            apellido_materno,
            activo
        FROM Maestros
        WHERE id_maestro = ?
    `;
    const resultado = await baseModel.query(sql, [id]);
    return resultado[0];
};

asistenciaDB.obtenerMaestroCompleto = async (id) => {
    const sql = `
        SELECT 
            id_maestro,
            nombre_usuario,
            contrasena,
            tipo_usuario,
            nombre_completo,
            apellido_paterno,
            apellido_materno,
            activo
        FROM Maestros
        WHERE id_maestro = ?
    `;
    const resultado = await baseModel.query(sql, [id]);
    return resultado[0];
};

asistenciaDB.actualizarMaestro = (id, maestro) => baseModel.update('Maestros', id, maestro, 'id_maestro');

asistenciaDB.eliminarMaestro = (id) => baseModel.delete('Maestros', id, 'id_maestro');

asistenciaDB.verificarAsignacionesMaestro = async (idMaestro) => {
    const resultado = await baseModel.query('SELECT COUNT(*) as count FROM Asignaciones WHERE id_maestro = ?', [idMaestro]);
    return resultado[0].count > 0;
};

// Login usando consulta SQL directa
asistenciaDB.verificarLoginMaestro = async (usuario, contrasena) => {
    const sql = `
        SELECT 
            id_maestro,
            nombre_usuario,
            tipo_usuario,
            nombre_completo,
            apellido_paterno,
            apellido_materno
        FROM Maestros 
        WHERE nombre_usuario = ? AND contrasena = ? AND tipo_usuario = 'maestro' AND activo = TRUE
    `;
    const resultado = await baseModel.query(sql, [usuario, contrasena]);
    return resultado[0]; // Devolver el primer resultado
};

// Login para usuarios regulares (admin/prefectos)
asistenciaDB.verificarLoginUsuario = async (usuario, contrasena) => {
    const sql = `
        SELECT id_maestro as id, nombre_usuario, tipo_usuario, nombre_completo
        FROM Maestros 
        WHERE nombre_usuario = ? AND contrasena = ? AND tipo_usuario IN ('admin', 'prefecto') AND activo = TRUE
    `;
    const resultado = await baseModel.query(sql, [usuario, contrasena]);
    return resultado[0]; // Devolver el primer resultado
};

// ========== FUNCIONES PARA MATERIAS ==========
asistenciaDB.insertarMateria = (materia) => baseModel.create('Materias', materia);

asistenciaDB.obtenerMaterias = () => {
    const sql = `
        SELECT 
            id_materia,
            nombre_materia,
            codigo_materia
        FROM Materias
        ORDER BY nombre_materia
    `;
    return baseModel.query(sql);
};

asistenciaDB.obtenerMateriasPorCarrera = (idCarrera) => {
    const sql = `
        SELECT DISTINCT
            m.id_materia,
            m.nombre_materia,
            m.codigo_materia
        FROM Materias m
        JOIN PlanEstudios p ON m.id_materia = p.id_materia
        WHERE p.id_carrera = ?
        ORDER BY m.nombre_materia
    `;
    return baseModel.query(sql, [idCarrera]);
};

asistenciaDB.obtenerMateriaPorId = (id) => {
    const sql = `
        SELECT 
            id_materia,
            nombre_materia,
            codigo_materia
        FROM Materias
        WHERE id_materia = ?
    `;
    return baseModel.query(sql, [id]).then(result => result[0]);
};

asistenciaDB.actualizarMateria = (id, materia) => baseModel.update('Materias', id, materia, 'id_materia');
asistenciaDB.eliminarMateria = (id) => baseModel.delete('Materias', id, 'id_materia');

asistenciaDB.verificarAsignacionesMateria = async (idMateria) => {
    // Solo verificar Asignaciones - ya no verificamos PlanEstudios porque es parte del sistema unificado
    // y se elimina automáticamente por CASCADE
    const totalAsignaciones = await baseModel.query('SELECT COUNT(*) as count FROM Asignaciones WHERE id_materia = ?', [idMateria]);
    return totalAsignaciones[0].count > 0;
};

// ========== FUNCIONES PARA PLAN DE ESTUDIOS ==========
asistenciaDB.insertarPlanEstudios = (plan) => baseModel.create('PlanEstudios', plan);

asistenciaDB.obtenerPlanEstudios = () => {
    const sql = `
        SELECT 
            p.id_plan,
            p.id_carrera,
            p.id_semestre,
            p.id_materia,
            c.nombre_carrera,
            s.numero_semestre,
            s.nombre_semestre,
            m.nombre_materia,
            m.codigo_materia
        FROM PlanEstudios p
        JOIN Carreras c ON p.id_carrera = c.id_carrera
        JOIN Semestres s ON p.id_semestre = s.id_semestre
        JOIN Materias m ON p.id_materia = m.id_materia
        ORDER BY c.nombre_carrera, s.numero_semestre, m.nombre_materia
    `;
    return baseModel.query(sql);
};

asistenciaDB.obtenerPlanEstudiosPorCarrera = (idCarrera) => {
    const sql = `
        SELECT 
            p.id_plan,
            p.id_carrera,
            p.id_semestre,
            p.id_materia,
            c.nombre_carrera,
            s.numero_semestre,
            s.nombre_semestre,
            m.nombre_materia,
            m.codigo_materia
        FROM PlanEstudios p
        JOIN Carreras c ON p.id_carrera = c.id_carrera
        JOIN Semestres s ON p.id_semestre = s.id_semestre
        JOIN Materias m ON p.id_materia = m.id_materia
        WHERE p.id_carrera = ?
        ORDER BY s.numero_semestre, m.nombre_materia
    `;
    return baseModel.query(sql, [idCarrera]);
};

asistenciaDB.obtenerMateriasPorSemestre = (idCarrera, idSemestre) => {
    const sql = `
        SELECT 
            m.id_materia,
            m.nombre_materia,
            m.codigo_materia,
            p.id_plan
        FROM PlanEstudios p
        JOIN Materias m ON p.id_materia = m.id_materia
        WHERE p.id_carrera = ? AND p.id_semestre = ?
        ORDER BY m.nombre_materia
    `;
    return baseModel.query(sql, [idCarrera, idSemestre]);
};

asistenciaDB.obtenerPlanEstudioPorId = (id) => {
    const sql = `
        SELECT 
            p.id_plan,
            p.id_carrera,
            p.id_semestre,
            p.id_materia,
            c.nombre_carrera,
            s.numero_semestre,
            s.nombre_semestre,
            m.nombre_materia,
            m.codigo_materia
        FROM PlanEstudios p
        JOIN Carreras c ON p.id_carrera = c.id_carrera
        JOIN Semestres s ON p.id_semestre = s.id_semestre
        JOIN Materias m ON p.id_materia = m.id_materia
        WHERE p.id_plan = ?
    `;
    return baseModel.query(sql, [id]).then(result => result[0]);
};

asistenciaDB.eliminarPlanEstudios = (id) => baseModel.delete('PlanEstudios', id, 'id_plan');

asistenciaDB.actualizarPlanEstudiosPorMateria = async (idMateria, idCarrera, idSemestre) => {
    const sql = `
        UPDATE PlanEstudios 
        SET id_semestre = ? 
        WHERE id_materia = ? AND id_carrera = ?
    `;
    return baseModel.query(sql, [idSemestre, idMateria, idCarrera]);
};

asistenciaDB.verificarPlanEstudiosDuplicado = async (idCarrera, idSemestre, idMateria) => {
    const sql = 'SELECT COUNT(*) as count FROM PlanEstudios WHERE id_carrera = ? AND id_semestre = ? AND id_materia = ?';
    const resultado = await baseModel.query(sql, [idCarrera, idSemestre, idMateria]);
    return resultado[0].count > 0;
};

// ========== FUNCIONES PARA GRUPOS ==========
asistenciaDB.insertarGrupo = (grupo) => baseModel.create('Grupos', grupo);
asistenciaDB.actualizarGrupo = (id, grupo) => baseModel.update('Grupos', id, grupo, 'id_grupo');
asistenciaDB.eliminarGrupo = (id) => baseModel.delete('Grupos', id, 'id_grupo');
asistenciaDB.verificarGrupo = (idGrupo) => baseModel.exists('Grupos', idGrupo, 'id_grupo');

asistenciaDB.obtenerGrupos = () => {
    const sql = `
        SELECT 
            g.id_grupo,
            g.id_carrera,
            g.id_semestre,
            g.nombre_grupo,
            g.turno,
            g.periodo,
            g.anio,
            g.activo,
            c.nombre_carrera,
            c.codigo_carrera,
            s.numero_semestre,
            s.nombre_semestre
        FROM Grupos g
        JOIN Carreras c ON g.id_carrera = c.id_carrera
        JOIN Semestres s ON g.id_semestre = s.id_semestre
        ORDER BY c.nombre_carrera, s.numero_semestre, g.nombre_grupo
    `;
    return baseModel.query(sql);
};

asistenciaDB.obtenerGruposPorCarrera = (idCarrera) => {
    const sql = `
        SELECT 
            g.id_grupo,
            g.id_carrera,
            g.id_semestre,
            g.nombre_grupo,
            g.turno,
            g.periodo,
            g.anio,
            g.activo,
            c.nombre_carrera,
            c.codigo_carrera,
            s.numero_semestre,
            s.nombre_semestre
        FROM Grupos g
        JOIN Carreras c ON g.id_carrera = c.id_carrera
        JOIN Semestres s ON g.id_semestre = s.id_semestre
        WHERE g.id_carrera = ?
        ORDER BY s.numero_semestre, g.nombre_grupo
    `;
    return baseModel.query(sql, [idCarrera]);
};

asistenciaDB.obtenerGruposPorCarreraYSemestre = (idCarrera, idSemestre) => {
    const sql = `
        SELECT 
            g.id_grupo,
            g.id_carrera,
            g.id_semestre,
            g.nombre_grupo,
            g.turno,
            g.periodo,
            g.anio,
            g.activo,
            c.nombre_carrera,
            c.codigo_carrera,
            s.numero_semestre,
            s.nombre_semestre
        FROM Grupos g
        JOIN Carreras c ON g.id_carrera = c.id_carrera
        JOIN Semestres s ON g.id_semestre = s.id_semestre
        WHERE g.id_carrera = ? AND g.id_semestre = ?
        ORDER BY g.nombre_grupo
    `;
    return baseModel.query(sql, [idCarrera, idSemestre]);
};

asistenciaDB.obtenerGrupoPorId = (id) => {
    const sql = `
        SELECT 
            g.id_grupo,
            g.id_carrera,
            g.id_semestre,
            g.nombre_grupo,
            g.turno,
            g.periodo,
            g.anio,
            g.activo,
            c.nombre_carrera,
            c.codigo_carrera,
            s.numero_semestre,
            s.nombre_semestre
        FROM Grupos g
        JOIN Carreras c ON g.id_carrera = c.id_carrera
        JOIN Semestres s ON g.id_semestre = s.id_semestre
        WHERE g.id_grupo = ?
    `;
    return baseModel.query(sql, [id]).then(result => result[0]);
};

asistenciaDB.verificarAlumnosEnGrupo = async (idGrupo) => {
    const resultado = await baseModel.query('SELECT COUNT(*) as count FROM Alumnos WHERE id_grupo = ?', [idGrupo]);
    return resultado[0].count > 0;
};

// ========== FUNCIONES PARA ALUMNOS ==========
asistenciaDB.insertarAlumno = (alumno) => {
    return baseModel.create('Alumnos', {
        matricula: alumno.matricula,
        nombre_alumno: alumno.nombre_alumno,
        apellido_paterno: alumno.apellido_paterno,
        apellido_materno: alumno.apellido_materno,
        id_carrera: alumno.id_carrera,
        id_semestre: alumno.id_semestre,
        id_grupo: alumno.id_grupo,
        foto_base64: alumno.foto_base64 || null,
        activo: alumno.activo !== undefined ? alumno.activo : true
    });
};

asistenciaDB.actualizarAlumno = (id, alumno) => {
    return baseModel.update('Alumnos', id, {
        matricula: alumno.matricula,
        nombre_alumno: alumno.nombre_alumno,
        apellido_paterno: alumno.apellido_paterno,
        apellido_materno: alumno.apellido_materno,
        id_carrera: alumno.id_carrera,
        id_semestre: alumno.id_semestre,
        id_grupo: alumno.id_grupo,
        foto_base64: alumno.foto_base64 !== undefined ? alumno.foto_base64 : null,
        activo: alumno.activo !== undefined ? alumno.activo : true
    }, 'id_alumno');
};

asistenciaDB.eliminarAlumno = (id) => baseModel.delete('Alumnos', id, 'id_alumno');

asistenciaDB.obtenerAlumnos = () => {
    const sql = `
        SELECT 
            a.id_alumno,
            a.matricula,
            a.nombre_alumno,
            a.apellido_paterno,
            a.apellido_materno,
            CONCAT_WS(' ', a.nombre_alumno, COALESCE(a.apellido_paterno, ''), COALESCE(a.apellido_materno, '')) as nombre_completo,
            a.id_carrera,
            a.id_semestre,
            a.id_grupo,
            a.foto_base64,
            a.activo,
            c.nombre_carrera,
            s.numero_semestre,
            s.nombre_semestre,
            g.nombre_grupo,
            g.turno
        FROM Alumnos a
        JOIN Carreras c ON a.id_carrera = c.id_carrera
        JOIN Semestres s ON a.id_semestre = s.id_semestre
        JOIN Grupos g ON a.id_grupo = g.id_grupo
        ORDER BY a.nombre_alumno, a.apellido_paterno
    `;
    return baseModel.query(sql);
};

asistenciaDB.obtenerAlumnosPorGrupo = (idGrupo) => {
    const sql = `
        SELECT 
            a.id_alumno,
            a.matricula,
            a.nombre_alumno,
            a.apellido_paterno,
            a.apellido_materno,
            CONCAT_WS(' ', a.nombre_alumno, COALESCE(a.apellido_paterno, ''), COALESCE(a.apellido_materno, '')) as nombre_completo,
            a.id_carrera,
            a.id_semestre,
            a.id_grupo,
            a.foto_base64,
            a.activo,
            c.nombre_carrera,
            s.numero_semestre,
            g.nombre_grupo
        FROM Alumnos a
        JOIN Carreras c ON a.id_carrera = c.id_carrera
        JOIN Semestres s ON a.id_semestre = s.id_semestre
        JOIN Grupos g ON a.id_grupo = g.id_grupo
        WHERE a.id_grupo = ?
        ORDER BY a.nombre_alumno, a.apellido_paterno
    `;
    return baseModel.query(sql, [idGrupo]);
};

asistenciaDB.buscarAlumnoPorMatricula = (matricula) => {
    const sql = `
        SELECT 
            a.id_alumno,
            a.matricula,
            a.nombre_alumno,
            a.apellido_paterno,
            a.apellido_materno,
            CONCAT_WS(' ', a.nombre_alumno, COALESCE(a.apellido_paterno, ''), COALESCE(a.apellido_materno, '')) as nombre_completo,
            a.id_carrera,
            a.id_semestre,
            a.id_grupo,
            a.foto_base64,
            a.activo,
            c.nombre_carrera,
            s.numero_semestre,
            g.nombre_grupo
        FROM Alumnos a
        JOIN Carreras c ON a.id_carrera = c.id_carrera
        JOIN Semestres s ON a.id_semestre = s.id_semestre
        JOIN Grupos g ON a.id_grupo = g.id_grupo
        WHERE a.matricula = ?
    `;
    return baseModel.query(sql, [matricula]).then(result => result[0]);
};

asistenciaDB.obtenerAlumnoPorId = (id) => {
    const sql = `
        SELECT 
            a.id_alumno,
            a.matricula,
            a.nombre_alumno,
            a.apellido_paterno,
            a.apellido_materno,
            CONCAT_WS(' ', a.nombre_alumno, COALESCE(a.apellido_paterno, ''), COALESCE(a.apellido_materno, '')) as nombre_completo,
            a.id_carrera,
            a.id_semestre,
            a.id_grupo,
            a.foto_base64,
            a.activo,
            c.nombre_carrera,
            s.numero_semestre,
            s.nombre_semestre,
            g.nombre_grupo,
            g.turno
        FROM Alumnos a
        JOIN Carreras c ON a.id_carrera = c.id_carrera
        JOIN Semestres s ON a.id_semestre = s.id_semestre
        JOIN Grupos g ON a.id_grupo = g.id_grupo
        WHERE a.id_alumno = ?
    `;
    return baseModel.query(sql, [id]).then(result => result[0]);
};

asistenciaDB.verificarMatriculaExistente = async (matricula, idAlumnoExcluir = null) => {
    let sql = 'SELECT COUNT(*) as count FROM Alumnos WHERE matricula = ?';
    const params = [matricula];
    
    if (idAlumnoExcluir) {
        sql += ' AND id_alumno != ?';
        params.push(idAlumnoExcluir);
    }
    
    const total = await baseModel.query(sql, params);
    return total[0].count > 0;
};

asistenciaDB.verificarAsistenciasAlumno = async (idAlumno) => {
    const total = await baseModel.countRelated('Asistencias', 'id_alumno', idAlumno);
    return total > 0;
};

// ========== FUNCIONES PARA HORARIOS ==========
asistenciaDB.insertarHorario = (horario) => baseModel.create('Horarios', horario);

asistenciaDB.obtenerHorarios = () => {
    const sql = `
        SELECT 
            id_horario,
            dia_semana,
            bloque,
            hora_inicio,
            hora_fin
        FROM Horarios
        ORDER BY FIELD(dia_semana, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'), bloque
    `;
    return baseModel.query(sql);
};

asistenciaDB.obtenerHorarioPorId = (id) => baseModel.findById('Horarios', id, 'id_horario');

asistenciaDB.obtenerHorariosDisponibles = async (idGrupo, idMaestro) => {
    // Obtener todos los horarios
    const todosHorarios = await asistenciaDB.obtenerHorarios();
    
    // Obtener horarios ocupados por el GRUPO (un grupo no puede tener dos materias al mismo tiempo)
    const horariosGrupo = await baseModel.query(`
        SELECT DISTINCT h.id_horario
        FROM Asignaciones a
        JOIN Horarios h ON a.id_horario = h.id_horario
        WHERE a.id_grupo = ?
    `, [idGrupo]);
    
    // Obtener horarios ocupados por el MAESTRO (un maestro no puede estar en dos grupos al mismo tiempo)
    const horariosMaestro = await baseModel.query(`
        SELECT DISTINCT h.id_horario
        FROM Asignaciones a
        JOIN Horarios h ON a.id_horario = h.id_horario
        WHERE a.id_maestro = ?
    `, [idMaestro]);
    
    // IDs de horarios ocupados (grupo O maestro)
    const ocupados = new Set([
        ...horariosGrupo.map(h => h.id_horario),
        ...horariosMaestro.map(h => h.id_horario)
    ]);
    
    // Filtrar horarios disponibles (los que NO estén ocupados ni por el grupo ni por el maestro)
    const disponibles = todosHorarios.filter(h => !ocupados.has(h.id_horario));
    
    return disponibles;
};

// ========== FUNCIONES PARA ASIGNACIONES ==========
asistenciaDB.insertarAsignacion = (asignacion) => baseModel.create('Asignaciones', asignacion);

asistenciaDB.obtenerAsignaciones = () => {
    const sql = `
        SELECT 
            asig.id_asignacion,
            m.id_maestro,
            CONCAT_WS(' ', m.nombre_completo, COALESCE(m.apellido_paterno, ''), COALESCE(m.apellido_materno, '')) as nombre_maestro,
            mat.id_materia,
            mat.nombre_materia,
            mat.codigo_materia,
            g.id_grupo,
            g.nombre_grupo,
            g.id_semestre,
            s.numero_semestre,
            s.nombre_semestre,
            c.id_carrera,
            c.nombre_carrera,
            h.dia_semana,
            h.hora_inicio,
            h.hora_fin
        FROM Asignaciones asig
        JOIN Maestros m ON asig.id_maestro = m.id_maestro
        JOIN Materias mat ON asig.id_materia = mat.id_materia
        JOIN Grupos g ON asig.id_grupo = g.id_grupo
        JOIN Carreras c ON g.id_carrera = c.id_carrera
        JOIN Semestres s ON g.id_semestre = s.id_semestre
        JOIN Horarios h ON asig.id_horario = h.id_horario
        ORDER BY c.nombre_carrera, s.numero_semestre, mat.nombre_materia
    `;
    return baseModel.query(sql);
};

asistenciaDB.obtenerAsignacionPorId = (id) => {
    const sql = `
        SELECT 
            asig.id_asignacion,
            m.id_maestro,
            CONCAT_WS(' ', m.nombre_completo, COALESCE(m.apellido_paterno, ''), COALESCE(m.apellido_materno, '')) as nombre_maestro,
            mat.id_materia,
            mat.nombre_materia,
            mat.codigo_materia,
            g.id_grupo,
            g.nombre_grupo,
            g.id_semestre,
            s.numero_semestre,
            s.nombre_semestre,
            c.id_carrera,
            c.nombre_carrera,
            h.id_horario,
            h.dia_semana,
            h.hora_inicio,
            h.hora_fin
        FROM Asignaciones asig
        JOIN Maestros m ON asig.id_maestro = m.id_maestro
        JOIN Materias mat ON asig.id_materia = mat.id_materia
        JOIN Grupos g ON asig.id_grupo = g.id_grupo
        JOIN Carreras c ON g.id_carrera = c.id_carrera
        JOIN Semestres s ON g.id_semestre = s.id_semestre
        JOIN Horarios h ON asig.id_horario = h.id_horario
        WHERE asig.id_asignacion = ?
    `;
    return baseModel.query(sql, [id]).then(result => result[0]);
};

asistenciaDB.actualizarAsignacion = (id, asignacion) => baseModel.update('Asignaciones', id, asignacion, 'id_asignacion');

asistenciaDB.eliminarAsignacion = (id) => baseModel.delete('Asignaciones', id, 'id_asignacion');

asistenciaDB.verificarAsignacionExistente = async (idMaestro, idMateria, idGrupo, idHorario) => {
    const sql = 'SELECT COUNT(*) as count FROM Asignaciones WHERE id_maestro = ? AND id_materia = ? AND id_grupo = ? AND id_horario = ?';
    const resultado = await baseModel.query(sql, [idMaestro, idMateria, idGrupo, idHorario]);
    return resultado[0].count > 0;
};

asistenciaDB.verificarHorarioOcupado = async (idHorario, idGrupo, idMaestro) => {
    const sql = `
        SELECT COUNT(*) as count 
        FROM Asignaciones 
        WHERE id_horario = ? AND (id_grupo = ? OR id_maestro = ?)
    `;
    const resultado = await baseModel.query(sql, [idHorario, idGrupo, idMaestro]);
    return resultado[0].count > 0;
};

asistenciaDB.obtenerAsignacionesPorMaestro = (idMaestro) => {
    const sql = `
        SELECT 
            asig.id_asignacion,
            m.id_maestro,
            CONCAT_WS(' ', m.nombre_completo, COALESCE(m.apellido_paterno, ''), COALESCE(m.apellido_materno, '')) as nombre_maestro,
            mat.id_materia,
            mat.nombre_materia,
            mat.codigo_materia,
            g.id_grupo,
            g.nombre_grupo,
            g.id_semestre,
            s.numero_semestre,
            s.nombre_semestre,
            c.id_carrera,
            c.nombre_carrera,
            h.dia_semana,
            h.hora_inicio,
            h.hora_fin
        FROM Asignaciones asig
        JOIN Maestros m ON asig.id_maestro = m.id_maestro
        JOIN Materias mat ON asig.id_materia = mat.id_materia
        JOIN Grupos g ON asig.id_grupo = g.id_grupo
        JOIN Carreras c ON g.id_carrera = c.id_carrera
        JOIN Semestres s ON g.id_semestre = s.id_semestre
        JOIN Horarios h ON asig.id_horario = h.id_horario
        WHERE asig.id_maestro = ?
        ORDER BY c.nombre_carrera, s.numero_semestre, mat.nombre_materia
    `;
    return baseModel.query(sql, [idMaestro]);
};

asistenciaDB.obtenerAsignacionesPorGrupo = (idGrupo) => {
    const sql = `
        SELECT 
            asig.id_asignacion,
            mat.nombre_materia,
            mat.codigo_materia,
            CONCAT_WS(' ', m.nombre_completo, COALESCE(m.apellido_paterno, ''), COALESCE(m.apellido_materno, '')) as nombre_maestro,
            h.dia_semana,
            h.hora_inicio,
            h.hora_fin
        FROM Asignaciones asig
        JOIN Materias mat ON asig.id_materia = mat.id_materia
        JOIN Maestros m ON asig.id_maestro = m.id_maestro
        JOIN Horarios h ON asig.id_horario = h.id_horario
        WHERE asig.id_grupo = ?
        ORDER BY FIELD(h.dia_semana, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'), h.hora_inicio
    `;
    return baseModel.query(sql, [idGrupo]);
};

// ========== FUNCIONES PARA ASISTENCIAS ==========
asistenciaDB.registrarAsistencia = (asistencia) => {
    const data = {
        id_alumno: asistencia.id_alumno,
        id_asignacion: asistencia.id_asignacion,
        fecha: asistencia.fecha,
        estado: asistencia.estado,
        hora_registro: asistencia.hora_registro || new Date().toTimeString().split(' ')[0],
        observaciones: asistencia.observaciones || null
    };
    return baseModel.create('Asistencias', data);
};

asistenciaDB.registrarAsistenciasMasivo = async (asistencias) => {
    const promesas = asistencias.map(asistencia => asistenciaDB.registrarAsistencia(asistencia));
    return Promise.all(promesas);
};

asistenciaDB.obtenerAsistencias = (filtros = {}) => {
    let conditions = ['1=1'];
    const params = [];
    
    if (filtros.id_grupo) {
        conditions.push('g.id_grupo = ?');
        params.push(filtros.id_grupo);
    }
    
    if (filtros.id_asignacion) {
        conditions.push('ast.id_asignacion = ?');
        params.push(filtros.id_asignacion);
    }
    
    if (filtros.fecha) {
        conditions.push('ast.fecha = ?');
        params.push(filtros.fecha);
    }
    
    if (filtros.id_alumno) {
        conditions.push('ast.id_alumno = ?');
        params.push(filtros.id_alumno);
    }
    
    const sql = `
        SELECT 
            ast.id_asistencia,
            ast.id_alumno,
            a.matricula,
            CONCAT_WS(' ', a.nombre_alumno, COALESCE(a.apellido_paterno, ''), COALESCE(a.apellido_materno, '')) as nombre_alumno,
            ast.id_asignacion,
            mat.nombre_materia,
            CONCAT_WS(' ', m.nombre_completo, COALESCE(m.apellido_paterno, ''), COALESCE(m.apellido_materno, '')) as nombre_maestro,
            ast.fecha,
            ast.estado,
            ast.hora_registro,
            ast.observaciones,
            g.nombre_grupo,
            c.nombre_carrera
        FROM Asistencias ast
        JOIN Alumnos a ON ast.id_alumno = a.id_alumno
        JOIN Asignaciones asig ON ast.id_asignacion = asig.id_asignacion
        JOIN Materias mat ON asig.id_materia = mat.id_materia
        JOIN Maestros m ON asig.id_maestro = m.id_maestro
        JOIN Grupos g ON a.id_grupo = g.id_grupo
        JOIN Carreras c ON g.id_carrera = c.id_carrera
        WHERE ${conditions.join(' AND ')}
        ORDER BY ast.fecha DESC, a.nombre_alumno
    `;
    
    return baseModel.query(sql, params);
};

asistenciaDB.obtenerListaAlumnosParaAsistencia = async (idAsignacion) => {
    // Obtener información de la asignación
    const asignacion = await asistenciaDB.obtenerAsignacionPorId(idAsignacion);
    
    if (!asignacion) {
        return null;
    }
    
    // Obtener alumnos del grupo
    const alumnos = await asistenciaDB.obtenerAlumnosPorGrupo(asignacion.id_grupo);
    
    return {
        asignacion: {
            id_asignacion: asignacion.id_asignacion,
            nombre_materia: asignacion.nombre_materia,
            nombre_grupo: asignacion.nombre_grupo,
            dia_semana: asignacion.dia_semana,
            hora_inicio: asignacion.hora_inicio
        },
        alumnos: alumnos.map(a => ({
            id_alumno: a.id_alumno,
            matricula: a.matricula,
            nombre_completo: a.nombre_completo,
            foto_base64: a.foto_base64
        }))
    };
};

// ========== FUNCIONES PARA VISUALIZACIÓN DE DATOS ==========
asistenciaDB.obtenerEstructuraSistema = async (filtros = {}) => {
    let conditions = ['1=1'];
    const params = [];
    
    if (filtros.idCarrera) {
        conditions.push('c.id_carrera = ?');
        params.push(filtros.idCarrera);
    }
    
    if (filtros.idSemestre) {
        conditions.push('g.id_semestre = ?');
        params.push(filtros.idSemestre);
    }
    
    if (filtros.idGrupo) {
        conditions.push('g.id_grupo = ?');
        params.push(filtros.idGrupo);
    }
    
    const sql = `
        SELECT 
            c.id_carrera, c.nombre_carrera, c.codigo_carrera,
            g.id_grupo, g.nombre_grupo, g.id_semestre,
            s.numero_semestre, s.nombre_semestre,
            COUNT(a.id_alumno) as total_alumnos
        FROM Carreras c
        LEFT JOIN Grupos g ON c.id_carrera = g.id_carrera
        LEFT JOIN Semestres s ON g.id_semestre = s.id_semestre
        LEFT JOIN Alumnos a ON g.id_grupo = a.id_grupo
        WHERE ${conditions.join(' AND ')}
        GROUP BY c.id_carrera, g.id_grupo 
        ORDER BY c.nombre_carrera, s.numero_semestre, g.nombre_grupo
    `;
    
    const resultado = await baseModel.query(sql, params);
    return Array.isArray(resultado) ? resultado : [resultado].filter(Boolean);
};

// ========== FUNCIONES PARA ESTADÍSTICAS ==========
asistenciaDB.obtenerEstadisticasGrupo = async (idGrupo, fechaInicio, fechaFin) => {
    const sql = `
        SELECT 
            a.id_alumno,
            a.matricula,
            CONCAT_WS(' ', a.nombre_alumno, COALESCE(a.apellido_paterno, ''), COALESCE(a.apellido_materno, '')) as nombre,
            COUNT(CASE WHEN ast.estado = 'asistencia' THEN 1 END) as asistencias,
            COUNT(CASE WHEN ast.estado = 'falta' THEN 1 END) as faltas,
            COUNT(CASE WHEN ast.estado = 'justificante' THEN 1 END) as justificantes,
            COUNT(ast.id_asistencia) as total_clases,
            ROUND((COUNT(CASE WHEN ast.estado = 'asistencia' THEN 1 END) / COUNT(ast.id_asistencia)) * 100, 2) as porcentaje
        FROM Alumnos a
        LEFT JOIN Asistencias ast ON a.id_alumno = ast.id_alumno
        WHERE a.id_grupo = ?
        ${fechaInicio ? 'AND ast.fecha >= ?' : ''}
        ${fechaFin ? 'AND ast.fecha <= ?' : ''}
        GROUP BY a.id_alumno
        ORDER BY a.nombre_alumno, a.apellido_paterno
    `;
    
    const params = [idGrupo];
    if (fechaInicio) params.push(fechaInicio);
    if (fechaFin) params.push(fechaFin);
    
    return baseModel.query(sql, params);
};

// ========== FUNCIONES PARA USUARIOS DEL SISTEMA (ADMIN Y PREFECTOS) ==========
asistenciaDB.obtenerUsuarios = () => {
    const sql = `
        SELECT 
            id_maestro as id,
            nombre_completo as nombreCompleto,
            nombre_usuario,
            tipo_usuario
        FROM Maestros 
        WHERE tipo_usuario IN ('admin', 'prefecto')
        ORDER BY nombre_usuario
    `;
    return baseModel.query(sql);
};

asistenciaDB.obtenerUsuarioPorId = async (id) => {
    const sql = `
        SELECT 
            id_maestro as id,
            nombre_completo as nombreCompleto,
            nombre_usuario,
            tipo_usuario
        FROM Maestros 
        WHERE id_maestro = ?
    `;
    const resultado = await baseModel.query(sql, [id]);
    return resultado[0];
};

asistenciaDB.insertarUsuario = (usuario) => {
    return baseModel.create('Maestros', {
        nombre_completo: usuario.nombreCompleto || 'Usuario del Sistema',
        nombre_usuario: usuario.nombreUsuario,
        contrasena: usuario.contrasena,
        tipo_usuario: usuario.tipoUsuario
    });
};

asistenciaDB.actualizarUsuario = (id, usuario) => {
    return baseModel.update('Maestros', id, {
        nombre_completo: usuario.nombreCompleto || 'Usuario del Sistema',
        nombre_usuario: usuario.nombreUsuario,
        contrasena: usuario.contrasena,
        tipo_usuario: usuario.tipoUsuario
    }, 'id_maestro');
};

asistenciaDB.eliminarUsuario = (id) => baseModel.delete('Maestros', id, 'id_maestro');

asistenciaDB.verificarRelacionesUsuario = async (idUsuario) => {
    // Verificar si el usuario tiene asignaciones activas
    const resultado = await baseModel.query('SELECT COUNT(*) as count FROM Asignaciones WHERE id_maestro = ?', [idUsuario]);
    return resultado[0].count > 0;
};

export default asistenciaDB;