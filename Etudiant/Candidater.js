const express = require('express');
const oracledb = require('oracledb');
const dbConfig = require('../database/dbConfig');
const jwt = require('jsonwebtoken');
const router = express.Router();
require('dotenv').config({path:'../authentification/.env'});
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

/*// Route pour déposer une candidature
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
router.post('/deposer', async (req, res) => {
  console.log('Cookies reçus :', req.cookies); // Ajoutez ce log
  const token = req.cookies.access_token; // Récupérer le token
  if (!token) {
    return res.status(401).json({ error: 'Access token is missing. Please log in.' });
  }

  try {
    // Vérifier et décoder le token JWT
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    const idEtudiant = decoded.studentId;

    const { id_stage } = req.body;
    if (!id_stage) {
      return res.status(400).json({ error: 'Stage ID is required.' });
    }

    // Connexion à OracleDB et insertion dans la table de candidatures
    const connection = await oracledb.getConnection(dbConfig);
    const query = `
      INSERT INTO Candidatures (id_candidature,id_etudiant, id_stage, date_postulation)
      VALUES (Candidature_seq.NEXTVAL,:idEtudiant, :idStage, SYSDATE)
    `;
    await connection.execute(query, { idEtudiant, idStage: id_stage }, { autoCommit: true });
    await connection.close();

    res.status(200).json({ message: 'Votre candidature a été envoyée avec succès !' });
  } catch (err) {
    console.error('Erreur lors de la postulation:', err);
    res.status(500).json({ error: 'Une erreur est survenue lors de la postulation.' });
  }
});*/
router.post('/deposer', async (req, res) => {
  console.log('Cookies reçus :', req.cookies);

  const token = req.cookies.access_token;
  if (!token) {
      console.log('Token manquant.');
      return res.status(401).json({ error: 'Access token is missing. Please log in.' });
  }

  try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
      console.log('Token décodé :', decoded);

      const idEtudiant = decoded.studentId;
      const { id_stage } = req.body;
      if (!id_stage) {
          console.log('ID stage manquant.');
          return res.status(400).json({ error: 'Stage ID is required.' });
      }

      const connection = await oracledb.getConnection(dbConfig);
      console.log('Connexion OracleDB établie.');

      const query = `
          INSERT INTO Candidature (id_candidature, id_etudiant, id_stage, date_soumission)
          VALUES (Candidature_seq.NEXTVAL, :idEtudiant, :idStage, SYSDATE)
      `;
      await connection.execute(query, { idEtudiant, idStage: id_stage }, { autoCommit: true });
      console.log('Requête exécutée avec succès.');

      await connection.close();
      res.status(200).json({ message: 'Votre candidature a été envoyée avec succès !' });
  } catch (err) {
      console.error('Erreur lors de la postulation :', err);
      res.status(500).json({ error: 'Une erreur est survenue lors de la postulation.' });
  }
});
router.post('/cv', async (req, res) => {
  const { experiences, competences, languages, formation, idEtudiant } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    console.log('Connexion OracleDB établie.');

    // Vérifier si un enregistrement existe déjà pour l'étudiant
    const checkQuery = `
      SELECT COUNT(*) AS count
      FROM Etudiant
      WHERE id_etudiant = :idEtudiant
    `;

    const result = await connection.execute(checkQuery, { idEtudiant });
    const count = result.rows[0][0];

    let query;
    let params;

    if (count === 0) {
      // Si aucun enregistrement n'existe, insérer
      query = `
        INSERT INTO Etudiant (id_etudiant, experiences, competences, languages, formation)
        VALUES (:idEtudiant, :experiences, :competences, :languages, :formation)
      `;
      params = { idEtudiant, experiences, competences, languages, formation };
    } else {
      // Sinon, mettre à jour
      query = `
        UPDATE Etudiant
        SET experiences = :experiences,
            competences = :competences,
            languages = :languages,
            formation = :formation
        WHERE id_etudiant = :idEtudiant
      `;
      params = { idEtudiant, experiences, competences, languages, formation };
    }

    await connection.execute(query, params, { autoCommit: true });
    console.log('Requête exécutée avec succès.');

    await connection.close();
    res.status(200).json({ message: 'Données enregistrées ou mises à jour avec succès.' });
  } catch (err) {
    console.error('Erreur lors de la gestion des données :', err);
    res.status(500).json({ error: 'Une erreur est survenue lors de l\'opération.' });
  }
});
router.get("/etudiant/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    console.log("Connexion OracleDB établie.");

    const query = `
      SELECT username, email, telephone, formation, experiences, competences, languages
      FROM Etudiant
      WHERE id_etudiant = :id
    `;

    const result = await connection.execute(query, { id });

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Étudiant non trouvé." });
    }

    const [nom, email, telephone, formation, experiences, competences, languages] =
      result.rows[0];

    res.status(200).json({
      nom,
      email,
      telephone,
      formation,
      experiences,
      competences,
      languages,
    });

    await connection.close();
  } catch (err) {
    console.error("Erreur lors de l'extraction des données :", err);
    res.status(500).json({ error: "Erreur lors de l'extraction des données." });
  }
});

module.exports = router;
