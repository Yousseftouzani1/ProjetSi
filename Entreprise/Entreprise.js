const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../database/dbConfig');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const bodyParser = require("body-parser");
require('dotenv').config({path:'../authentification/.env'});

router.post('/ajouter-gestionnaire', async (req, res) => {
    console.log('Received cookies:', req.cookies);

    const token = req.cookies.access_token;
    if (!token) {
        console.log('Token missing.');
        return res.status(401).json({ error: 'Access token is missing. Please log in.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
        console.log('Decoded token:', decoded);

        const id_entreprise = decoded.entrepriseid;
        const { nom, mdp_gest } = req.body;

        // Validate input
        if (!nom || !mdp_gest) {
            return res.status(400).json({ error: 'Nom and password are required.' });
        }

        const hashedPassword = await bcrypt.hash(mdp_gest, 10);

        let connection;
        try {
            connection = await oracledb.getConnection(dbConfig);

            const sql = `
                INSERT INTO Gestionnaire_Entreprise (id_gest_entreprise, Nom, mdp_gest, id_entreprise)
                VALUES (Gestionnaire_Entreprise_seq.NEXTVAL, :nom, :mdp_gest, :id_entreprise)
            `;

            await connection.execute(
                sql,
                { nom, mdp_gest: hashedPassword, id_entreprise: id_entreprise },
                { autoCommit: true }
            );

            res.status(201).json({ message: 'Gestionnaire ajouté avec succès !' });
        } catch (err) {
            console.error('Error adding manager:', err);
            res.status(500).json({ error: 'Internal server error.' });
        } finally {
            if (connection) {
                try {
                    await connection.close();
                } catch (err) {
                    console.error('Error closing connection:', err);
                }
            }
        }
    } catch (err) {
        console.error('Token verification error:', err);
        res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
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
router.get('/entreprise/:idEntreprise/stagiaires', async (req, res) => {
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
// voir les statistiques des eleves 
/*
router.get('/enterprise-stats', async (req, res) => {
    try {
        const token = req.cookies.access_token;
        if (!token) {
            return res.status(401).json({ error: 'Accès non autorisé. Veuillez vous connecter.' });
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
        const id_entreprise = decodedToken.entrepriseid;

        const connection = await oracledb.getConnection(dbConfig);

        // Requête pour le nombre total de stages acceptés
        const totalInternsQuery = `
            SELECT COUNT(*) AS total_interns 
            FROM STAGE S 
            WHERE TRIM(S.STATUS_STAGE) = 'Accepté' AND S.ID_ENTREPRISE = :id_entreprise
        `;
        const totalInternsResult = await connection.execute(totalInternsQuery, { id_entreprise });
        const totalInterns = totalInternsResult.rows[0][0];

        // Requête pour les statistiques par école
        const schoolStatsQuery = `
            SELECT COUNT(EL.NOM) AS nombre_etudiants, EL.NOM AS ecole
            FROM ETUDIANT E
            JOIN STAGE S ON S.ID_ETUDIANT = E.ID_ETUDIANT
            JOIN ECOLE EL ON EL.ID_ECOLE = E.ID_ECOLE
            WHERE S.ID_ENTREPRISE = :id_entreprise AND S.STATUS_STAGE = 'Accepté'
            GROUP BY EL.NOM
        `;
        const schoolStatsResult = await connection.execute(schoolStatsQuery, { id_entreprise });

        const schoolStats = schoolStatsResult.rows.map(row => ({
            ecole: row[1],
            nombre_etudiants: row[0],
        }));

        // Envoyer les données au frontend
        res.json({ totalInterns, schoolStats });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques :', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des statistiques.' });
    }
});*/


///
router.get('/enterprise-stats', async (req, res) => {
    try {
        const token = req.cookies.access_token;
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
        const id_entreprise = decodedToken.entrepriseid; // ID de l'entreprise depuis le token


        // Récupération des statistiques à partir de l'ID de l'entreprise
        const connection = await oracledb.getConnection(dbConfig);
        const totalInternsQuery = `
            SELECT COUNT(*) AS total_interns
            FROM STAGE
            WHERE TRIM(STATUS_STAGE) = 'Accepté' AND ID_ENTREPRISE = :id_entreprise
        `;

        const schoolStatsQuery = `
            SELECT EL.NOM AS ecole, COUNT(*) AS nombre_etudiants
            FROM ETUDIANT E
            JOIN STAGE S ON S.ID_ETUDIANT = E.ID_ETUDIANT
            JOIN ECOLE EL ON EL.ID_ECOLE = E.ID_ECOLE
            WHERE S.ID_ENTREPRISE = :id_entreprise AND S.STATUS_STAGE = 'Accepté'
            GROUP BY EL.NOM
        `;

        const totalInternsResult = await connection.execute(totalInternsQuery, { id_entreprise });
        const schoolStatsResult = await connection.execute(schoolStatsQuery, { id_entreprise });

        const totalInterns = totalInternsResult.rows[0][0];
        const schoolStats = schoolStatsResult.rows.map(row => ({
            ecole: row[0],
            nombre_etudiants: row[1],
        }));

        res.json({ totalInterns, schoolStats });
    } catch (err) {
        console.error('Erreur lors de la récupération des statistiques :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});
module.exports = router;

