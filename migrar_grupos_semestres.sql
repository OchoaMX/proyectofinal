-- ========================================
-- SCRIPT DE MIGRACIÓN: GRUPOS CON FOREIGN KEY A SEMESTRES
-- ========================================
-- Este script migra la tabla Grupos para usar id_semestre como foreign key
-- en lugar de semestre_actual como número simple
-- 
-- IMPORTANTE: Ejecutar antes de usar el sistema actualizado
-- ========================================

-- 1. Crear tabla temporal para los datos existentes
CREATE TEMPORARY TABLE temp_grupos AS 
SELECT 
    id_grupo,
    id_carrera,
    semestre_actual,
    nombre_grupo,
    turno,
    periodo,
    anio,
    activo,
    created_at
FROM Grupos;

-- 2. Eliminar la tabla Grupos original
DROP TABLE IF EXISTS Grupos;

-- 3. Recrear la tabla Grupos con la nueva estructura
CREATE TABLE Grupos (
    id_grupo INT PRIMARY KEY AUTO_INCREMENT,
    id_carrera INT NOT NULL,
    id_semestre INT NOT NULL,
    nombre_grupo VARCHAR(10) NOT NULL,
    turno ENUM('Matutino') DEFAULT 'Matutino',
    periodo ENUM('Enero-Junio', 'Agosto-Diciembre') NOT NULL,
    anio YEAR NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_carrera) REFERENCES Carreras(id_carrera) ON DELETE CASCADE,
    FOREIGN KEY (id_semestre) REFERENCES Semestres(id_semestre) ON DELETE RESTRICT,
    UNIQUE KEY unique_grupo (id_carrera, id_semestre, nombre_grupo, periodo, anio)
);

-- 4. Migrar los datos existentes
-- Convertir semestre_actual (número) a id_semestre (foreign key)
INSERT INTO Grupos (id_grupo, id_carrera, id_semestre, nombre_grupo, turno, periodo, anio, activo, created_at)
SELECT 
    tg.id_grupo,
    tg.id_carrera,
    s.id_semestre,  -- Usar id_semestre de la tabla Semestres
    tg.nombre_grupo,
    CASE 
        WHEN tg.turno = 'Vespertino' THEN 'Matutino'  -- Convertir vespertino a matutino
        ELSE tg.turno 
    END as turno,
    tg.periodo,
    tg.anio,
    tg.activo,
    tg.created_at
FROM temp_grupos tg
JOIN Semestres s ON (tg.id_carrera = s.id_carrera AND tg.semestre_actual = s.numero_semestre);

-- 5. Verificar la migración
SELECT 
    'Migración completada' as status,
    COUNT(*) as grupos_migrados
FROM Grupos;

-- 6. Mostrar grupos que no pudieron migrarse (si los hay)
SELECT 
    'Grupos no migrados (falta crear semestre correspondiente)' as advertencia,
    tg.id_carrera,
    tg.semestre_actual,
    tg.nombre_grupo,
    tg.periodo,
    tg.anio
FROM temp_grupos tg
LEFT JOIN Semestres s ON (tg.id_carrera = s.id_carrera AND tg.semestre_actual = s.numero_semestre)
WHERE s.id_semestre IS NULL;

-- ========================================
-- VERIFICACIONES POST-MIGRACIÓN
-- ========================================

-- Verificar estructura
DESCRIBE Grupos;

-- Verificar foreign keys
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'Grupos' 
AND CONSTRAINT_SCHEMA = DATABASE()
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Mostrar algunos datos de ejemplo
SELECT 
    g.id_grupo,
    g.nombre_grupo,
    c.nombre_carrera,
    s.numero_semestre,
    s.nombre_semestre,
    g.turno,
    g.periodo,
    g.anio
FROM Grupos g 
JOIN Carreras c ON g.id_carrera = c.id_carrera
JOIN Semestres s ON g.id_semestre = s.id_semestre
LIMIT 10;
