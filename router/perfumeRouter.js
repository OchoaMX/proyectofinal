import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import perfumeDB from "../modules/model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Ruta para mostrar todos los perfumes
router.get("/mostrar", async (req, res) => {
    try {
        const perfumes = await perfumeDB.mostrarPerfumes();
        res.json(perfumes);
    } catch (error) {
        res.status(500).json({ error: "Error al mostrar los perfumes" });
    }
});

// Ruta para mostrar la página de administrador
router.get("/admin", async (req, res) => {
    try {
        const perfumes = await perfumeDB.mostrarPerfumes();
        res.render("administrador", { perfumes });
    } catch (error) {
        console.error("Error al cargar la página de administrador:", error);
        res.status(500).send("Error al cargar la página de administrador");
    }
});

// Ruta para buscar un perfume por número de serie
router.get("/:numSerie", async (req, res) => {
    try {
        const perfume = await perfumeDB.buscarPorNumSerie(req.params.numSerie);
        if (perfume.length > 0) {
            res.json(perfume[0]);
        } else {
            res.status(404).json({ error: "Perfume no encontrado" });
        }
    } catch (error) {
        console.error("Error al buscar el perfume por número de serie:", error);
        res.status(500).json({ error: "Error al buscar el perfume" });
    }
});

// Ruta para crear nuevo perfume
router.post("/", async (req, res) => {
    try {
        const nuevoPerfume = req.body;

        // Validación de campos requeridos
        if (!nuevoPerfume.num_serie || !nuevoPerfume.marca || !nuevoPerfume.modelo || 
            !nuevoPerfume.descripcion || !nuevoPerfume.categoria || !nuevoPerfume.precio) {
            return res.status(400).json({ error: "Todos los campos son requeridos." });
        }

        // Opcional: Validar que el Base64 sea una imagen válida si se proporciona
        if (nuevoPerfume.imagen_base64 && !nuevoPerfume.imagen_base64.startsWith('data:image')) {
            return res.status(400).json({ error: "El formato de imagen no es válido." });
        }

        const id = await perfumeDB.insertarPerfume(nuevoPerfume);
        res.status(201).json({ id, message: "Perfume agregado correctamente." });
    } catch (error) {
        console.error("Error al agregar el perfume:", error);
        res.status(500).json({ error: error.message || "Error al agregar el perfume." });
    }
});


// Ruta para actualizar un perfume
router.put("/:numSerie", async (req, res) => {
    try {
        const numSerie = req.params.numSerie;
        const datosActualizados = req.body;

        // Validación de campos requeridos
        if (!datosActualizados.marca || !datosActualizados.modelo || 
            !datosActualizados.descripcion || !datosActualizados.categoria || 
            !datosActualizados.precio) {
            return res.status(400).json({ error: "Todos los campos son requeridos para actualizar el perfume." });
        }

        const resultado = await perfumeDB.actualizarPorNumSerie(numSerie, datosActualizados);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: "Perfume no encontrado." });
        }

        res.json({ message: "Perfume actualizado correctamente." });
    } catch (error) {
        console.error("Error al actualizar el perfume:", error);
        res.status(500).json({ error: "Error al actualizar el perfume." });
    }
});

// Ruta para eliminar un perfume
router.delete("/:numSerie", async (req, res) => {
    try {
        const numSerie = req.params.numSerie;
        console.log("Número de serie recibido para eliminar:", numSerie);

        const resultado = await perfumeDB.borrarPorNumSerie(numSerie);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: "Perfume no encontrado." });
        }

        res.json({ message: "Perfume eliminado correctamente." });
    } catch (error) {
        console.error("Error al eliminar el perfume:", error);
        res.status(500).json({ error: "Error al eliminar el perfume." });
    }
});

export default router;