const express = require('express');
const router = express.Router();
const dbConfig = require('../database/dbConfig');
const oracledb = require('oracledb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Assurez-vous d'avoir jwt installé
require('dotenv').config({path:'../authentification/.env'});

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

//     Route pour lister toutes les entreprises inscrites
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

//   Route pour créer un gestionnaire pour une école
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
//    Avoir les données des eleves de l ecole 
router.get('/api/studentss', async (req, res) => {
    try {
        const token = req.cookies.access_token;
        if (!token) {
            return res.status(401).json({ error: 'Accès non autorisé. Veuillez vous connecter.' });
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
        if (!decodedToken || !decodedToken.ecoleid) {
            return res.status(400).json({ error: 'Jeton invalide ou ID d’école manquant.' });
        }

        const id_ecole = decodedToken.ecoleid;
        const connection = await oracledb.getConnection(dbConfig);

        const query = `
            SELECT ID_ETUDIANT, FILIERE, USERNAME, EMAIL, TELEPHONE, DATE_NES, AGE, ANNEE, A_STAGE
            FROM ETUDIANT
            WHERE ID_ECOLE = :id_ecole
        `;

        const result = await connection.execute(query, [id_ecole]); // Paramètre lié pour éviter les injections SQL

        const students = result.rows.map((row) => ({
            id: row[0],
            filiere: row[1],
            username: row[2],
            email: row[3],
            telephone: row[4],
            dateNaissance: row[5],
            age: row[6],
            annee: row[7],
            hasInternship: row[8],
        }));

        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des étudiants.' });
    } finally {
        try {
            console.log("bien");
        } catch (closeError) {
            console.error('Erreur lors de la fermeture de la connexion à la base de données:', closeError);
        }
    }
});
//   Modifier les donnees etudiant 
router.put('/api/studentss/:id', async (req, res) => {
    try {
        const token = req.cookies.access_token;
        if (!token) {
            return res.status(401).json({ error: 'Accès non autorisé. Veuillez vous connecter.' });
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
        if (!decodedToken || !decodedToken.ecoleid) {
            return res.status(400).json({ error: 'Jeton invalide ou ID d’école manquant.' });
        }

        const id_ecole = decodedToken.ecoleid; // Récupère l'ID de l'école depuis le jeton
        const id_etudiant = req.params.id; // Récupère l'ID de l'étudiant depuis les paramètres de la route
        const {
            filiere,
            username,
            email,
            telephone,
            dateNaissance,
            age,
            annee,
            hasInternship
        } = req.body; // Données envoyées dans la requête

        const connection = await oracledb.getConnection(dbConfig);

        const query = `
            UPDATE ETUDIANT
            SET FILIERE = :filiere,
                USERNAME = :username,
                EMAIL = :email,
                TELEPHONE = :telephone,
                DATE_NES = :dateNaissance,
                AGE = :age,
                ANNEE = :annee,
                A_STAGE = :hasInternship
            WHERE ID_ETUDIANT = :id_etudiant AND ID_ECOLE = :id_ecole
        `;

        const result = await connection.execute(query, {
            filiere ,
            username,
            email,
            telephone,
            dateNaissance,
            age,
            annee,
            hasInternship,
            id_etudiant,
            id_ecole
        }, { autoCommit: true });


        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Aucun étudiant trouvé ou aucune modification effectuée.' });
        }

        res.json({ message: 'Les données de l’étudiant ont été mises à jour avec succès.' });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour des données de l’étudiant.' });
    }
});
//   Modifier la filiere des etudiants 
router.put('/change_filiere/:id', async (req, res) => {
    try {
        const token = req.cookies.access_token;
        if (!token) {
            return res.status(401).json({ error: 'Accès non autorisé. Veuillez vous connecter.' });
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
        if (!decodedToken || !decodedToken.ecoleid) {
            return res.status(400).json({ error: 'Jeton invalide ou ID d’école manquant.' });
        }

        const id_ecole = decodedToken.ecoleid; // ID de l'école depuis le token
        const id_etudiant = req.params.id; // ID de l'étudiant depuis les paramètres de la route
        const { filiere } = req.body; // Nouvelle filière envoyée dans le body

        if (!filiere) {
            return res.status(400).json({ error: 'La filière est obligatoire.' });
        }

        const connection = await oracledb.getConnection(dbConfig);

        const query = `
            UPDATE ETUDIANT
            SET FILIERE = :filiere
            WHERE ID_ETUDIANT = :id_etudiant AND ID_ECOLE = :id_ecole
        `;

        const result = await connection.execute(query, {
            filiere,
            id_etudiant,
            id_ecole
        }, { autoCommit: true });

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Aucun étudiant trouvé ou aucune modification effectuée.' });
        }

        res.json({ message: 'La filière de l’étudiant a été mise à jour avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la filière :', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de la filière.' });
    }
});
//suprimmer un etudiant 
router.delete('/delete_etudiant/:id', async (req, res) => {
        try {
            const token = req.cookies.access_token;
            if (!token) {
                return res.status(401).json({ error: 'Accès non autorisé. Veuillez vous connecter.' });
            }
    
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
            if (!decodedToken || !decodedToken.ecoleid) {
                return res.status(400).json({ error: 'Jeton invalide ou ID d’école manquant.' });
            }
    
            const id_ecole = decodedToken.ecoleid; // ID de l'école depuis le token
            const id_etudiant = req.params.id; // ID de l'étudiant depuis les paramètres de la route
    
            const connection = await oracledb.getConnection(dbConfig);
    
            const query = `
                DELETE FROM ETUDIANT
                WHERE ID_ETUDIANT = :id_etudiant AND ID_ECOLE = :id_ecole
            `;
    
            const result = await connection.execute(query, {
                id_etudiant,
                id_ecole
            }, { autoCommit: true });
    
            if (result.rowsAffected === 0) {
                return res.status(404).json({ error: 'Aucun étudiant trouvé ou suppression impossible.' });
            }
    
            res.json({ message: 'L’étudiant a été supprimé avec succès.' });
        } catch (error) {
            console.error('Erreur lors de la suppression de l’étudiant :', error);
            res.status(500).json({ error: 'Erreur lors de la suppression de l’étudiant.' });
        }
});
//  Afficher les entreprises que les etudiants ont un stage avec avec le nombre d eleve 
// Route pour afficher les entreprises avec le nombre d'étudiants ayant un stage dans chaque entreprise
router.get('/entt', async (req, res) => {
    try {
        const token = req.cookies.access_token;
        if (!token) {
            return res.status(401).json({ error: 'Accès non autorisé. Veuillez vous connecter.' });
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
        if (!decodedToken || !decodedToken.ecoleid) {
            return res.status(400).json({ error: 'Jeton invalide ou ID d’école manquant.' });
        }

        const id_ecole = decodedToken.ecoleid; // ID de l'école depuis le token
        const connection = await oracledb.getConnection(dbConfig);

        const query = `
            SELECT E.NOM AS entreprise, COUNT(E.NOM) AS nombre_etudiants
            FROM Stage S 
            JOIN ENTREPRISE E ON S.ID_ENTREPRISE = E.ID_ENTREPRISE 
            JOIN ETUDIANT En ON En.ID_ETUDIANT = S.ID_ETUDIANT
            WHERE En.ID_ECOLE = :id_ecole  AND TRIM(S.STATUS_STAGE) ='Accepté'     
            GROUP BY E.NOM
        `;

        const result = await connection.execute(query, { id_ecole });

        const data = result.rows.map(row => ({
            entreprise: row[0],
            nombre_etudiants: row[1]
        }));

        res.json(data);
    } catch (error) {
        console.error('Erreur lors de la récupération des données des entreprises :', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des données.' });
    }
});
// Route pour afficher les étudiants sans stage
router.get('/students/no-internship', async (req, res) => {
    try {
        const token = req.cookies.access_token;
        if (!token) {
            return res.status(401).json({ error: 'Accès non autorisé. Veuillez vous connecter.' });
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
        if (!decodedToken || !decodedToken.ecoleid) {
            return res.status(400).json({ error: 'Jeton invalide ou ID d’école manquant.' });
        }

        const id_ecole = decodedToken.ecoleid; // ID de l'école depuis le token
        const connection = await oracledb.getConnection(dbConfig);

        const query = `
            SELECT USERNAME, FILIERE 
            FROM ETUDIANT 
            WHERE TRIM(A_STAGE) = 'sans stage' 
            AND ID_ECOLE = :id_ecole
        `;

        const result = await connection.execute(query, { id_ecole });

        const data = result.rows.map(row => ({
            username: row[0],
            filiere: row[1]
        }));

        res.json(data);
    } catch (error) {
        console.error('Erreur lors de la récupération des données des étudiants :', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des données.' });
    }
});

// Route pour les statistiques des stages
router.get('/stats/stages', async (req, res) => {
    try {
        const token = req.cookies.access_token;
        if (!token) {
            return res.status(401).json({ error: 'Accès non autorisé. Veuillez vous connecter.' });
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
        if (!decodedToken || !decodedToken.ecoleid) {
            return res.status(400).json({ error: 'Jeton invalide ou ID d’école manquant.' });
        }

        const id_ecole = decodedToken.ecoleid; // ID de l'école depuis le token
        const connection = await oracledb.getConnection(dbConfig);

        const query = `
            SELECT 
                (SELECT COUNT(*) FROM Etudiant WHERE ID_ECOLE = :id_ecole) AS total_etudiants,
                (SELECT COUNT(*) FROM Etudiant WHERE TRIM(A_STAGE) = 'sans stage' AND ID_ECOLE = :id_ecole) AS etudiants_sans_stage,
                (SELECT COUNT(*) FROM Etudiant WHERE TRIM(A_STAGE) <> 'sans stage' AND ID_ECOLE = :id_ecole) AS etudiants_avec_stage,
                (SELECT COUNT(*) FROM Etudiant WHERE TRIM(A_STAGE) <> 'sans stage' AND ID_ECOLE = :id_ecole) * 100.0 / (SELECT COUNT(*) FROM Etudiant WHERE ID_ECOLE = :id_ecole) AS taux_obtention_stage
            FROM dual
        `;

        const result = await connection.execute(query, { id_ecole });

        const stats = {
            total_etudiants: result.rows[0][0],
            etudiants_sans_stage: result.rows[0][1],
            etudiants_avec_stage: result.rows[0][2],
            taux_obtention_stage: result.rows[0][3]
        };

        res.json(stats);
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques :', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des statistiques.' });
    }
});

module.exports = router;
