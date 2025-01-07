--modification table candidature / etudiant 
ALTER TABLE Candidature
ADD statut VARCHAR2(20) DEFAULT 'EN_ATTENTE';
ALTER TABLE Candidature ADD CONSTRAINT unique_candidature UNIQUE (id_etudiant, id_stage);
ALTER TABLE Candidature DROP CONSTRAINT unique_candidature;
ALTER TABLE Etudiant 
ADD email VARCHAR(50)
ADD CONSTRAINT unique_email UNIQUE (email);
--table stage  
CREATE TABLE Stage (
    id_stage INT PRIMARY KEY,
    id_candidature INT UNIQUE,
    date_debut DATE,
    date_fin DATE,
    etat_validation VARCHAR2(20) DEFAULT 'Non validé',
    rapport_stage VARCHAR2(300),
    FOREIGN KEY (id_candidature) REFERENCES Candidature(id_candidature)
);
CREATE SEQUENCE Stage_seq START WITH 1;
CREATE OR REPLACE TRIGGER Stage_trg
BEFORE INSERT ON Stage
FOR EACH ROW
BEGIN
    SELECT Stage_seq.NEXTVAL INTO :NEW.id_stage FROM dual;
END;
/
--table convocation 
drop table convocation ;
CREATE TABLE Convocation (
    id_convocation INT PRIMARY KEY,
    id_stage INT UNIQUE,
    id_etudiant INT UNIQUE,
    date_envoi DATE,
    date_acceptation DATE, 
    status VARCHAR2(20) DEFAULT 'Non acceptée',
    FOREIGN KEY (id_stage) REFERENCES Offre_Stage(id_stage),
    FOREIGN KEY (id_etudiant) REFERENCES Etudiant(id_etudiant)
);
ALTER TABLE CONVOCATION DROP COLUMN ID_ETUDIANT;
ALTER TABLE CONVOCATION DROP COLUMN ID_STAGE;
ALTER TABLE CONVOCATION ADD ID_ETUDIANT INT ;
ALTER TABLE CONVOCATION ADD ID_STAGE INT;

DELETE FROM Convocation;
CREATE SEQUENCE Convocation_seq START WITH 1;
CREATE OR REPLACE TRIGGER Convocation_trg
BEFORE INSERT ON Convocation
FOR EACH ROW
BEGIN
    SELECT Convocation_seq.NEXTVAL INTO :NEW.id_convocation FROM dual;
END;
/
SELECT * FROM CONVOCATION;
--lie le tuteur dirrectement a l entreprise 
ALTER TABLE Tuteur ADD id_entreprise INT;
ALTER TABLE Tuteur ADD FOREIGN KEY (id_entreprise) REFERENCES Entreprise(id_entreprise);
-- modif etudiant / ecole / entreprise 
ALTER TABLE Etudiant ADD experiences varchar(800) ;
ALTER TABLE Etudiant ADD competences varchar(800) ;
ALTER TABLE Etudiant ADD languages varchar(400) ;
ALTER TABLE Etudiant ADD formation varchar(800) ;
ALTER TABLE Etudiant ADD email VARCHAR(50)
ALTER TABLE Etudiant ADD telephone varchar(800) ;
ALTER TABLE Etudiant ADD formation varchar(800) ;
ALTER TABLE Etudiant ADD date_nes DATE ;
ALTER TABLE Etudiant DROP COLUMN password  ;
ALTER TABLE Etudiant ADD password VARCHAR(80) ;
ALTER TABLE Etudiant ADD id_ecole INT ;
ALTER TABLE Etudiant ADD FOREIGN KEY (id_ecole) REFERENCES Ecole(id_ecole);


COMMIT;
ALTER TABLE Ecole DROP COLUMN mdp_ecole;
ALTER TABLE Ecole ADD mdp_ecole VARCHAR(100);

