const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Configurar PostgreSQL (Railway define DATABASE_URL)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Crear tabla enlaces si no existe
pool.query(`
CREATE TABLE IF NOT EXISTS enlaces (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    url TEXT NOT NULL
)
`).catch(err => console.error("Error creando tabla:", err.message));

// Rutas CRUD

// Leer todos los enlaces
app.get("/", async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM enlaces ORDER BY id DESC");

        let html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Biblioteca de Enlaces</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
            <div class="container my-5">
                <h1 class="mb-4 text-center">Biblioteca de Enlaces</h1>
                
                <form method="POST" action="/add" class="mb-5">
                    <div class="mb-3">
                        <input type="text" name="titulo" placeholder="Título del recurso" required class="form-control">
                    </div>
                    <div class="mb-3">
                        <input type="url" name="url" placeholder="URL del recurso" required class="form-control">
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Agregar enlace</button>
                </form>

                <ul class="list-group">`;

        rows.forEach(row => {
            html += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <a href="${row.url}" target="_blank">${row.titulo}</a>
                <div>
                    <a href="/edit/${row.id}" class="btn btn-sm btn-warning me-2">Editar</a>
                    <a href="/delete/${row.id}" class="btn btn-sm btn-danger">Borrar</a>
                </div>
            </li>`;
        });

        html += `</ul></div></body></html>`;
        res.send(html);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Error en la base de datos");
    }
});

// Agregar enlace
app.post("/add", async (req, res) => {
    const { titulo, url } = req.body;
    try {
        await pool.query("INSERT INTO enlaces (titulo, url) VALUES ($1, $2)", [titulo, url]);
        res.redirect("/");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Error agregando enlace");
    }
});

// Eliminar enlace
app.get("/delete/:id", async (req, res) => {
    const id = req.params.id;
    try {
        await pool.query("DELETE FROM enlaces WHERE id = $1", [id]);
        res.redirect("/");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Error eliminando enlace");
    }
});

// Mostrar formulario de edición
app.get("/edit/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const { rows } = await pool.query("SELECT * FROM enlaces WHERE id = $1", [id]);
        const row = rows[0];
        if (!row) return res.status(404).send("Enlace no encontrado");

        let html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Editar Enlace</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
            <div class="container my-5">
                <h1 class="mb-4 text-center">Editar Enlace</h1>
                <form method="POST" action="/edit/${row.id}">
                    <div class="mb-3">
                        <input type="text" name="titulo" value="${row.titulo}" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <input type="url" name="url" value="${row.url}" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-warning w-100">Actualizar enlace</button>
                </form>
            </div>
        </body>
        </html>
        `;
        res.send(html);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Error consultando enlace");
    }
});

// Procesar edición
app.post("/edit/:id", async (req, res) => {
    const id = req.params.id;
    const { titulo, url } = req.body;
    try {
        await pool.query("UPDATE enlaces SET titulo = $1, url = $2 WHERE id = $3", [titulo, url, id]);
        res.redirect("/");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Error actualizando enlace");
    }
});
app.get("/create-table", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS enlaces (
        id SERIAL PRIMARY KEY,
        titulo TEXT NOT NULL,
        url TEXT NOT NULL
      )
    `);
    res.send("Tabla creada o ya existía");
  } catch (err) {
    console.error("Error creando tabla:", err.message);
    res.status(500).send("Error creando tabla: " + err.message);
  }
});


// Iniciar servidor
app.listen(port, () => console.log(`Servidor corriendo en puerto ${port}`));
