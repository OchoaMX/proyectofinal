// Variables globales
let perfumes = [];
const API_URL = '/perfumes'; // Esta URL base es correcta
let editando = false;

// Elementos del DOM
const formulario = document.getElementById('formularioProductos');
const numSerieInput = document.getElementById('txtNumSerie');
const marcaInput = document.getElementById('txtMarca');
const modeloInput = document.getElementById('txtModelo');
const descripcionInput = document.getElementById('txtDescripcion');
const categoriaInput = document.getElementById('txtCategoria');
const precioInput = document.getElementById('txtPrecio');
const urlInput = document.getElementById('txtUrl');
const imageInput = document.getElementById('imageInput');
const mensaje = document.getElementById('mensaje');
const tablaCuerpo = document.querySelector('#tablaProductos tbody');

// Botones
const btnAgregar = document.getElementById('btnAgregar');
const btnBuscar = document.getElementById('btnBuscar');
const btnActualizar = document.getElementById('btnActualizar');
const btnBorrar = document.getElementById('btnBorrar');

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, iniciando carga de perfumes...');
    cargarPerfumes();
});

// Event listeners para los botones
btnAgregar.addEventListener('click', agregarPerfume);
btnBuscar.addEventListener('click', buscarPerfume);
btnActualizar.addEventListener('click', actualizarPerfume);
btnBorrar.addEventListener('click', borrarPerfume);

// Manejo de imágenes
imageInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        
        // Validar tamaño (máximo 2MB)
        if (file.size > 2 * 1024 * 1024) {
            mostrarMensaje('La imagen no debe exceder 2MB', 'red');
            this.value = '';
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // Crear imagen para redimensionar
            const img = new Image();
            
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Configuración de redimensionamiento
                const MAX_WIDTH = 128;
                const MAX_HEIGHT = 128;
                let width = img.width;
                let height = img.height;
                
                // Redimensionar manteniendo proporciones
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Calidad de compresión (0.7 = 70%)
                const CALIDAD = 0.7;
                
                // Dibujar imagen redimensionada
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convertir a Base64 con compresión
                const imagenComprimida = canvas.toDataURL('image/jpeg', CALIDAD);
                
                // Asignar al campo del formulario
                urlInput.value = imagenComprimida;
                mostrarMensaje('Imagen optimizada y cargada', 'green');
                
                // Mostrar previsualización
                const preview = document.getElementById('imagePreview');
                if (preview) {
                    preview.src = imagenComprimida;
                    preview.style.display = 'block';
                }
            };
            
            img.onerror = function() {
                mostrarMensaje('Error al procesar la imagen', 'red');
            };
            
            img.src = e.target.result;
        };
        
        reader.onerror = function() {
            mostrarMensaje('Error al leer la imagen', 'red');
        };
        
        reader.readAsDataURL(file);
    }
});

