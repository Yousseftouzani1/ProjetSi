
-- Insérer des données dans la table
INSERT INTO Etudiant (nom,id) VALUES ('Dupont', 80);
INSERT INTO Etudiant (nom,id) VALUES ('Dup',  24);
INSERT INTO Etudiant (nom,id) VALUES ('alan',  29);
COMMIT;

create table User_table(
    id INT,
    username VARCHAR(100),
    password VARCHAR(40)
);
insert into User_table(username,password) values ('youssef','1010');
COMMIT;
SELECT COUNT(*) AS COUNT FROM User_table WHERE username = 'youssef' AND password = '1010';

