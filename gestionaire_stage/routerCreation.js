const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const bcrypt = require('bcrypt');
const dbConfig = require('../database/dbConfig');
// Route pour lister toutes les entreprises inscrites
router.get('/entreprises', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT id_entreprise, nom, secteur_activite, nom_connexion, type_entreprise, date_creation
             FROM Entreprise`
        );

        // Mapper les résultats pour créer un tableau d'entreprises
        const entreprises = result.rows.map((row) => ({
            id_entreprise: row[0],
            nom: row[1],
            secteur_activite: row[2],
            nom_connexion: row[3],
            type_entreprise: row[4],
            date_creation: row[5],
        }));

        res.status(200).json({ entreprises });
    } catch (err) {
        console.error('Erreur lors du chargement des entreprises:', err);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    } finally {
        if (connection) await connection.close();
    }
});


// Créer une entreprise
router.post('/register_Entreprise', async (req, res) => {
    const { nom, secteur_activite, mdp_entreprise, nom_connexion, type_entreprise, date_creation,adresse } = req.body;
 /*   
    if (!nom || !mdp_entreprise || !nom_connexion || !secteur_activite || !type_entreprise || !date_creation) {
        return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }
*/
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(mdp_entreprise, saltRounds);
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `INSERT INTO Entreprise (id_entreprise, nom, mdp_entreprise, secteur_activite, nom_connexion, type_entreprise, date_creation,adresse) 
             VALUES (Entreprise_seq.NEXTVAL, :nom, :mdp_entreprise, :secteur_activite, :nom_connexion, :type_entreprise, TO_DATE(:date_creation, 'YYYY-MM-DD'),:adresse)`,
            { 
                nom, 
                mdp_entreprise: hashedPassword,
                secteur_activite,
                nom_connexion,
                type_entreprise,
                date_creation,
                adresse
            },
            { autoCommit: true }
        );
        res.status(201).json({ message: 'Entreprise enregistrée avec succès!' });
    } catch (err) {
        console.error('Erreur lors de l\'enregistrement:', err);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    } finally {
        if (connection) await connection.close();
    }
});

// Modifier le mot de passe de l'entreprise
router.put('/entreprise/password/:id', async (req, res) => {
    const { new_password } = req.body;
    const { id } = req.params;

    if (!new_password) {
        return res.status(400).json({ error: 'Le nouveau mot de passe est requis.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        // Mettre à jour le mot de passe de l'entreprise
        await connection.execute(
            'UPDATE Entreprise SET mdp_entreprise = :password WHERE id_entreprise = :id',
            { password: new_password, id },
            { autoCommit: true }
        );

        res.json({ message: 'Mot de passe mis à jour avec succès.' });
    } catch (err) {
        console.error('Erreur lors de la mise à jour du mot de passe:', err);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    } finally {
        if (connection) await connection.close();
    }
});


// Créer une école
router.post('/ecole', async (req, res) => {
    const { nom, mdp_ecole, nom_connexion, adresse, nombre_eleve } = req.body;
    
    if (!nom || !mdp_ecole || !nom_connexion || !adresse || !nombre_eleve) {
        return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }

    const hashedPassword = await bcrypt.hash(mdp_ecole, 10);
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `INSERT INTO Ecole (id_ecole, nom, mdp_ecole, nom_connexion, adresse, nombre_eleve) 
             VALUES (Ecole_seq.NEXTVAL, :nom, :mdp_ecole, :nom_connexion, :adresse, :nombre_eleve)`,
            { 
                nom, 
                mdp_ecole: hashedPassword,
                nom_connexion,
                adresse,
                nombre_eleve
            },
            { autoCommit: true }
        );
        res.status(201).json({ message: 'École enregistrée avec succès!' });
    } catch (err) {
        console.error('Erreur lors de l\'enregistrement de l\'école:', err);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    } finally {
        if (connection) await connection.close();
    }
});
// Route pour lister toutes les écoles
router.get('/ecoles', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT id_ecole, nom, nom_connexion, adresse, nombre_eleve,mdp_ecole
             FROM Ecole`
        );
        res.status(200).json({ ecoles: result.rows });
    } catch (err) {
        console.error('Erreur lors du chargement des écoles:', err);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    } finally {
        if (connection) await connection.close();
    }
});
// Modifier le mot de passe de l'école
router.put('/ecole/password/:id', async (req, res) => {
    const { new_password } = req.body;
    const { id } = req.params;

    if (!new_password) {
        return res.status(400).json({ error: 'Le nouveau mot de passe est requis.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            'UPDATE Ecole SET mdp_ecole = :password WHERE id_ecole = :id',
            { password: new_password, id },
            { autoCommit: true }
        );

        res.json({ message: 'Mot de passe mis à jour avec succès.' });
    } catch (err) {
        console.error('Erreur lors de la mise à jour du mot de passe:', err);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    } finally {
        if (connection) await connection.close();
    }
});
// Ajouter un gestionnaire de stage //
router.post('/createGestionnaireStage', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password ) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        // Vérifier si l'utilisateur existe déjà
        const checkUserResult = await connection.execute(
            `SELECT COUNT(*) AS userCount FROM Responsable_Stage WHERE username = :username`,
            { username },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (checkUserResult.rows[0].USERCOUNT > 0) {
            return res.status(409).json({ error: 'Username already exists.' });
        }

        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insérer le nouveau gestionnaire de stage dans la base de données
        await connection.execute(
            `INSERT INTO Responsable_Stage (username, mdp_respo_stage)
             VALUES (:username, :password)`,
            { username, password: hashedPassword },
            { autoCommit: true }
        );

        res.json({ message: 'Gestionnaire de stage créé avec succès!' });
    } catch (err) {
        console.error('Error creating gestionnaire de stage:', err);
        res.status(500).json({ error: 'Internal server error.' });
    } finally {
        if (connection) await connection.close();
    }
});


module.exports = router;