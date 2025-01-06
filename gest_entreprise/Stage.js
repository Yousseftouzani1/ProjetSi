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


router.get('/stages/:idEntreprise', async (req, res) => {
    const { idEntreprise } = req.params;
  
    try {
      const connection = await oracledb.getConnection(dbConfig);
  
      const result = await connection.execute(
        `
        SELECT 
          E.username, 
          O.titre, 
          C.date_acceptation, 
          E.email, 
          S.id_stage
        FROM 
          Stage S
          JOIN Etudiant E ON E.ID_ETUDIANT = S.ID_ETUDIANT
          JOIN OFFRE_STAGE O ON O.ID_STAGE = S.ID_OFFRE
          JOIN CONVOCATION C ON C.ID_STAGE = O.ID_STAGE
        WHERE 
          S.ID_ENTREPRISE = :idEntreprise
          AND C.STATUS = 'Accepté'
        `,
        [idEntreprise],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
  
      await connection.close();
  
      res.json(result.rows);
    } catch (error) {
      console.error('Erreur lors de la récupération des stages:', error);
      res.status(500).send('Erreur lors de la récupération des stages.');
    }
  });
  
  // Route pour mettre à jour le statut du stage
  router.post('/stages/:idStage/etat', async (req, res) => {
    const { idStage } = req.params;
    const { statut } = req.body;
  
    try {
      const connection = await oracledb.getConnection(dbConfig);
  
      await connection.execute(
        `
        UPDATE Stage 
        SET etat_validation = :statut 
        WHERE id_stage = :idStage
        `,
        [statut, idStage],
        { autoCommit: true }
      );
  
      await connection.close();
  
      res.json({ message: `Statut mis à jour avec succès en ${statut}.` });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      res.status(500).send('Erreur lors de la mise à jour du statut.');
    }
  });
  
module.exports = router;
