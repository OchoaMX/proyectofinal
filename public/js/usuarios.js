// ===== FUNCIONES ESPECÍFICAS PARA USUARIOS =====

// Función para mostrar/ocultar el campo nombre real según el tipo de usuario
function toggleNombreReal() {
    const tipoUsuario = document.getElementById('tipoUsuario').value;
    const grupoNombreReal = document.getElementById('grupo_nombre_real');
    const nombreReal = document.getElementById('nombreReal');
    
    if (tipoUsuario === 'maestro') {
        grupoNombreReal.style.display = 'block';
        nombreReal.required = true;
    } else {
        grupoNombreReal.style.display = 'none';
        nombreReal.required = false;
        nombreReal.value = '';
    }
}

// Función para cargar todos los usuarios del sistema (admin, maestros, prefectos)
async function cargarUsuariosUnificados() {
    try {
        // Obtener usuarios regulares
        const responseUsuarios = await fetch('/api/usuarios');
        const usuarios = await responseUsuarios.json();
        
        // Obtener maestros (que incluyen información del usuario)
        const responseMaestros = await fetch('/api/maestros');
        const maestros = await responseMaestros.json();
        
        // Debug: mostrar datos recibidos
        console.log('Usuarios regulares:', usuarios);
        console.log('Maestros:', maestros);
        
        const table = document.getElementById('usuariosUnificadosTable');
        
        // Combinar datos: usuarios que no son maestros + maestros con información completa
        const usuariosCompletos = [];
        const nombresUsuariosUsados = new Set();
        
        // Primero agregar maestros (tienen prioridad)
        maestros.forEach(maestro => {
            // Verificar que no sea un maestro con nombre de usuario 'admin' si ya existe un admin
            const esAdminMaestro = maestro.nombre_usuario === 'admin';
            const yaExisteAdmin = usuarios.some(u => u.nombre_usuario === 'admin' && u.tipo_usuario === 'admin');
            
            if (!esAdminMaestro || !yaExisteAdmin) {
                usuariosCompletos.push({
                    id: maestro.id_maestro,
                    tipo: 'maestro',
                    nombre_completo: maestro.nombre_completo,
                    nombre_usuario: maestro.nombre_usuario,
                    tipo_usuario: maestro.tipo_usuario || 'maestro',
                    fuente: 'maestros'
                });
                nombresUsuariosUsados.add(maestro.nombre_usuario);
            }
        });
        
        // Luego agregar usuarios regulares que no sean maestros y no tengan nombre de usuario duplicado
        usuarios.forEach(usuario => {
            if (usuario.tipo_usuario !== 'maestro' && !nombresUsuariosUsados.has(usuario.nombre_usuario)) {
                // Para el usuario admin, mostrar un nombre más descriptivo
                let nombreCompleto = '-';
                if (usuario.tipo_usuario === 'admin') {
                    nombreCompleto = 'Administrador del Sistema';
                }
                
                usuariosCompletos.push({
                    id: usuario.id,
                    tipo: 'usuario',
                    nombre_completo: nombreCompleto,
                    nombre_usuario: usuario.nombre_usuario,
                    tipo_usuario: usuario.tipo_usuario,
                    fuente: 'usuarios'
                });
                nombresUsuariosUsados.add(usuario.nombre_usuario);
            }
        });
        
        if (usuariosCompletos.length === 0) {
            table.innerHTML = '<p>No hay usuarios registrados en el sistema</p>';
            return;
        }
        
        // Ordenar usuarios: admin primero, luego maestros, luego otros usuarios
        usuariosCompletos.sort((a, b) => {
            if (a.tipo_usuario === 'admin') return -1;
            if (b.tipo_usuario === 'admin') return 1;
            if (a.tipo_usuario === 'maestro' && b.tipo_usuario !== 'maestro') return -1;
            if (b.tipo_usuario === 'maestro' && a.tipo_usuario !== 'maestro') return 1;
            return a.nombre_usuario.localeCompare(b.nombre_usuario);
        });
        
        // Debug: mostrar usuarios finales
        console.log('Usuarios finales a mostrar:', usuariosCompletos);
        
        let html = '<table class="data-table">';
        html += '<tr><th>Tipo</th><th>Nombre Completo</th><th>Usuario</th><th>Rol</th><th>Acciones</th></tr>';
        
        usuariosCompletos.forEach(usuario => {
            const iconoTipo = usuario.tipo_usuario === 'admin' ? '👑' : 
                             usuario.tipo_usuario === 'maestro' ? '🎓' : '👮';
            
            html += `<tr>
                <td>${iconoTipo}</td>
                <td>${usuario.nombre_completo}</td>
                <td>${usuario.nombre_usuario}</td>
                <td><span class="badge badge-${usuario.tipo_usuario}">${usuario.tipo_usuario}</span></td>
                <td>
                    <button onclick="editarUsuarioUnificado('${usuario.fuente}', ${usuario.id}, '${usuario.nombre_completo}', '${usuario.nombre_usuario}', '${usuario.tipo_usuario}')" class="btn-editar">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="eliminarUsuarioUnificado('${usuario.fuente}', ${usuario.id}, '${usuario.nombre_completo || usuario.nombre_usuario}')" class="btn-eliminar">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </td>
            </tr>`;
        });
        
        html += '</table>';
        table.innerHTML = html;
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        showAlert('Error al cargar usuarios del sistema', 'error');
    }
}

