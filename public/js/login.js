document.addEventListener('DOMContentLoaded', function() {
    // Verificar si hay una sesión activa
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.usuario) {
        // Redireccionar según el tipo de usuario
        if (user.tipoUsuario === 'admin') {
            window.location.href = '/admin';
        } else if (user.tipoUsuario === 'maestro') {
            window.location.href = '/maestro';
        }
    }
    
    // Configurar el formulario de login
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const usuario = document.getElementById('usuario').value;
        const contrasena = document.getElementById('contrasena').value;
        
        if (!usuario || !contrasena) {
            showAlert('Usuario y contraseña son obligatorios', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ usuario, contrasena }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                showAlert('Inicio de sesión exitoso', 'success');
                
                // Guardar datos del usuario en localStorage
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Redireccionar según el tipo de usuario
                setTimeout(() => {
                    if (data.user.tipoUsuario === 'admin') {
                        window.location.href = '/admin';
                    } else {
                        window.location.href = '/maestro';
                    }
                }, 1000);
            } else {
                showAlert(data.message || 'Credenciales incorrectas', 'error');
            }
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            showAlert('Error en el servidor. Intente nuevamente.', 'error');
        }
    });
});

function showAlert(message, type) {
    const alertDiv = document.getElementById('loginAlert');
    alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    
    setTimeout(() => {
        alertDiv.innerHTML = '';
    }, 3000);
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = '/';
}