ALTER TABLE Ecole ADD nom_connexion VARCHAR(20);
ALTER TABLE Ecole ADD adresse VARCHAR(20);
ALTER TABLE Ecole ADD nombre_eleve INT;
ALTER TABLE Ecole ADD nom_connexion VARCHAR(20);
ALTER TABLE Entreprise DROP COLUMN mdp_entreprise;
ALTER TABLE Entreprise ADD mdp_entreprise VARCHAR(100);
ALTER TABLE Entreprise ADD nom_connexion VARCHAR(20);
ALTER TABLE Entreprise ADD type_entreprise VARCHAR(50);
ALTER TABLE Entreprise ADD secteur_activite VARCHAR(70);
ALTER TABLE Entreprise ADD date_creation DATE;


--modif stage 
ALTER TABLE Stage ADD status_stage varchar(30) DEFAULT 'en attente de validation eleve';
ALTER TABLE Stage DROP COLUMN status_stage;

ALTER TABLE Stage DROP COLUMN ID_CANDIDATURE;
ALTER TABLE Stage ADD id_entreprise INT ;
ALTER TABLE Stage ADD FOREIGN KEY (id_entreprise) REFERENCES Entreprise(id_entreprise);
ALTER TABLE Stage ADD ID_ETUDIANT INT ;
ALTER TABLE Stage ADD FOREIGN KEY (ID_ETUDIANT) REFERENCES ETUDIANT(ID_ETUDIANT);
ALTER TABLE Stage ADD id_offre INT ;
ALTER TABLE Stage ADD FOREIGN KEY (id_offre) REFERENCES Offre_Stage(id_stage);
ALTER TABLE Stage ADD noter INT ;
ALTER TABLE Stage ADD remarques varchar(200) ;


SELECT *FROM STAGE;
SELECT * FROM CANDIDATURE;
COMMIT;
--modif offre_stage 
ALTER TABLE Offre_Stage ADD status_offre varchar(20) DEFAULT 'disponible ';
ALTER TABLE Offre_Stage ADD duree varchar(70) ; 
ALTER TABLE Offre_Stage ADD Type_stage varchar(50) ; 
ALTER TABLE Offre_Stage ADD Mode_Stage  varchar(40) ; 
ALTER TABLE Offre_Stage ADD competence1 varchar(70) ; 
ALTER TABLE Offre_Stage ADD competence2 varchar(70) ; 
ALTER TABLE Offre_Stage ADD competence3 varchar(70) ;
ALTER TABLE Offre_Stage ADD competence4 varchar(70) ; 
ALTER TABLE Offre_Stage ADD competence5 varchar(70) ; 
ALTER TABLE Offre_Stage ADD competence6 varchar(70) ;
ALTER TABLE Offre_Stage ADD competence7 varchar(70) ;
ALTER TABLE Offre_Stage ADD competence8 varchar(70) ;
ALTER TABLE Offre_Stage ADD competence9 varchar(70) ;
ALTER TABLE Offre_Stage ADD competence10 varchar(70) ;
COMMIT;
SELECT * FROM  CONVOCATION ;
SELECT * FROM STAGE;
ALTER TABLE Offre_Stage ADD id_entreprise INT;
ALTER TABLE Offre_Stage ADD FOREIGN KEY (id_entreprise) REFERENCES Entreprise(id_entreprise);


-- responsable de stage 
ALTER TABLE Responsable_Stage DROP COLUMN mdp_respo_stage;
ALTER TABLE Responsable_Stage ADD mdp_respo_stage VARCHAR(100);
--gestionaire_ecole

ALTER TABLE Gestionnaire_Ecole DROP COLUMN mdp_gest_ecole;
ALTER TABLE Gestionnaire_Ecole ADD mdp_gest_ecole VARCHAR(100);
SELECT DATE_ACCEPTATION ,titre , description ,DATE_ENVOI FROM CONVOCATION C,OFFRE_STAGE O
JOIN OFFRE_STAGE O ON C.ID_STAGE=O.ID_STAGE;
SELECT C.DATE_ACCEPTATION, O.TITRE, O.DESCRIPTION, C.DATE_ENVOI ,C.ID_CONVOCATION
       FROM CONVOCATION C
       JOIN OFFRE_STAGE O ON C.ID_STAGE = O.ID_STAGE
       WHERE C.ID_ETUDIANT = 4;
