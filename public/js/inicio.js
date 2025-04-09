document.getElementById('login').addEventListener('click', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        alert('Por favor, complete todos los campos');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Credenciales correctas - redirigir al panel
            window.location.href = '/panel';
        } else {
            // Credenciales incorrectas - mostrar mensaje
            alert(data.message || 'Credenciales incorrectas');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al conectar con el servidor');
    }
});