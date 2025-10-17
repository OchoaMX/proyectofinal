// ===== FUNCIONES COMUNES DEL SISTEMA =====

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user.usuario || user.tipoUsuario !== 'admin') {
        window.location.href = '/';
        return;
    }
    
    document.getElementById('userName').textContent = 'Usuario: ' + (user.nombre || user.usuario || 'Administrador');
    
    // Actualizar información del footer
    const footerUserName = document.getElementById('footerUserName');
    const lastUpdate = document.getElementById('lastUpdate');
    
    if (footerUserName) {
        footerUserName.textContent = user.nombre || user.usuario || 'Administrador';
    }
    
    if (lastUpdate) {
        lastUpdate.textContent = new Date().toLocaleString('es-ES');
    }
    
    // Cargar datos iniciales según la página
    if (typeof cargarDatosIniciales === 'function') {
        cargarDatosIniciales();
    }
});

// Función para mostrar alertas
function showAlert(message, type) {
    const alertsDiv = document.getElementById('alerts');
    if (alertsDiv) {
        alertsDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
        
        setTimeout(() => {
            alertsDiv.innerHTML = '';
        }, 3000);
    }
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('user');
    window.location.href = '/';
}

// ===== FUNCIONES DE EDICIÓN Y ELIMINACIÓN =====

// Modal
function mostrarModal(titulo) {
    const modalTitulo = document.getElementById('modalTitulo');
    const modalEdicion = document.getElementById('modalEdicion');
    
    if (modalTitulo && modalEdicion) {
        modalTitulo.textContent = titulo;
        modalEdicion.style.display = 'block';
    }
}

function cerrarModal() {
    const modalEdicion = document.getElementById('modalEdicion');
    if (modalEdicion) {
        modalEdicion.style.display = 'none';
    }
}

// ===== FUNCIONES DEL FOOTER =====

// Función para exportar datos
function exportarDatos() {
    showAlert('Función de exportación en desarrollo', 'info');
}

// Función para generar reporte PDF
function generarReporte() {
    showAlert('Función de reporte PDF en desarrollo', 'info');
}

// Actualizar timestamp cada minuto
setInterval(() => {
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = new Date().toLocaleString('es-ES');
    }
}, 60000);
