const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const usuarioRoutes = require("./routes/usuario");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Servir arquivos estáticos da pasta /public
app.use(express.static(path.join(__dirname, "public")));

// Rotas de API
app.use("/api", usuarioRoutes);

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
