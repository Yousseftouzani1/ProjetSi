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

module.exports = router;

