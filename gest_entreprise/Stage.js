const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../database/dbConfig');
// apres le déroulement des entretien 
const jwt = require('jsonwebtoken'); // Assurez-vous d'avoir jwt installé
require('dotenv').config({path:'../authentification/.env'});

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
//afficher les stages possible qui doivent etre confirmer par le gestionaire 
router.get('/stages', async (req, res) => {
  const token = req.cookies.access_token;
  try {
    // Décoder le token pour récupérer l'id_entreprise
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    const id_entreprise = parseInt(decodedToken.entrepriseIdg, 10);

    if (isNaN(id_entreprise)) {
      return res.status(400).send('ID de l’entreprise invalide.');
    }

    console.log('ID de l’entreprise :', id_entreprise);

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
        S.ID_ENTREPRISE = :id_entreprise
        AND C.STATUS = 'Accepté' AND S.ETAT_VALIDATION='Non validé'
      `,
      [id_entreprise],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    await connection.close();

    // Structurer les résultats pour les rendre lisibles pour le frontend
    const stages = result.rows.map((row) => ({
      username: row.USERNAME,
      titre: row.TITRE,
      date_acceptation: row.DATE_ACCEPTATION,
      email: row.EMAIL,
      id_stage: row.ID_STAGE,
    }));

    res.json(stages);
  } catch (error) {
    console.error('Erreur lors de la récupération des stages:', error);
    res.status(500).send('Erreur lors de la récupération des stages.');
  }
});
  
//accepter les stages possibles
router.post('/stages/:idStage/etat', async (req, res) => {
  const { idStage } = req.params;
  const { statut } = req.body;

  if (!idStage || isNaN(parseInt(idStage, 10))) {
    return res.status(400).send('ID de stage invalide.');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    await connection.execute(
      `
      UPDATE Stage 
      SET etat_validation = :statut 
      WHERE id_stage = :idStage
      `,
      { statut, idStage: parseInt(idStage, 10) }, // Correction pour types
      { autoCommit: true }
    );

    await connection.close();

    res.json({ message: `Statut mis à jour avec succès en ${statut}.` });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).send('Erreur lors de la mise à jour du statut.');
  }
});
// les stages en cours  mais qui ont besoin d etre noté
router.get('/stagesAnoter', async (req, res) => {
  const token = req.cookies.access_token;
  try {
    // Décoder le token pour récupérer l'id_entreprise
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    const id_entreprise = parseInt(decodedToken.entrepriseIdg, 10);

    if (isNaN(id_entreprise)) {
      return res.status(400).send('ID de l’entreprise invalide.');
    }

    console.log('ID de l’entreprise de Anoter dans Stage  :', id_entreprise);

    const connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `
      SELECT 
  E.username, 
  O.titre, 
  C.date_acceptation, 
  E.email, 
  S.id_stage,
  S.noter,
  S.id_entreprise,
  S.remarques,
  C.STATUS,
  S.STATUS_STAGE,
  S.ETAT_VALIDATION
FROM 
  Stage S
  JOIN Etudiant E ON E.ID_ETUDIANT = S.ID_ETUDIANT
  JOIN OFFRE_STAGE O ON O.ID_STAGE = S.ID_OFFRE
  JOIN CONVOCATION C ON C.ID_STAGE = O.ID_STAGE
  WHERE S.ID_ENTREPRISE=:id_entreprise AND C.STATUS = 'Accepté' AND S.STATUS_STAGE='Accepté'
      `,
      [id_entreprise],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    await connection.close();

    // Structurer les résultats pour les rendre lisibles pour le frontend
    const stages = result.rows.map((row) => ({
      username: row.USERNAME,
      titre: row.TITRE,
      date_acceptation: row.DATE_ACCEPTATION,
      email: row.EMAIL,
      id_stage: row.ID_STAGE,
      noter:row.NOTER,
      remarques:row.REMARQUES,
    }));
console.log(stages);
    res.json(stages);
  } catch (error) {
    console.error('Erreur lors de la récupération des stages:', error);
    res.status(500).send('Erreur lors de la récupération des stages.');
  }
});
  
//noter stage et noter si il es terminer c est un champ qui peut etre rempli ou pas 
router.post('/stages/:idStage/note', async (req, res) => {
    const { idStage } = req.params;
    const { note,remarques,terminer } = req.body;
  
    try {
      const connection = await oracledb.getConnection(dbConfig);
  
      await connection.execute(
        `
        UPDATE Stage 
        SET noter = :note ,
        remarques=:remarques ,
        STATUS_STAGE=:terminer 
        WHERE id_stage = :idStage
        `,
        [note, remarques,terminer,idStage],
        { autoCommit: true }
      );
  
      await connection.close();
  
      res.json({ message: `Statut mis à jour avec succès .` });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      res.status(500).send('Erreur lors de la mise à jour du statut.');
    }
  });
module.exports = router;
