const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../database/dbConfig');
const { associateCompetences } = require('./competence');

// Visualiser les offres (GET)
router.get('/get', async (req, res) => {
    try {
        const connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(`SELECT * FROM Offre_Stage`);
        await connection.close();
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch offers.' });
    }
});

// Déposer une offre (POST)
router.post('/add', async (req, res) => {
    const {  titre, description, id_gest_entreprise, id_tuteur } = req.body;
    try {
        const connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `INSERT INTO Offre_Stage ( titre, description, id_gest_entreprise,  id_tuteur) 
             VALUES ( :titre, :description, :id_gest_entreprise,:id_tuteur)`,
            {  titre, description, id_gest_entreprise, id_tuteur },
            { autoCommit: true }
        );
        await connection.close();
        res.status(201).json({ message: 'Offer added successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add offer.' });
    }
});

// Supprimer une offre (DELETE)
router.delete('/delete/:id', async (req, res) => {
    const id_stage = parseInt(req.params.id);
    try {
        const connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `DELETE FROM Offre_Stage WHERE id_stage = :id_stage`,
            { id_stage },
            { autoCommit: true }
        );
        await connection.close();
        res.status(200).json({ message: 'Offer deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete offer.' });
    }
});

// Mettre à jour une offre (PUT)
router.put('/update/:id', async (req, res) => {
    const id_stage = parseInt(req.params.id);
    const { titre, description, id_gest_entreprise,  id_tuteur } = req.body;
    try {
        const connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `UPDATE Offre_Stage 
             SET titre = :titre, description = :description, 
                 id_gest_entreprise = :id_gest_entreprise,  id_tuteur = :id_tuteur
             WHERE id_stage = :id_stage`,
            { id_stage, titre, description, id_gest_entreprise, id_demande, id_tuteur },
            { autoCommit: true }
        );
        await connection.close();
        res.status(200).json({ message: 'Offer updated successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update offer.' });
    }
});
// ajouter des competence a l offre 
router.post('/associateCompetences', associateCompetences);


module.exports = router;
 