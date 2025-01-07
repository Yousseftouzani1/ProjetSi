const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../database/dbConfig');
const jwt = require('jsonwebtoken'); // Assurez-vous d'avoir jwt installé
require('dotenv').config({path:'../authentification/.env'});

// Fonction pour exécuter une requête Oracle
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
// avoir l email de l eleve associer a la candidature 
router.get('/getmail/:id',async(req,res)=>{
  const idCandidature = req.params.id;
  const query = `
    SELECT email 
        FROM Etudiant 
        WHERE ID_ETUDIANT IN (
            SELECT ID_ETUDIANT 
            FROM CANDIDATURE 
            WHERE ID_CANDIDATURE = :id
        );
`;
try {
  await executeQuery(query, { id: idCandidature });
  res.status(200).send('Candidature acceptée.');
} catch (err) {
  res.status(500).send('Erreur lors de l\'acceptation de la candidature.');
}
});
// Refuser une candidature
router.post('/refuser/:id', async (req, res) => {
  const idCandidature = req.params.id;
  const query = `
    UPDATE Candidature
    SET statut = 'refusée'
    WHERE id_candidature = :id
  `;
  try {
    await executeQuery(query, { id: idCandidature });
    res.status(200).send('Candidature refusée.');
  } catch (err) {
    res.status(500).send('Erreur lors du refus de la candidature.');
  }
});
 // montrer tt les candidatures associe a l entreprise  
 router.get('/candidatures', async (req, res) => {
  // Récupérer le token depuis les cookies
  const token = req.cookies.access_token;

  if (!token) {
      return res.status(401).json({ error: 'Accès non autorisé. Veuillez vous connecter.' });
  }

  try {
      // Décoder le token pour récupérer l'id_entreprise
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
      const id_entreprise = decodedToken.entrepriseIdg;
      console.log('ID de l’entreprise via la route /candidature :', id_entreprise);
      if (!id_entreprise) {
          return res.status(400).json({ error: 'ID de l\'entreprise non valide.' });
      }

      let connection;
      try {
          connection = await oracledb.getConnection(dbConfig);

          // Exécuter la requête
          const result = await connection.execute(
              `SELECT 
                  C.ID_CANDIDATURE,
                  C.DATE_SOUMISSION,
                  E.USERNAME,
                  E.EMAIL,
                  E.FORMATION,
                  E.LANGUAGES,
                  E.COMPETENCES,
                  E.EXPERIENCES,
                  E.DATE_NES,
                  EC.NOM AS NOM_ECOLE,
                  O.TITRE AS TITRE_OFFRE,
                  O.ID_ENTREPRISE
               FROM 
                  ETUDIANT E
                JOIN CANDIDATURE C ON C.ID_ETUDIANT = E.ID_ETUDIANT
                JOIN OFFRE_STAGE O ON O.ID_STAGE = C.ID_STAGE
                JOIN ENTREPRISE EN ON O.ID_ENTREPRISE = EN.ID_ENTREPRISE
                JOIN ECOLE EC ON EC.ID_ECOLE = E.ID_ECOLE
               WHERE 
                  C.STATUT = 'EN_ATTENTE'
                  AND O.ID_ENTREPRISE = :id_entreprise`,
              { id_entreprise },
              { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );

          if (result.rows.length === 0) {
              return res.status(404).json({ message: 'Aucune candidature trouvée pour cette entreprise.' });
          }

          res.status(200).json(result.rows);
      } catch (err) {
          console.error('Erreur lors de la récupération des candidatures :', err);
          res.status(500).json({ error: 'Erreur interne du serveur.' });
      } finally {
          if (connection) await connection.close();
      }
  } catch (err) {
      console.error('Erreur lors de la vérification du token :', err);
      res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
});
//accepter candidatures 
/*
router.post('/candidatures/accept', async (req, res) => {
  const { idCandidature, dateEntretien } = req.body; // Date d'entretien envoyée depuis le frontend

  if (!idCandidature || !dateEntretien) {
      return res.status(400).json({ error: "L'ID de candidature et la date d'entretien sont requis." });
  }

  let connection;
  try {
    const token = req.cookies.access_token;
    if (!token) {
      return res.status(401).json({ error: 'Accès non autorisé. Veuillez vous connecter.' });
  }
    // Décoder le token pour récupérer l'id_entreprise
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    const id_entreprise = decodedToken.entrepriseIdg;
    console.log('ID de l’entreprise :', id_entreprise);
      connection = await oracledb.getConnection({
        dbConfig
      });

      // Mise à jour du statut de la candidature
      const result = await connection.execute(
          `UPDATE CANDIDATURE 
           SET STATUT = 'ACCEPTE'
           WHERE ID_CANDIDATURE = :idCandidature `,
          [idCandidature, id_entreprise],
          { autoCommit: true }
      );

      if (result.rowsAffected === 0) {
          return res.status(404).json({ error: 'Candidature introuvable ou non associée à votre entreprise.' });
      }

      // Insertion de la date d'entretien
      await connection.execute(
          `INSERT INTO ENTRETIEN (ID_CANDIDATURE, DATE_ENTRETIEN)
           VALUES (:idCandidature, TO_DATE(:dateEntretien, 'YYYY-MM-DD'))`,
          [idCandidature, dateEntretien],
          { autoCommit: true }
      );

      res.json({ success: true, message: 'Candidature acceptée avec succès.' });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur interne du serveur.' });
  } finally {
      if (connection) {
          try {
              await connection.close();
          } catch (err) {
              console.error(err);
          }
      }
  }
});
*/
/*
//accepter 
router.post('/candidatures/accept', async (req, res) => {
  const { idCandidature, dateEntretien } = req.body; // Date d'entretien envoyée depuis le frontend

  if (!idCandidature || !dateEntretien) {
    return res.status(400).json({ error: "L'ID de candidature et la date d'entretien sont requis." });
  }

  let connection;
  try {
    const token = req.cookies.access_token;
    if (!token) {
      return res.status(401).json({ error: 'Accès non autorisé. Veuillez vous connecter.' });
    }

    // Décoder le token pour récupérer l'ID de l'entreprise
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    const id_entreprise = decodedToken.entrepriseId;
    console.log('ID de l’entreprise :', id_entreprise);

    // Connexion à Oracle DB
    connection = await oracledb.getConnection(dbConfig);

    // Récupérer les données associées à la candidature
    const candidatureResult = await connection.execute(
      `SELECT ID_ETUDIANT, ID_STAGE 
       FROM CANDIDATURE 
       WHERE ID_CANDIDATURE = :idCandidature`,
      [idCandidature]
    );

    if (candidatureResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidature introuvable.' });
    }

    const { ID_ETUDIANT, ID_STAGE } = candidatureResult.rows[0];

    // Étape 1 : Mise à jour du statut de la candidature
    const updateCandidature = await connection.execute(
      `UPDATE CANDIDATURE 
       SET STATUT = 'ACCEPTE' 
       WHERE ID_CANDIDATURE = :idCandidature`,
      [idCandidature],
      { autoCommit: false }
    );

    if (updateCandidature.rowsAffected === 0) {
      return res.status(404).json({ error: 'Impossible de mettre à jour la candidature.' });
    }

    // Étape 2 : Insérer dans Convocation
    const insertConvocation = await connection.execute(
      `INSERT INTO CONVOCATION (
      ID_CONVOCATION,
          ID_STAGE,
          ID_ETUDIANT,
          DATE_ENVOI,
          DATE_ACCEPTATION,
          STATUS
       ) VALUES (
        Convocation_seq.NEXTVAL,
          :idStage,
          :idEtudiant,
          SYSDATE,
          SYSDATE,
          'Acceptée'
       )`,
      [ID_STAGE, ID_ETUDIANT],
      { autoCommit: false }
    );

    // Valider toutes les transactions
    await connection.commit();

    res.json({
      success: true,
      message: 'Candidature acceptée avec succès et convocation générée.',
    });
  } catch (err) {
    console.error(err);
    if (connection) await connection.rollback(); // Annuler les changements en cas d'erreur
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});
*/
//accepter fct 
router.post('/candidatures/accept', async (req, res) => {
  const { idCandidature, dateEntretien } = req.body;

  if (!idCandidature || !dateEntretien) {
    return res.status(400).json({ error: 'idCandidature and dateEntretien are required' });
  }

  let connection;

  try {
    // Se connecter à la base de données Oracle
    connection = await oracledb.getConnection(dbConfig);

    // Définir la requête pour accepter la candidature
    const query = `
      DECLARE
          v_idEtudiant    CANDIDATURE.ID_ETUDIANT%TYPE;
          v_idStage       CANDIDATURE.ID_STAGE%TYPE;
      BEGIN
          -- Mettre à jour la candidature avec le statut 'ACCEPTE'
          UPDATE CANDIDATURE
          SET STATUT = 'ACCEPTE'
          WHERE ID_CANDIDATURE = :idCandidature;

          -- Extraire les informations ID_ETUDIANT et ID_STAGE à partir de CANDIDATURE
          SELECT ID_ETUDIANT, ID_STAGE
          INTO v_idEtudiant, v_idStage
          FROM CANDIDATURE
          WHERE ID_CANDIDATURE = :idCandidature;

          -- Insérer dans la table CONVOCATION avec les informations extraites
          INSERT INTO CONVOCATION (
              ID_CONVOCATION,
              ID_STAGE,
              ID_ETUDIANT,
              DATE_ENVOI,
              DATE_ACCEPTATION,
              STATUS
          ) VALUES (
              Convocation_seq.NEXTVAL,  -- Génère l'ID_CONVOCATION avec la séquence
              v_idStage,                 -- Utilisation de l'ID_STAGE extrait
              v_idEtudiant,              -- Utilisation de l'ID_ETUDIANT extrait
              SYSDATE,                   -- La date d'envoi (SYSDATE)
              TO_DATE(:dateEntretien, 'YYYY-MM-DD HH24:MI:SS'),              -- La date d'entretien donnée en paramètre
              'Acceptée'                 -- Le statut
          );
      END;
    `;

    // Exécution de la requête avec les paramètres
    const result = await connection.execute(query, {
      idCandidature: idCandidature,
      dateEntretien: dateEntretien
    });

    // Committer les changements
    await connection.commit();

    // Réponse si la candidature a été acceptée avec succès
    res.status(200).json({ message: 'Candidature accepted successfully and convocations created.' });

  } catch (error) {
    console.error('Error accepting candidature:', error);
    res.status(500).json({ error: 'Failed to accept candidature and create convocations.' });
  } finally {
    if (connection) {
      try {
        // Fermeture de la connexion
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
});
//refuser 
router.post('/candidatures/decline', async (req, res) => {
  const { idCandidature } = req.body;

  if (!idCandidature) {
      return res.status(400).json({ error: "L'ID de candidature est requis." });
  }

  let connection;
  try {
      connection = await oracledb.getConnection(dbConfig);

      const result = await connection.execute(
          `UPDATE CANDIDATURE 
           SET STATUT = 'REFUSE'
           WHERE ID_CANDIDATURE = :idCandidature `,
          [idCandidature],
          { autoCommit: true }
      );

      if (result.rowsAffected === 0) {
          return res.status(404).json({ error: 'Candidature introuvable ou non associée à votre entreprise.' });
      }

      res.json({ success: true, message: 'Candidature refusée avec succès.' });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur interne du serveur.' });
  } finally {
      if (connection) {
          try {
              await connection.close();
          } catch (err) {
              console.error(err);
          }
      }
  }
});

module.exports = router;