// Función para cargar perfumes desde la API
async function cargarPerfumes() {
    try {
        tablaCuerpo.innerHTML = '<tr><td colspan="7" style="text-align: center;">Cargando perfumes...</td></tr>';
        
        const response = await fetch(`${API_URL}/mostrar`);
        console.log('Respuesta recibida:', response);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        
        perfumes = await response.json();
        console.log('Perfumes cargados:', perfumes);
        
        if (!Array.isArray(perfumes)) {
            throw new Error('La respuesta no es un array válido');
        }
        
        mostrarPerfumes();
        mostrarMensaje(`Se cargaron ${perfumes.length} perfumes`, 'green');
    } catch (error) {
        console.error('Error al cargar perfumes:', error);
        tablaCuerpo.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: red;">
                    Error al cargar: ${error.message}
                </td>
            </tr>
        `;
        mostrarMensaje(`Error: ${error.message}`, 'red');
    }
}

// Función para mostrar los perfumes en la tabla
function mostrarPerfumes() {
    tablaCuerpo.innerHTML = '';
    
    if (perfumes.length === 0) {
        tablaCuerpo.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hay perfumes registrados</td></tr>';
        return;
    }
    
    perfumes.forEach(perfume => {
        const fila = document.createElement('tr');
        fila.dataset.id = perfume.num_serie;
        
        fila.innerHTML = `
            <td>${perfume.num_serie}</td>
            <td>${perfume.marca}</td>
            <td>${perfume.modelo}</td>
            <td class="descripcion-celda">${perfume.descripcion}</td>
            <td>${perfume.categoria}</td>
            <td>$${parseFloat(perfume.precio).toFixed(2)}</td>
            <td>
                <img src="${perfume.imagen_base64 || '/img/default-perfume.jpg'}" 
                     alt="${perfume.marca} ${perfume.modelo}" 
                     class="imagen-miniatura" 
                     onerror="this.src='/img/default-perfume.jpg'">
            </td>
        `;
        
        fila.addEventListener('click', () => seleccionarPerfume(perfume));
        tablaCuerpo.appendChild(fila);
    });
}

// Función para seleccionar un perfume
function seleccionarPerfume(perfume) {
    numSerieInput.value = perfume.num_serie;
    marcaInput.value = perfume.marca;
    modeloInput.value = perfume.modelo;
    descripcionInput.value = perfume.descripcion;
    categoriaInput.value = perfume.categoria;
    precioInput.value = perfume.precio;
    urlInput.value = perfume.imagen_base64 || '';
    
    numSerieInput.readOnly = true;
    
    resaltarFilaSeleccionada(perfume.num_serie);
    mostrarMensaje('Perfume seleccionado', 'blue');
}

// Función para resaltar fila seleccionada
function resaltarFilaSeleccionada(numSerie) {
    document.querySelectorAll('#tablaProductos tbody tr').forEach(fila => {
        fila.classList.remove('seleccionada');
    });
    
    const filaSeleccionada = document.querySelector(`#tablaProductos tbody tr[data-id="${numSerie}"]`);
    if (filaSeleccionada) {
        filaSeleccionada.classList.add('seleccionada');
    }
}

// Función para limpiar formulario
function limpiarFormulario() {
    formulario.reset();
    numSerieInput.readOnly = false;
    mensaje.textContent = '';
    
    document.querySelectorAll('#tablaProductos tbody tr').forEach(fila => {
        fila.classList.remove('seleccionada');
    });
}

// Función para validar formulario
function validarFormulario() {
    if (!numSerieInput.value || !marcaInput.value || !modeloInput.value || 
        !descripcionInput.value || !categoriaInput.value || !precioInput.value) {
        mostrarMensaje('Todos los campos son obligatorios', 'red');
        return false;
    }
    
    if (isNaN(parseFloat(precioInput.value))) {
        mostrarMensaje('El precio debe ser un número válido', 'red');
        return false;
    }
    
    return true;
}

// Función para mostrar mensajes
function mostrarMensaje(texto, color = 'black') {
    mensaje.textContent = texto;
    mensaje.style.color = color;
    
    setTimeout(() => {
        mensaje.textContent = '';
    }, 3000);
}

// Función para agregar perfume
async function agregarPerfume() {
    if (!validarFormulario()) return;
    
    const nuevoPerfume = {
        num_serie: numSerieInput.value,
        marca: marcaInput.value,
        modelo: modeloInput.value,
        descripcion: descripcionInput.value,
        categoria: categoriaInput.value,
        precio: parseFloat(precioInput.value),
        imagen_base64: urlInput.value
    };
    
    try {
        // Aquí usamos directamente la URL base, ya que en el router no hay un 
        // endpoint específico para POST, solo es /perfumes
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevoPerfume)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error ${response.status}`);
        }
        
        await cargarPerfumes();
        limpiarFormulario();
        mostrarMensaje('Perfume agregado correctamente', 'green');
    } catch (error) {
        console.error('Error al agregar perfume:', error);
        mostrarMensaje(`Error: ${error.message}`, 'red');
    }
}

// Función para buscar perfume
async function buscarPerfume() {
    const numSerie = numSerieInput.value;
    
    if (!numSerie) {
        mostrarMensaje('Ingrese un número de serie', 'red');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/${numSerie}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                mostrarMensaje('Perfume no encontrado', 'red');
                return;
            }
            throw new Error(`Error ${response.status}`);
        }
        
        const perfume = await response.json();
        seleccionarPerfume(perfume);
    } catch (error) {
        console.error('Error al buscar perfume:', error);
        mostrarMensaje(`Error: ${error.message}`, 'red');
    }
}

// Función para actualizar perfume
async function actualizarPerfume() {
    const numSerie = numSerieInput.value;
    
    if (!numSerie) {
        mostrarMensaje('Seleccione un perfume primero', 'red');
        return;
    }
    
    if (!validarFormulario()) return;
    
    const datosActualizados = {
        marca: marcaInput.value,
        modelo: modeloInput.value,
        descripcion: descripcionInput.value,
        categoria: categoriaInput.value,
        precio: parseFloat(precioInput.value),
        imagen_base64: urlInput.value
    };
    
    try {
        const response = await fetch(`${API_URL}/${numSerie}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosActualizados)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error ${response.status}`);
        }
        
        await cargarPerfumes();
        limpiarFormulario();
        mostrarMensaje('Perfume actualizado correctamente', 'green');
    } catch (error) {
        console.error('Error al actualizar perfume:', error);
        mostrarMensaje(`Error: ${error.message}`, 'red');
    }
}

// Función para borrar perfume
async function borrarPerfume() {
    const numSerie = numSerieInput.value;
    
    if (!numSerie) {
        mostrarMensaje('Seleccione un perfume primero', 'red');
        return;
    }
    
    if (!confirm(`¿Eliminar el perfume ${numSerie}?`)) return;
    
    try {
        const response = await fetch(`${API_URL}/${numSerie}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error ${response.status}`);
        }
        
        await cargarPerfumes();
        limpiarFormulario();
        mostrarMensaje('Perfume eliminado correctamente', 'green');
    } catch (error) {
        console.error('Error al eliminar perfume:', error);
        mostrarMensaje(`Error: ${error.message}`, 'red');
    }
}