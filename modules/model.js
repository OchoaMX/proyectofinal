import mysql from "mysql2";
import { rejects } from "assert";

// Configuración de conexión
var conexion = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "sistema_perfumes"
});

// Abrir conexión
conexion.connect((error) => {
    if(error){
        console.log("Surgió un error " + error);
    } else {
        console.log("Se conectó a la base de datos de perfumes");
    }
});

var perfumeDB = {};

// Función para insertar perfume
perfumeDB.insertarPerfume = function insertarPerfume(perfume) {
    return new Promise((resolve, reject) => {
        const sqlConsulta = "INSERT INTO perfumes (num_serie, marca, modelo, descripcion, categoria, precio, url_imagen) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const valores = [
            perfume.num_serie,
            perfume.marca,
            perfume.modelo,
            perfume.descripcion,
            perfume.categoria,
            perfume.precio,
            perfume.url_imagen
        ];

        console.log("SQL:", sqlConsulta);
        console.log("Valores:", valores);

        conexion.query(sqlConsulta, valores, (error, resultado) => {
            if (error) {
                console.error("Error al insertar el perfume:", error);
                reject(error);
            } else {
                resolve(resultado.insertId);
            }
        });
    });
};

// Función para mostrar todos los perfumes
perfumeDB.mostrarPerfumes = function mostrarPerfumes(){
    return new Promise((resolve, reject) => {
        let sqlConsulta = "SELECT * FROM perfumes";
        conexion.query(sqlConsulta, (error, resultado) => {
            if(error){
                console.log("Surgió un error" + error);
                reject(error);
            } else {
                console.log("Listado de perfumes obtenidos");
                resolve(resultado);
            }
        });
    });
};

// Función para buscar perfume por número de serie
perfumeDB.buscarPorNumSerie = function buscarPorNumSerie(numSerie){
    return new Promise((resolve, reject) => {
        let sqlConsulta = "SELECT * FROM perfumes WHERE num_serie = ?";
        conexion.query(sqlConsulta, [numSerie], (error, resultado) => {
            if(error){
                console.log("Error al buscar por número de serie: " + error);
                reject(error);
            } else {
                resolve(resultado);
            }
        });
    });
};

// Función para actualizar perfume
perfumeDB.actualizarPorNumSerie = function actualizarPorNumSerie(numSerie, datosActualizados) {
    return new Promise((resolve, reject) => {
        const sqlConsulta = "UPDATE perfumes SET marca = ?, modelo = ?, descripcion = ?, categoria = ?, precio = ?, url_imagen = ? WHERE num_serie = ?";
        const valores = [
            datosActualizados.marca,
            datosActualizados.modelo,
            datosActualizados.descripcion,
            datosActualizados.categoria,
            datosActualizados.precio,
            datosActualizados.url_imagen,
            numSerie
        ];

        console.log("SQL para actualizar:", sqlConsulta);
        console.log("Valores para actualizar:", valores);

        conexion.query(sqlConsulta, valores, (error, resultado) => {
            if (error) {
                console.error("Error al actualizar el perfume:", error);
                reject(error);
            } else {
                resolve(resultado);
            }
        });
    });
};

// Función para eliminar perfume
perfumeDB.borrarPorNumSerie = function borrarPorNumSerie(numSerie) {
    return new Promise((resolve, reject) => {
        const sqlConsulta = "DELETE FROM perfumes WHERE num_serie = ?";
        console.log("SQL para eliminar:", sqlConsulta);
        console.log("Número de serie para eliminar:", numSerie);

        conexion.query(sqlConsulta, [numSerie], (error, resultado) => {
            if (error) {
                console.error("Error al eliminar el perfume:", error);
                reject(error);
            } else {
                resolve(resultado);
            }
        });
    });
};

export default perfumeDB;