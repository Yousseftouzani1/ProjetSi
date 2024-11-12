create table Etudiant(
    id INT,
    nom VARCHAR(100)
);
-- Insérer des données dans la table
INSERT INTO Etudiant (nom,id) VALUES ('Dupont', 80);
INSERT INTO Etudiant (nom,id) VALUES ('Dup',  24);
INSERT INTO Etudiant (nom,id) VALUES ('alan',  29);
SELECT * FROM Etudiant;