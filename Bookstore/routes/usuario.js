const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Novo caminho para a pasta 'data'
const DATA_PATH = path.join(__dirname, "../data/usuarios.json");

// Helpers
function loadUsuarios() {
    if (!fs.existsSync(DATA_PATH)) return {};
    const data = fs.readFileSync(DATA_PATH);
    return JSON.parse(data);
}

function saveUsuarios(data) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// GET /api/usuario/:email
router.get("/usuario/:email", (req, res) => {
    const usuarios = loadUsuarios();
    const user = usuarios[req.params.email];
    if (!user) return res.status(404).json({ erro: "Usuário não encontrado" });
    res.json(user);
});

// POST /api/usuario
router.post("/usuario", (req, res) => {
    const { email, nome, foto, bio, cor } = req.body;
    if (!email) return res.status(400).json({ erro: "Email é obrigatório" });

    const usuarios = loadUsuarios();
    usuarios[email] = { email, nome, foto, bio, cor };
    saveUsuarios(usuarios);

    res.json({ sucesso: true, usuario: usuarios[email] });
});

module.exports = router;
