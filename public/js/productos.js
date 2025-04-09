// Función para cargar los perfumes desde la API
async function cargarPerfumes() {
    try {
        const contenedor = document.getElementById('contenedor-productos');
        contenedor.innerHTML = '<p style="color: white; text-align: center; font-size: 1.5rem;">Cargando perfumes...</p>';
        
        const response = await fetch('/perfumes/mostrar');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('La respuesta no es JSON');
        }
        
        const perfumes = await response.json();
        
        if (!Array.isArray(perfumes)) {
            throw new Error('La respuesta no contiene un array de perfumes');
        }
        
        mostrarPerfumes(perfumes);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('contenedor-productos').innerHTML = `
            <div class="contenedor-mensaje">
                <p id="mensaje" class="mensaje mensaje-error">
                    No se pudieron cargar los productos. ${error.message}
                    <button onclick="cargarPerfumes()" class="boton-reintentar">Reintentar</button>
                </p>
            </div>
        `;
    }
}

// Función para mostrar los perfumes en el DOM con el diseño deseado
function mostrarPerfumes(perfumes) {
    const contenedor = document.getElementById('contenedor-productos');
    contenedor.innerHTML = '';
    
    if (perfumes.length === 0) {
        contenedor.innerHTML = `
            <div class="contenedor-mensaje">
                <p class="mensaje mensaje-informacion">
                    No hay perfumes disponibles en este momento.
                </p>
            </div>
        `;
        return;
    }

    // Agrupar perfumes por categoría
    const perfumesPorCategoria = perfumes.reduce((acc, perfume) => {
        if (!acc[perfume.categoria]) {
            acc[perfume.categoria] = [];
        }
        acc[perfume.categoria].push(perfume);
        return acc;
    }, {});
    
    // Crear secciones para cada categoría
    Object.entries(perfumesPorCategoria).forEach(([categoria, perfumesCategoria]) => {
        const seccionCategoria = document.createElement('div');
        seccionCategoria.className = 'seccion-categoria';
        
        const tituloCategoria = document.createElement('h2');
        tituloCategoria.className = 'titulo-categoria';
        tituloCategoria.textContent = categoria;
        seccionCategoria.appendChild(tituloCategoria);
        
        const gridProductos = document.createElement('div');
        gridProductos.className = 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 grid-productos';
        
        // Agregar productos de esta categoría
        perfumesCategoria.forEach(perfume => {
            const tarjeta = crearTarjetaPerfume(perfume);
            gridProductos.appendChild(tarjeta);
        });
        
        seccionCategoria.appendChild(gridProductos);
        contenedor.appendChild(seccionCategoria);
    });
}

// Función para crear una tarjeta de perfume con el nuevo diseño
function crearTarjetaPerfume(perfume) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-producto';
    tarjeta.dataset.id = perfume.num_serie;
    
    // Contenedor de imagen
    const contenedorImagen = document.createElement('div');
    contenedorImagen.className = 'contenedor-imagen';
    
    const img = document.createElement('img');
    img.src = perfume.imagen_base64 || perfume.url_imagen || '/img/default-perfume.jpg';
    img.alt = `${perfume.marca} ${perfume.modelo}`;
    img.className = 'imagen-producto';
    img.onerror = function() {
        this.src = '/img/default-perfume.jpg';
    };
    
    contenedorImagen.appendChild(img);
    tarjeta.appendChild(contenedorImagen);
    
    // Detalles del producto
    const detallesProducto = document.createElement('div');
    detallesProducto.className = 'detalles-producto';
    
    const nombreProducto = document.createElement('h3');
    nombreProducto.className = 'nombre-producto';
    nombreProducto.textContent = `${perfume.marca} ${perfume.modelo}`;
    
    const descripcion = document.createElement('p');
    descripcion.className = 'descripcion-producto';
    // Limitar la descripción a 100 caracteres
    descripcion.textContent = perfume.descripcion.length > 100 
        ? `${perfume.descripcion.substring(0, 100)}...` 
        : perfume.descripcion;
    
    const precio = document.createElement('span');
    precio.className = 'precio-producto';
    precio.textContent = `$${parseFloat(perfume.precio).toFixed(2)}`;
    
    detallesProducto.appendChild(nombreProducto);
    detallesProducto.appendChild(descripcion);
    detallesProducto.appendChild(precio);
    
    tarjeta.appendChild(detallesProducto);
    
    return tarjeta;
}

// Función para mostrar mensajes
function mostrarMensaje(texto, tipo = 'informacion') {
    const contenedorMensaje = document.getElementById('contenedor-mensaje');
    const elementoMensaje = document.getElementById('mensaje');
    
    if (!contenedorMensaje || !elementoMensaje) {
        console.error('Elementos del mensaje no encontrados');
        return;
    }
    
    elementoMensaje.textContent = texto;
    contenedorMensaje.classList.remove('hidden');
    
    // Cambiar estilo según el tipo de mensaje
    contenedorMensaje.className = 'contenedor-mensaje';
    elementoMensaje.className = tipo === 'error' 
        ? 'mensaje mensaje-error' 
        : 'mensaje mensaje-informacion';

    // Ocultar mensaje después de 3 segundos
    setTimeout(() => {
        contenedorMensaje.classList.add('hidden');
    }, 3000);
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarPerfumes();
    
    // Agregar evento al botón de reintentar si existe
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('boton-reintentar')) {
            cargarPerfumes();
        }
    });
});