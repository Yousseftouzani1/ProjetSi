const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../database/dbConfig');


// Route: Ajouter un gestionnaire
router.post("/ajouter-gestionnaire", async (req, res) => {
  const { nom, mdp_gest } = req.body;

  // Validate input
  if (!nom || !mdp_gest) {
      return res.status(400).json({ error: 'Nom and password are required.' });
  }

  try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(mdp_gest, 10); // 10 is the salt rounds

      const connection = await oracledb.getConnection(dbConfig);

      const sql = `
          INSERT INTO Gestionnaire_Entreprise (Nom, mdp_gest)
          VALUES (:nom, :mdp_gest)
      `;

      // Execute the insertion with the hashed password
      await connection.execute(sql, [nom, hashedPassword], { autoCommit: true });
      await connection.close();

      res.send("Gestionnaire ajouté avec succès !");
  } catch (err) {
      console.error("Erreur:", err);
      res.status(500).send("Erreur lors de l'ajout du gestionnaire.");
  }
});

//ajouter tuteur 
router.post('/add-tuteur', async (req, res) => {
  const { nom } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `INSERT INTO Tuteur (id_tuteur, Nom_tuteur) 
       VALUES (Tuteur_seq.NEXTVAL, :nom)`,
      { id_gest_entreprise, nom },
      { autoCommit: true }
    );

    await connection.close();
    res.status(200).send('Tuteur ajouté.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de l\'ajout du tuteur.');
  }
});

//voir le nombre de stagiaire 
app.get('/entreprise/:idEntreprise/stagiaires', async (req, res) => {
  const { idEntreprise } = req.params; // ID de l'entreprise passé en paramètre URL

  let connection;
  try {
      connection = await oracledb.getConnection(dbConfig);

      // Requête SQL pour compter le nombre de stagiaires
      const sql = `
          SELECT COUNT(DISTINCT C.ID_ETUDIANT) AS NB_STAGIAIRES
          FROM Stage S
          INNER JOIN Candidature C ON S.ID_STAGE = C.ID_STAGE
          WHERE S.ID_ENTREPRISE = :idEntreprise
            AND C.etat_validation = 'Acceptée' -- Filtre sur les candidatures acceptées
      `;

      const result = await connection.execute(
          sql,
          { idEntreprise }, // Lier la valeur de l'ID de l'entreprise
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      // Extraire le nombre de stagiaires du résultat
      const nbStagiaires = result.rows.length > 0 ? result.rows[0].NB_STAGIAIRES : 0;

      res.json({ idEntreprise, nbStagiaires });
  } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Internal server error' });
  } finally {
      if (connection) {
          try {
              await connection.close();
          } catch (err) {
              console.error('Error closing connection:', err);
          }
      }
  }
});

module.exports = router;

