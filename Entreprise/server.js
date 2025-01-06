const express = require("express");
const oracledb = require("oracledb");
const bcrypt = require("bcrypt");
const app = express();
const dbConfig = require('../database/dbConfig');
const path = require('path');
// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
const entreprise = require('./Entreprise');
app.use('/entre',entreprise);
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Entreprise/Creer_gestionaire.html'));//Creer_gestionaire
});

// Route: Ajouter un gestionnaire
app.post("/ajouter-gestionnaire", async (req, res) => {
  const { nom, mdp_gest } = req.body;

  if (!nom || !mdp_gest) {
    return res.status(400).json({ error: "Nom and password are required." });
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(mdp_gest, saltRounds);
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);

    const sql = `
      INSERT INTO Gestionnaire_Entreprise (id_gest_entreprise, Nom, mdp_gest)
      VALUES (Gestionnaire_Entreprise_seq.NEXTVAL, :nom, :mdp_gest)
    `;

    await connection.execute(sql, { nom, mdp_gest: hashedPassword }, { autoCommit: true });

    res.status(201).json({ message: "Gestionnaire ajouté avec succès !" });
  } catch (err) {
    console.error("Erreur lors de l'ajout du gestionnaire:", err);
    res.status(500).json({ error: "Erreur interne du serveur." });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Erreur lors de la fermeture de la connexion:", err);
      }
    }
  }
});

// Start server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
