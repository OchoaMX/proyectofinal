-- Script para inicializar la tabla de Horarios con los 40 bloques
-- Horario escolar: 7:00 AM - 2:00 PM (8 bloques de 50 minutos)
-- Receso de 30 minutos: 10:20 - 10:50 (entre bloque 4 y 5)

-- LUNES (8 bloques)
INSERT INTO Horarios (dia_semana, bloque, hora_inicio, hora_fin) VALUES
('Lunes', 1, '07:00:00', '07:50:00'),
('Lunes', 2, '07:50:00', '08:40:00'),
('Lunes', 3, '08:40:00', '09:30:00'),
('Lunes', 4, '09:30:00', '10:20:00'),
-- RECESO 10:20 - 10:50
('Lunes', 5, '10:50:00', '11:40:00'),
('Lunes', 6, '11:40:00', '12:30:00'),
('Lunes', 7, '12:30:00', '13:20:00'),
('Lunes', 8, '13:20:00', '14:10:00');

-- MARTES (8 bloques)
INSERT INTO Horarios (dia_semana, bloque, hora_inicio, hora_fin) VALUES
('Martes', 1, '07:00:00', '07:50:00'),
('Martes', 2, '07:50:00', '08:40:00'),
('Martes', 3, '08:40:00', '09:30:00'),
('Martes', 4, '09:30:00', '10:20:00'),
-- RECESO 10:20 - 10:50
('Martes', 5, '10:50:00', '11:40:00'),
('Martes', 6, '11:40:00', '12:30:00'),
('Martes', 7, '12:30:00', '13:20:00'),
('Martes', 8, '13:20:00', '14:10:00');

-- MIÉRCOLES (8 bloques)
INSERT INTO Horarios (dia_semana, bloque, hora_inicio, hora_fin) VALUES
('Miércoles', 1, '07:00:00', '07:50:00'),
('Miércoles', 2, '07:50:00', '08:40:00'),
('Miércoles', 3, '08:40:00', '09:30:00'),
('Miércoles', 4, '09:30:00', '10:20:00'),
-- RECESO 10:20 - 10:50
('Miércoles', 5, '10:50:00', '11:40:00'),
('Miércoles', 6, '11:40:00', '12:30:00'),
('Miércoles', 7, '12:30:00', '13:20:00'),
('Miércoles', 8, '13:20:00', '14:10:00');

-- JUEVES (8 bloques)
INSERT INTO Horarios (dia_semana, bloque, hora_inicio, hora_fin) VALUES
('Jueves', 1, '07:00:00', '07:50:00'),
('Jueves', 2, '07:50:00', '08:40:00'),
('Jueves', 3, '08:40:00', '09:30:00'),
('Jueves', 4, '09:30:00', '10:20:00'),
-- RECESO 10:20 - 10:50
('Jueves', 5, '10:50:00', '11:40:00'),
('Jueves', 6, '11:40:00', '12:30:00'),
('Jueves', 7, '12:30:00', '13:20:00'),
('Jueves', 8, '13:20:00', '14:10:00');

-- VIERNES (8 bloques)
INSERT INTO Horarios (dia_semana, bloque, hora_inicio, hora_fin) VALUES
('Viernes', 1, '07:00:00', '07:50:00'),
('Viernes', 2, '07:50:00', '08:40:00'),
('Viernes', 3, '08:40:00', '09:30:00'),
('Viernes', 4, '09:30:00', '10:20:00'),
-- RECESO 10:20 - 10:50
('Viernes', 5, '10:50:00', '11:40:00'),
('Viernes', 6, '11:40:00', '12:30:00'),
('Viernes', 7, '12:30:00', '13:20:00'),
('Viernes', 8, '13:20:00', '14:10:00');

-- Total: 40 horarios (5 días × 8 bloques)