// Variables globales para edición
let editandoUsuario = null;

// Función para editar usuario unificado
function editarUsuarioUnificado(fuente, id, nombreCompleto, nombreUsuario, tipoUsuario) {
    editandoUsuario = { fuente, id, nombreCompleto, nombreUsuario, tipoUsuario };
    
    // Llenar el formulario con los datos actuales
    document.getElementById('tipoUsuario').value = tipoUsuario;
    document.getElementById('nombreUsuario').value = nombreUsuario;
    
    // Si es maestro, mostrar campo nombre real y llenarlo
    if (tipoUsuario === 'maestro') {
        toggleNombreReal();
        document.getElementById('nombreReal').value = nombreCompleto;
    }
    
    // Cambiar el texto del botón y mostrar cancelar
    document.getElementById('btn_text').textContent = 'Actualizar Usuario';
    document.getElementById('btn_cancelar').style.display = 'inline-block';
    
    // Hacer scroll al formulario
    document.getElementById('formUsuarioUnificado').scrollIntoView({ behavior: 'smooth' });
}

// Función para cancelar edición
function cancelarEdicion() {
    editandoUsuario = null;
    document.getElementById('formUsuarioUnificado').reset();
    document.getElementById('grupo_nombre_real').style.display = 'none';
    document.getElementById('btn_text').textContent = 'Registrar Usuario';
    document.getElementById('btn_cancelar').style.display = 'none';
}

// Función para eliminar usuario unificado
function eliminarUsuarioUnificado(fuente, id, nombre) {
    const tipoEntidad = fuente === 'maestros' ? 'maestro' : 'usuario';
    const endpoint = fuente === 'maestros' ? `/api/maestros/${id}` : `/api/usuarios/${id}`;
    
    if (confirm(`¿Está seguro que desea eliminar al ${tipoEntidad} ${nombre}? Esta acción no se puede deshacer.`)) {
        fetch(endpoint, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success || data.message) {
                showAlert(`${tipoEntidad.charAt(0).toUpperCase() + tipoEntidad.slice(1)} eliminado correctamente`, 'success');
                cargarUsuariosUnificados();
            } else {
                showAlert(data.error || `Error al eliminar ${tipoEntidad}`, 'error');
            }
        })
        .catch(error => {
            console.error(`Error al eliminar ${tipoEntidad}:`, error);
            showAlert(`Error al eliminar ${tipoEntidad}`, 'error');
        });
    }
}

// Manejador del formulario unificado
document.addEventListener('DOMContentLoaded', function() {
    const formUsuarioUnificado = document.getElementById('formUsuarioUnificado');
    if (formUsuarioUnificado) {
        formUsuarioUnificado.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const tipoUsuario = formData.get('tipoUsuario');
            const nombreUsuario = formData.get('nombreUsuario');
            const contrasena = formData.get('contrasena');
            const nombreReal = formData.get('nombreReal');
            
            try {
                let endpoint, method, datos;
                
                if (editandoUsuario) {
                    // Edición
                    method = 'PUT';
                    if (editandoUsuario.fuente === 'maestros') {
                        endpoint = `/api/maestros/${editandoUsuario.id}`;
                        datos = {
                            nombre_completo: nombreReal,
                            nombre_usuario: nombreUsuario,
                            contrasena: contrasena,
                            tipo_usuario: tipoUsuario
                        };
                    } else {
                        // Para admin y prefecto
                        endpoint = `/api/usuarios/${editandoUsuario.id}`;
                        datos = {
                            nombreUsuario: nombreUsuario,  // camelCase
                            contrasena: contrasena,
                            tipoUsuario: tipoUsuario  // camelCase
                        };
                    }
                } else {
                    // Creación
                    method = 'POST';
                    if (tipoUsuario === 'maestro') {
                        endpoint = '/api/maestros';
                        datos = {
                            nombre_completo: nombreReal,
                            nombre_usuario: nombreUsuario,
                            contrasena: contrasena,
                            tipo_usuario: tipoUsuario
                        };
                    } else {
                        // Para admin y prefecto
                        endpoint = '/api/usuarios';
                        datos = {
                            nombreUsuario: nombreUsuario,  // camelCase
                            contrasena: contrasena,
                            tipoUsuario: tipoUsuario  // camelCase
                        };
                    }
                }
                
                const response = await fetch(endpoint, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(datos),
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    const accion = editandoUsuario ? 'actualizado' : 'registrado';
                    showAlert(data.message || `Usuario ${accion} correctamente`, 'success');
                    this.reset();
                    cancelarEdicion();
                    cargarUsuariosUnificados();
                } else {
                    showAlert(data.error || 'Error en la operación', 'error');
                }
            } catch (error) {
                console.error('Error en la operación:', error);
                showAlert('Error de conexión con el servidor', 'error');
            }
        });
    }
});

// Cargar datos iniciales
function cargarDatosIniciales() {
    cargarUsuariosUnificados();
}
