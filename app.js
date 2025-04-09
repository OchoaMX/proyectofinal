import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import perfumeRouter from "./router/perfumeRouter.js"; // Importamos el router de perfumes
import authRouter from "./router/loginRouter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configuración de EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Apunta solo a la carpeta views

// Middlewares con límites aumentados para imágenes grandes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/bootstrap", express.static(path.join(__dirname, "node_modules/bootstrap/dist")));

// Configuramos las rutas de perfumes con un prefijo
app.use("/perfumes", perfumeRouter);

// Ruta para el login
app.get("/", (req, res) => {
    res.render("login", { titulo: "Login Administrador" });
});

// Ruta para el sitio web público
app.get("/index", (req, res) => {
    res.render("index", { titulo: "Platinum Perfumes" });
});

app.get("/contacto", (req, res) => {
    res.render("contacto", { titulo: "Contacto" });
});

app.get("/nosotros", (req, res) => {
    res.render("nosotros", { titulo: "nosotros" });
});

app.get("/productos", (req, res) => {
    res.render("inicio", { titulo: "productos" });
});

// Ruta para acceder directamente al panel de administrador
app.get("/admin", (req, res) => {
    res.redirect("/perfumes/admin");
});
app.get("/panel", (req, res) => {
    res.render("panel", { titulo: "Contacto" });
});

app.use('/api', authRouter); // Todas las rutas de auth empezarán con /api

app.listen(80, () => {
    console.log("Servidor corriendo en http://localhost:80");
    console.log("Panel de administración en http://localhost/perfumes/admin");
    console.log("API de perfumes disponible en http://localhost/perfumes/mostrar");
});