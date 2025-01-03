
// middleware 

const oracledb = require('oracledb');

async function associateCompetences(req, res) {
    const { id_stage, competences } = req.body; // Expect competences as an array of competence IDs
  /*
    if (!id_stage || !Array.isArray(competences) || competences.length === 0) {
      return res.status(400).json({ error: 'id_stage and a non-empty competences array are required' });
    }
  */
    let connection;
  
    try {
      connection = await oracledb.getConnection();
  
      // Check if the offer exists
      const offerCheckQuery = `SELECT id_stage FROM Offre_Stage WHERE id_stage = :id_stage`;
      const offerCheckResult = await connection.execute(offerCheckQuery, [id_stage]);
  
      if (offerCheckResult.rows.length === 0) {
        return res.status(404).json({ error: 'Offer not found' });
      }
  
      // Check if all competence IDs exist
      const competenceCheckQuery = `SELECT id_competence FROM Competence WHERE id_competence IN (${competences.map(() => '?').join(', ')})`;
      const competenceCheckResult = await connection.execute(competenceCheckQuery, competences);
  
      if (competenceCheckResult.rows.length !== competences.length) {
        return res.status(400).json({ error: 'One or more competence IDs are invalid' });
      }
  
      // Insert competences into Offre_Competence
      const insertQuery = `INSERT INTO demande (id_stage, id_competence) VALUES (:id_stage, :id_competence)`;
      const binds = competences.map((id_competence) => ({ id_stage, id_competence }));
  
      await connection.executeMany(insertQuery, binds, { autoCommit: true });
  
      res.status(201).json({ message: 'Competences successfully associated with the offer' });
    } catch (error) {
      console.error('Error associating competences:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error('Error closing the database connection:', err);
        }
      }
    }
  };
module.exports = {
    associateCompetences,
  };   