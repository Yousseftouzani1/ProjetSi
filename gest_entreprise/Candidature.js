const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../database/dbConfig');

// Fonction pour exécuter une requête Oracle
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

// Accepter une candidature
router.post('/accepter/:id', async (req, res) => {
  const idCandidature = req.params.id;
  const query = `
    UPDATE Candidature
    SET statut = 'Acceptée'
    WHERE id_candidature = :id
  `;
  try {
    await executeQuery(query, { id: idCandidature });
    res.status(200).send('Candidature acceptée.');
  } catch (err) {
    res.status(500).send('Erreur lors de l\'acceptation de la candidature.');
  }
});

// avoir l email de l eleve associer a la candidature 
router.get('/getmail/:id',async(req,res)=>{
  const idCandidature = req.params.id;
  const query = `
    SELECT email 
        FROM Etudiant 
        WHERE ID_ETUDIANT IN (
            SELECT ID_ETUDIANT 
            FROM CANDIDATURE 
            WHERE ID_CANDIDATURE = :id
        );
`;
try {
  await executeQuery(query, { id: idCandidature });
  res.status(200).send('Candidature acceptée.');
} catch (err) {
  res.status(500).send('Erreur lors de l\'acceptation de la candidature.');
}
});

// Refuser une candidature
router.post('/refuser/:id', async (req, res) => {
  const idCandidature = req.params.id;
  const query = `
    UPDATE Candidature
    SET statut = 'refusée'
    WHERE id_candidature = :id
  `;
  try {
    await executeQuery(query, { id: idCandidature });
    res.status(200).send('Candidature refusée.');
  } catch (err) {
    res.status(500).send('Erreur lors du refus de la candidature.');
  }
});


module.exports = router;
