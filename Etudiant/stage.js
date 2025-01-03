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

// Refuser un stage définitivement
router.put('/stage/:id/refuse', async (req, res) => {
    const stageId = req.params.id;
    const query = `UPDATE Stage SET status = 'Refusé' WHERE id_stage = :id`;
    try {
        await executeQuery(query, { id: stageId });
        res.status(200).send({ message: 'Stage refusé définitivement avec succès.' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Erreur lors du refus du stage.' });
    }
});

// Accepter un stage définitivement
router.put('/stage/:id/accept', async (req, res) => {
    const stageId = req.params.id;
    const query = `UPDATE Stage SET status = 'Validé' WHERE id_stage = :id`;
    try {
        await executeQuery(query, { id: stageId });
        res.status(200).send({ message: 'Stage validé définitivement avec succès.' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Erreur lors de la validation du stage.' });
    }
});

module.exports = router;