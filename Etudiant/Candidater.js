const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../database/dbConfig');

// Fonction utilitaire pour exécuter des requêtes Oracle
async function executeQuery(query, binds = {}, options = { autoCommit: true }) {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(query, binds, options);
    return result;
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

// Route pour déposer une candidature
router.post('/deposer', async (req, res) => {
  const { id_etudiant, id_stage } = req.body;

  if (!id_etudiant || !id_stage) {
    return res.status(400).send('id_etudiant et id_stage sont requis!');
  }

  const query = `
    INSERT INTO Candidature (id_candidature, id_stage, id_etudiant, date_soumission)
    VALUES (Candidature_seq.NEXTVAL, :id_stage, :id_etudiant, SYSDATE)
  `;

  try {
    await executeQuery(query, { id_stage, id_etudiant });
    res.status(201).send('Candidature déposée avec succès.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors du dépôt de la candidature.');
  }
});


module.exports = router;
