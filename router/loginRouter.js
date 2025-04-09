import express from "express";
import perfumeDB from "../modules/model.js";

const router = express.Router();

// Ruta para login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Buscar usuario por email
        const usuario = await perfumeDB.buscarUsuarioPorEmail(email);
        
        if (!usuario) {
            return res.status(401).json({ 
                success: false, 
                message: "Credenciales incorrectas" 
            });
        }

        // 2. Verificar contraseña (en producción usa bcrypt)
        const passwordValida = await perfumeDB.verificarPassword(password, usuario.password_hash);
        
        if (!passwordValida) {
            return res.status(401).json({ 
                success: false, 
                message: "Credenciales incorrectas" 
            });
        }

        // 3. Si todo es correcto, responder con éxito
        res.json({ 
            success: true,
            user: {
                id: usuario.id,
                email: usuario.email,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error en el servidor" 
        });
    }
});

export default router;