-----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_get_ids_on_status_update
AFTER UPDATE OF status ON Convocation
FOR EACH ROW
WHEN (NEW.status = 'Accepté')
DECLARE
    v_id_etudiant INT;        -- Variable pour stocker l'id_etudiant
    v_id_offre INT;           -- Variable pour stocker l'id_offre (ou id_stage dans votre logique)
    v_id_entreprise INT;      -- Variable pour stocker l'id_entreprise
BEGIN
    -- Récupérer les informations de la ligne mise à jour
    v_id_etudiant := :NEW.id_etudiant;   -- ID étudiant de la ligne mise à jour
    v_id_offre := :NEW.id_stage;         -- ID de l'offre (vous utilisez id_stage comme id_offre)

    -- Récupérer l'id_entreprise associé à l'id_offre dans la table Offre_Stage
    SELECT id_entreprise
    INTO v_id_entreprise
    FROM Offre_Stage
    WHERE id_stage = v_id_offre;

    -- Insérer les données dans la table Stage
    INSERT INTO Stage (
        id_stage,
        id_offre,
        id_etudiant,
        id_entreprise,
        etat_validation
    )
    VALUES (
        Stage_seq.NEXTVAL,    -- Générer un nouvel id_stage via la séquence
        v_id_offre,           -- ID de l'offre
        v_id_etudiant,        -- ID de l'étudiant
        v_id_entreprise,      -- ID de l'entreprise récupéré
        'Non validé'          -- État par défaut
    );

    -- Afficher les informations dans la console pour débogage
    DBMS_OUTPUT.PUT_LINE('ID Étudiant: ' || v_id_etudiant);
    DBMS_OUTPUT.PUT_LINE('ID Offre: ' || v_id_offre);
    DBMS_OUTPUT.PUT_LINE('ID Entreprise: ' || v_id_entreprise);
END;
/

SET SERVEROUTPUT ON;
-- ID ETUDIANT 4 ET ID ENTREPRISE 8
SELECT E.username,O.titre,C.date_acceptation,E.email, S.id_entreprise,S.ID_STAGE FROM Stage  S 
JOIN Etudiant E ON E.ID_ETUDIANT=S.ID_ETUDIANT
JOIN OFFRE_STAGE O ON O.ID_STAGE=S.ID_OFFRE
JOIN CONVOCATION C ON C.ID_STAGE=O.ID_STAGE
WHERE S.ID_ENTREPRISE=8 AND C.STATUS='Accepté';
-------
UPDATE Stage SET STATUS_STAGE='acceptée' WHERE Stage.ID_STAGE=:id_stage;--obtenue de la route qui les display
SELECT S.ID_STAGE,S.ID_ENTREPRISE,E.USERNAME,S.ID_OFFRE,En.NOM,O.TITRE,O.DESCRIPTION,En.adresse FROM STAGE S
JOIN ETUDIANT E ON S.ID_ETUDIANT=E.ID_ETUDIANT
JOIN ENTREPRISE En ON En.ID_ENTREPRISE=S.ID_ENTREPRISE
JOIN OFFRE_STAGE O ON O.ID_STAGE=S.ID_OFFRE
WHERE S.ID_ETUDIANT=4;--:studentId;
--stage a noter par le gestionaire 
 SELECT 
        E.username, 
        O.titre, 
        C.date_acceptation, 
        E.email, 
        S.id_stage,
        S.noter,
        S.remarques
      FROM 
        Stage S
        JOIN Etudiant E ON E.ID_ETUDIANT = S.ID_ETUDIANT
        JOIN OFFRE_STAGE O ON O.ID_STAGE = S.ID_OFFRE
        JOIN CONVOCATION C ON C.ID_STAGE = O.ID_STAGE
      WHERE 
        S.ID_ENTREPRISE = 8
        AND C.STATUS = 'Accepté' AND S.ETAT_VALIDATION='validé' AND S.STATUS_STAGE='Accepté';
        ------------------
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
  WHERE S.ID_ENTREPRISE=8 AND C.STATUS = 'Accepté' AND S.STATUS_STAGE='Accepté' --AND S.ETAT_VALIDATION='validé'
  -----------
WHERE 
  S.ID_ENTREPRISE = 8
  AND C.STATUS = 'Accepté' AND S.ETAT_VALIDATION='validé' AND S.STATUS_STAGE='Accepté';
