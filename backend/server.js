const express = require("express");
const fs = require("fs");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors());

const GITHUB_REPO = "TU_USUARIO/TU_REPOSITORIO";
const GITHUB_FILE_PATH = "database/users.json";
const GITHUB_TOKEN = "TU_GITHUB_TOKEN";

// Cargar usuarios
const loadUsers = async () => {
    try {
        const response = await axios.get(`https://raw.githubusercontent.com/${GITHUB_REPO}/main/${GITHUB_FILE_PATH}`);
        return response.data ? JSON.parse(response.data) : [];
    } catch (error) {
        return [];
    }
};

// Guardar usuarios
const saveUsers = async (users) => {
    const content = JSON.stringify(users, null, 2);
    const { data } = await axios.get(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`);
    const sha = data.sha;

    await axios.put(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`, {
        message: "Actualizar base de datos",
        content: Buffer.from(content).toString("base64"),
        sha: sha,
    }, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });
};

// Rutas
app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    let users = await loadUsers();

    if (users.find((u) => u.email === email)) return res.status(400).json({ message: "Usuario ya existe" });

    users.push({ name, email, password });
    await saveUsers(users);
    res.json({ message: "Usuario registrado" });
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const users = await loadUsers();
    const user = users.find((u) => u.email === email && u.password === password);
    res.json({ message: user ? "Inicio de sesión exitoso" : "Credenciales incorrectas" });
});

app.listen(3000, () => console.log("Servidor corriendo en http://localhost:3000"));
