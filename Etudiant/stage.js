const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../database/dbConfig');
const jwt = require('jsonwebtoken'); // Assurez-vous d'avoir jwt installé
require('dotenv').config({path:'../authentification/.env'});
//////////////////////ETUDIANT  
//apres avoir passer l entretien avec succes

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

// Accepter un stage définitivement (status=Validé)
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


//afficher les stage pour l etudiant encours a valider 
router.get('/stagee', async (req, res) => {
  const token = req.cookies.access_token;
  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    const studentId = parseInt(decodedToken.studentId, 10);
    
    if (isNaN(studentId)) {
      return res.status(400).send('ID de l\'étudiant invalide.');
    }

    const connection = await oracledb.getConnection(dbConfig);
    
    const result = await connection.execute(`
      SELECT 
        S.ID_STAGE,
        S.ID_ENTREPRISE,
        E.USERNAME,
        S.ID_OFFRE,
        En.NOM,
        O.TITRE,
        O.DESCRIPTION,
        En.adresse
      FROM STAGE S
      JOIN ETUDIANT E ON S.ID_ETUDIANT = E.ID_ETUDIANT
      JOIN ENTREPRISE En ON En.ID_ENTREPRISE = S.ID_ENTREPRISE
      JOIN OFFRE_STAGE O ON O.ID_STAGE = S.ID_OFFRE
      WHERE S.ID_ETUDIANT = :studentId AND S.STATUS_STAGE='en attente de validation eleve'
    `, 
    {
      studentId: studentId
    },
    {
      outFormat: oracledb.OUT_FORMAT_OBJECT // This ensures results come back as objects
    });

    // Map the results to a more readable format
    const mappedResults = result.rows.map(row => ({
      internshipId: row.ID_STAGE,
      companyId: row.ID_ENTREPRISE,
      studentUsername: row.USERNAME,
      offerId: row.ID_OFFRE,
      companyName: row.NOM,
      internshipTitle: row.TITRE,
      description: row.DESCRIPTION,
      companyAddress: row.ADRESSE
    }));

    await connection.close();
    res.json(mappedResults);

  } catch (error) {
    console.error('Erreur lors de la récupération des stages:', error);
    res.status(500).send('Erreur lors de la récupération des stages.');
  }
});
//afficher les stages encours
router.get('/stageA', async (req, res) => {
  const token = req.cookies.access_token;
  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    const studentId = parseInt(decodedToken.studentId, 10);
    
    if (isNaN(studentId)) {
      return res.status(400).send('ID de l\'étudiant invalide.');
    }

    const connection = await oracledb.getConnection(dbConfig);
    
    const result = await connection.execute(`
      SELECT 
        S.ID_STAGE,
        S.ID_ENTREPRISE,
        E.USERNAME,
        S.ID_OFFRE,
        En.NOM,
        O.TITRE,
        O.DESCRIPTION,
        En.adresse
      FROM STAGE S
      JOIN ETUDIANT E ON S.ID_ETUDIANT = E.ID_ETUDIANT
      JOIN ENTREPRISE En ON En.ID_ENTREPRISE = S.ID_ENTREPRISE
      JOIN OFFRE_STAGE O ON O.ID_STAGE = S.ID_OFFRE
      WHERE S.ID_ETUDIANT = :studentId AND S.STATUS_STAGE='Accepté'
    `, 
    {
      studentId: studentId
    },
    {
      outFormat: oracledb.OUT_FORMAT_OBJECT // This ensures results come back as objects
    });

    // Map the results to a more readable format
    const mappedResults = result.rows.map(row => ({
      internshipId: row.ID_STAGE,
      companyId: row.ID_ENTREPRISE,
      studentUsername: row.USERNAME,
      offerId: row.ID_OFFRE,
      companyName: row.NOM,
      internshipTitle: row.TITRE,
      description: row.DESCRIPTION,
      companyAddress: row.ADRESSE
    }));

    await connection.close();
    res.json(mappedResults);

  } catch (error) {
    console.error('Erreur lors de la récupération des stages:', error);
    res.status(500).send('Erreur lors de la récupération des stages.');
  }
});

//accepter ou refuser celon l etat passer par la fct 
// UPDATE STAGE SET STATUS_STAGE='Accepté' WHERE ID_STAGE =:id_stage
router.put('/stage/:id_stage/status', async (req, res) => {
  const token = req.cookies.access_token;
  const { status } = req.body; // Expected status: 'Accepté' or 'Refusé'
  const { id_stage } = req.params;

  try {
    // Verify token and get student ID
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    const studentId = parseInt(decodedToken.studentId, 10);

    // Validate inputs
    if (isNaN(parseInt(id_stage, 10))) {
      return res.status(400).send('ID du stage invalide.');
    }

    if (!['Accepté', 'Refusé'].includes(status)) {
      return res.status(400).send('Statut invalide. Le statut doit être "Accepté" ou "Refusé".');
    }

    // Get database connection
    const connection = await oracledb.getConnection(dbConfig);

    // First verify if the stage belongs to the student
    const verifyStage = await connection.execute(
      `SELECT ID_STAGE FROM STAGE 
       WHERE ID_STAGE = :id_stage AND ID_ETUDIANT = :studentId`,
      {
        id_stage: parseInt(id_stage, 10),
        studentId: studentId
      }
    );

    if (verifyStage.rows.length === 0) {
      await connection.close();
      return res.status(403).send('Vous n\'êtes pas autorisé à modifier ce stage.');
    }

    // Update the stage status
    const result = await connection.execute(
      `UPDATE STAGE 
       SET STATUS_STAGE = :status 
       WHERE ID_STAGE = :id_stage`,
      {
        status: status,
        id_stage: parseInt(id_stage, 10)
      },
      { autoCommit: true }
    );

    await connection.close();

    if (result.rowsAffected === 1) {
      res.json({
        message: `Le stage a été ${status.toLowerCase()} avec succès.`,
        status: status,
        id_stage: id_stage
      });
    } else {
      res.status(404).send('Stage non trouvé.');
    }

  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut du stage:', error);
    res.status(500).send('Erreur lors de la mise à jour du statut du stage.');
  }
});

module.exports = router;