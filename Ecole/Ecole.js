const express = require('express');
const router = express.Router();
const dbConfig = require('../database/dbConfig');
const oracledb = require('oracledb');
const bcrypt = require('bcrypt');

// Route pour visualiser les étudiants sans stage
  router.get('/sansStage', async (req, res) => {
    const { id_ecole } = req.body;

           if (!id_ecole) {
                return res.status(400).json({ error: 'L\'ID de l\'école est requis.' });
           }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT username, id_etudiant 
              FROM Etudiant 
               WHERE a_stage = 'sans stage' 
               AND id_gest_ecole IN (SELECT ID_GEST_ECOLE FROM GESTIONNAIRE_ECOLE WHERE GESTIONNAIRE_ECOLE.ID_ECOLE= :id_ecole);`,
            { id_ecole }
        );

        res.status(200).json({ students: result.rows });
    } catch (err) {
        console.error('Erreur lors du chargement des étudiants sans stage:', err);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    } finally {
        if (connection) await connection.close();
    }
});

// Route pour lister toutes les entreprises inscrites
router.get('/entreprises', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT id_entreprise, nom_entreprise, secteur_activite 
             FROM Entreprise`
        );

        res.status(200).json({ entreprises: result.rows });
    } catch (err) {
        console.error('Erreur lors du chargement des entreprises:', err);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    } finally {
        if (connection) await connection.close();
    }
});

// Route pour créer un gestionnaire pour une école
router.post('/create-gestionnaire', async (req, res) => {
    const { username, password, id_ecole } = req.body;

    if (!username || !password || !id_ecole) {
        return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `INSERT INTO Gestionnaire_Ecole (id_gest_ecole, username, mdp_gest_ecole, id_ecole) 
             VALUES (Gestionnaire_Ecole_seq.NEXTVAL, :username, :password, :id_ecole)`,
            { username, password: hashedPassword, id_ecole },
            { autoCommit: true }
        );

        res.status(201).json({ message: 'Gestionnaire créé avec succès!' });
    } catch (err) {
        console.error('Erreur lors de la création du gestionnaire:', err);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;
