const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../database/dbConfig');
// Visualiser les tuteurs possible  (GET)
router.get('/getT', async (req, res) => {
    try {
        const connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(`SELECT * FROM Tuteur`);
        await connection.close();
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch offers.' });
    }
});

//affecter un tuteur a une offre precise (chaque offre est associe a un seul tuteur ) 
router.put('/offre-stage/:id/affecter-tuteur', async (req, res) => {
    const offreId = req.params.id;
    const { tuteurId } = req.body; // `tuteurId` à inclure dans le corps de la requête.
    try {
        const query = `
            UPDATE Offre_Stage 
            SET id_tuteur = :tuteurId 
            WHERE id_stage = :offreId
        `;
        await db.execute(query, [tuteurId, offreId]);
        res.status(200).send({ message: 'Tuteur affecté avec succès à l\'offre de stage.' });
    } catch (error) {
        res.status(500).send({ error: 'Erreur lors de l\'affectation du tuteur.' });
    }
});

//ajout du tuteur est dans Entreprise.js

module.exports = router;
