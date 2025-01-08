const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const dbConfig = require('../database/dbConfig');
const { associateCompetences } = require('./competence');
require('dotenv').config({path:'../authentification/.env'});
const jwt = require('jsonwebtoken'); // Assurez-vous d'avoir jwt installé

// Get all offers
router.get('/api/offers', async (req, res) => {
    try {
      const connection = await oracledb.getConnection(dbConfig);
  
      const query = `
        SELECT id_stage, titre, description, competence1, competence2, competence3, competence4, competence5, 
               competence6, competence7, competence8, competence9, competence10
        FROM offre_stage
      `;
  
      const result = await connection.execute(query);
      await connection.close();
  
      const offers = result.rows.map((row) => ({
        id: row[0],
        titre: row[1],
        description: row[2],
        competences: row.slice(3).filter((competence) => competence !== null), // Filter null competences
      }));
  
      res.json(offers);
    } catch (error) {
      console.error('Error fetching offers:', error);
      res.status(500).json({ error: 'Failed to fetch offers' });
    }
  });
//  details de l offre 
  router.get('/api/offersdetails', async (req, res) => {
    try {
      const offerId = parseInt(req.query.id, 10);
  
      if (isNaN(offerId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }
     
      const connection = await oracledb.getConnection(dbConfig);
  
      const query = `
        SELECT 
          id_stage, 
          Mode_Stage, 
          Type_stage, 
          duree, 
          competence1, 
          competence2, 
          competence3, 
          competence4, 
          competence5, 
          competence6
        FROM offre_stage
        WHERE id_stage = :id
      `;
  
      const result = await connection.execute(query, [offerId]);
      await connection.close();
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Offer not found' });
      }
  
      const row = result.rows[0];
      const offerDetails = {
        id: row[0],
        modeStage: row[1],
        typeStage: row[2],
        duree: row[3],
        competences: row.slice(4).filter((competence) => competence !== null),
      };
  
      res.json(offerDetails);
    } catch (error) {
      console.error('Error fetching offer details:', error);
      res.status(500).json({ error: 'Failed to fetch offer details' });
    }
  });
// Déposer une offre (POST)
/*
router.post('/add', async (req, res) => {
    const {  titre, description , status_offre,durée,Type_stage,Mode_Stage } = req.body;
    try {
        const connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `INSERT INTO Offre_Stage ( titre, description,status_offre,durée,Type_stage,Mode_Stage ) 
             VALUES ( :titre, :description,:status_offre,:durée, :Type_stage,:Mode_Stage)`,
            {  titre, description, status_offre,durée,Type_stage,Mode_Stage },
            { autoCommit: true }
        );
        await connection.close();
        res.status(201).json({ message: 'Offer added successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add offer.' });
    }
});
*/
/*
router.post('/add', async (req, res) => {
    const { titre, description, status_offre, duree, type_stage, mode_stage, competences } = req.body;

    // Validate competencies array
    if (!Array.isArray(competences) || competences.length !== 10) {
        return res.status(400).json({ error: 'Invalid competencies format' });
    }

    // SQL Query with named bind variables
    const query = `
        INSERT INTO offre_stage (
            id_gest_entreprise,id_entreprise ,titre, description, status_offre, duree, type_stage, mode_stage, 
            competence1, competence2, competence3, competence4, competence5, 
            competence6, competence7, competence8, competence9, competence10
        ) VALUES (
            :id_gest_entreprise,:id_entreprise ,:titre, :description, :status_offre, :duree, :type_stage, :mode_stage,
            :competence1, :competence2, :competence3, :competence4, :competence5, 
            :competence6, :competence7, :competence8, :competence9, :competence10
        )
    `;
// id_gest_entreprise // id_entreprise ,
    // Named values object
    const values = {
      id_gest_entreprise,
      id_entreprise ,
        titre,
        description,
        status_offre,
        duree,
        type_stage,
        mode_stage,
        competence1: competences[0] || null,
        competence2: competences[1] || null,
        competence3: competences[2] || null,
        competence4: competences[3] || null,
        competence5: competences[4] || null,
        competence6: competences[5] || null,
        competence7: competences[6] || null,
        competence8: competences[7] || null,
        competence9: competences[8] || null,
        competence10: competences[9] || null,
    };

    try {
        const connection = await oracledb.getConnection(dbConfig);
        await connection.execute(query, values, { autoCommit: true });
        await connection.close();

        res.status(201).json({ message: 'Offre ajoutée avec succès!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'offre' });
    }
});
 */
router.post("/add", async (req, res) => {
  const {
    id_gest_entreprise,
    id_entreprise,
    titre,
    description,
    status_offre,
    duree,
    type_stage,
    mode_stage,
    competences,
  } = req.body;

  // Validation des compétences
  if (!Array.isArray(competences) || competences.length !== 10) {
    return res.status(400).json({ error: "Format des compétences invalide" });
  }

  const query = `
    INSERT INTO offre_stage (
      id_gest_entreprise, id_entreprise, titre, description, status_offre, duree, type_stage, mode_stage, 
      competence1, competence2, competence3, competence4, competence5, 
      competence6, competence7, competence8, competence9, competence10
    ) VALUES (
      :id_gest_entreprise, :id_entreprise, :titre, :description, :status_offre, :duree, :type_stage, :mode_stage,
      :competence1, :competence2, :competence3, :competence4, :competence5, 
      :competence6, :competence7, :competence8, :competence9, :competence10
    )
  `;

  const values = {
    id_gest_entreprise,
    id_entreprise,
    titre,
    description,
    status_offre,
    duree,
    type_stage,
    mode_stage,
    competence1: competences[0] || null,
    competence2: competences[1] || null,
    competence3: competences[2] || null,
    competence4: competences[3] || null,
    competence5: competences[4] || null,
    competence6: competences[5] || null,
    competence7: competences[6] || null,
    competence8: competences[7] || null,
    competence9: competences[8] || null,
    competence10: competences[9] || null,
  };

  try {
    const connection = await oracledb.getConnection(dbConfig);
    await connection.execute(query, values, { autoCommit: true });
    await connection.close();

    res.status(201).json({ message: "Offre ajoutée avec succès!" });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur lors de l'ajout de l'offre" });
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
// Get offers associated with a specific company
router.get('/api/offers/company/:entrepriseId', async (req, res) => {
  const token = req.cookies.access_token;
  if (!token) {
    return res.status(401).json({ error: 'Accès non autorisé. Veuillez vous connecter.' });
  }

  // Décoder le token pour récupérer l'ID de l'entreprise
  const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
  const entrepriseId = decodedToken.entrepriseIdg;
  


  try {
      const connection = await oracledb.getConnection(dbConfig);

      const query = `
          SELECT id_stage, titre, description, competence1, competence2, competence3, competence4, competence5, 
                 competence6, competence7, competence8, competence9, competence10
          FROM offre_stage
          WHERE id_entreprise = :entrepriseId
      `;

      const result = await connection.execute(query, [entrepriseId]);
      await connection.close();

      const offers = result.rows.map((row) => ({
          id: row[0],
          titre: row[1],
          description: row[2],
          competences: row.slice(3).filter((competence) => competence !== null), // Filter null competences
      }));

      res.json(offers);
  } catch (error) {
      console.error('Error fetching offers:', error);
      res.status(500).json({ error: 'Failed to fetch offers' });
  }
});


module.exports = router;
 