const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../database/dbConfig');
const jwt = require('jsonwebtoken');

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




// Route pour afficher toutes les convocations d'un étudiant
router.get('/convocations', async (req, res) => {
  const token = req.cookies.access_token;
  
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
          console.log('Token décodé :', decoded);
    
          const idEtudiant = decoded.studentId;
    const connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `SELECT C.DATE_ACCEPTATION, O.TITRE, O.DESCRIPTION, C.DATE_ENVOI ,C.ID_CONVOCATION
       FROM CONVOCATION C
       JOIN OFFRE_STAGE O ON C.ID_STAGE = O.ID_STAGE
       WHERE C.ID_ETUDIANT = :idEtudiant AND STATUS ='Acceptée'`,
      [idEtudiant] // Valeur dynamique de l'ID de l'étudiant
    );

    await connection.close();

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Aucune convocation trouvée.' });
    }

    // Structurez les résultats pour une réponse plus lisible
    const convocations = result.rows.map(row => ({
      dateAcceptation: row[0],
      titre: row[1],
      description: row[2],
      dateEnvoi: row[3],
      id:row[4],
    }));
    console.log('Convocations renvoyées :', convocations);  // Vérifiez la structure des convocations
    res.json(convocations);
  } catch (error) {
    console.error('Erreur lors de la récupération des convocations:peut etre vous avez recu aucune convocation ', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des convocations.' });
  }
});

// Route pour accepter ou refuser une convocation
router.post('/convocations/:idConvocation/:action', async (req, res) => {
  const { idConvocation, action } = req.params; // Récupérer l'ID de la convocation et l'action (accept/reject)
  // On suppose que l'ID de l'étudiant est récupéré depuis le token JWT
  const token = req.cookies.access_token;
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
  console.log('Token décodé :', decoded);

  const idEtudiant = decoded.studentId;
  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Action invalide. Utilisez "accept" ou "reject".' });
  }

  const status = action === 'accept' ? 'Accepté' : 'Refusée'; // Déterminer le statut

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Vérification si la convocation appartient bien à l'étudiant
    const checkConvocation = await connection.execute(
      `SELECT * FROM Convocation WHERE id_convocation = :idConvocation AND id_etudiant = :idEtudiant`,
      [idConvocation, idEtudiant]
    );

    if (checkConvocation.rows.length === 0) {
      return res.status(404).json({ message: 'Convocation introuvable ou non associée à cet étudiant.' });
    }

    // Mise à jour du statut de la convocation (acceptée ou refusée)
    const result = await connection.execute(
      `UPDATE Convocation SET status = :status WHERE id_convocation = :idConvocation AND id_etudiant = :idEtudiant`,
      [status, idConvocation, idEtudiant],
      { autoCommit: true } // Confirmer la transaction
    );

    await connection.close();

    res.json({ message: `Convocation ${status.toLowerCase()} avec succès.` });
  } catch (error) {
    console.error('Error updating convocation status:', error);
    res.status(500).json({ message: 'Erreur lors de l\'acceptation ou du refus de la convocation.' });
  }
});


module.exports = router;