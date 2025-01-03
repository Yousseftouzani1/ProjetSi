const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../database/dbConfig');
// apres le déroulement des entretien 

// Route pour noter qu'un étudiant a passé la sélection avec succès
router.post('/candidature/valider', async (req, res) => {
    const {  idCandidature } = req.body;

    if ( !idCandidature) {
        return res.status(400).json({ error: 'idCandidature sont requis.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        const sql = `
            UPDATE Stage 
            SET etat_validation = 'Validé'
            WHERE id_candidature = :idCandidature
        `;

        const result = await connection.execute(
            sql,
            {  idCandidature },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Candidature non trouvée ou déjà mise à jour.' });
        }

        res.json({ message: 'L\'étudiant a été validé avec succès.' });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
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

// Route pour noter qu'un étudiant n'a pas passé la sélection
router.post('/candidature/refuser', async (req, res) => {
    const {  idCandidature } = req.body;

    if ( !idCandidature) {
        return res.status(400).json({ error: 'idCandidature sont requis.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        const sql = `
            UPDATE Stage
            SET etat_validation = 'Non validé'
            WHERE id_candidature = :idCandidature
        `;

        const result = await connection.execute(
            sql,
            { idEtudiant, idCandidature },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Candidature non trouvée ou déjà mise à jour.' });
        }

        res.json({ message: 'L\'étudiant a été marqué comme non validé.' });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
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

module.exports = router;
