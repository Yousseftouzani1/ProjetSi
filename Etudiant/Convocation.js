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

// Accepter une convocation
router.put('/convocation/:id/accept', async (req, res) => {
    const convocationId = req.params.id;
    const query = `UPDATE Convocation SET status = 'Acceptée' WHERE id_convocation = :id`;
    try {
        await executeQuery(query, { id: convocationId });
        res.status(200).send({ message: 'Convocation acceptée avec succès.' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Erreur lors de l\'acceptation de la convocation.' });
    }
});

// Refuser une convocation
router.put('/convocation/:id/refuse', async (req, res) => {
    const convocationId = req.params.id;
    const query = `UPDATE Convocation SET status = 'Refusée' WHERE id_convocation = :id`;
    try {
        await executeQuery(query, { id: convocationId });
        res.status(200).send({ message: 'Convocation refusée avec succès.' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Erreur lors du refus de la convocation.' });
    }
});

module.exports = router;