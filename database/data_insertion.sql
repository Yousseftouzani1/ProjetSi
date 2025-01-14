---chaque eleve qui a un stage dois etre note comme a stage et lorsque , son stage est terminer il est note comme il n a pas stage 
-- l eleve a stage 
CREATE OR REPLACE TRIGGER update_student_stage_status
AFTER UPDATE OF STATUS_STAGE ON STAGE
FOR EACH ROW
BEGIN
    -- Vérifier si le nouveau statut est 'Accepté'
    IF :NEW.STATUS_STAGE = 'Accepté' THEN
        -- Mettre à jour le statut de stage dans la table ETUDIANT
        UPDATE ETUDIANT
        SET A_STAGE = 'a stage ' -- ou 'a stage' selon le type de la colonne
        WHERE ID_ETUDIANT = :NEW.ID_ETUDIANT;
    END IF;
END;
/
---------------------------------modif stage date creation --------------------------------------------
ALTER TABLE stage ADD date_creation DATE DEFAULT SYSDATE;
SELECT * FROM STAGE;
-----------------------------------l eleve n as pas stage ---------------------------------------------
CREATE OR REPLACE PROCEDURE expire_old_stages IS
    CURSOR c_stages IS
        SELECT id_stage, date_creation
        FROM stage
        WHERE status_stage = 'Accepté';

    v_date_creation DATE;
    v_id_stage      stage.id_stage%TYPE;
    v_mois_diff     NUMBER;
BEGIN
    FOR rec IN c_stages LOOP
        -- Calculer la différence en mois entre la date actuelle et la date de création
        SELECT MONTHS_BETWEEN(SYSDATE, rec.date_creation)
        INTO v_mois_diff
        FROM dual;

        IF v_mois_diff >= 9 THEN
            -- Mettre à jour le statut du stage en 'expiré'
            UPDATE stage
            SET status_stage = 'expiré'
            WHERE id_stage = rec.id_stage;

            -- Optionnel : journalisation ou message pour indiquer l'action effectuée
            DBMS_OUTPUT.PUT_LINE('Le stage avec ID ' || rec.id_stage || ' a été expiré.');
        END IF;
    END LOOP;

    -- Validation des modifications
    COMMIT;
END;
/

BEGIN
    DBMS_SCHEDULER.CREATE_JOB (
        job_name        => 'expire_old_stages_job',
        job_type        => 'PLSQL_BLOCK',
        job_action      => 'BEGIN expire_old_stages; END;',
        start_date      => SYSDATE,
        repeat_interval => 'FREQ=MONTHLY; BYMONTHDAY=1; BYHOUR=0; BYMINUTE=0; BYSECOND=0',
        enabled         => TRUE
    );
END;
/

COMMIT;
------- verification si l eleve n as plus de stage :
CREATE OR REPLACE TRIGGER trg_update_etudiant_stage
AFTER UPDATE OR INSERT ON stage
FOR EACH ROW
DECLARE
    v_status_count NUMBER;
BEGIN
    -- Vérifie si tous les stages de cet étudiant sont 'expiré' ou 'Terminé'
    SELECT COUNT(*)
    INTO v_status_count
    FROM stage
    WHERE id_etudiant = :NEW.id_etudiant
      AND status_stage NOT IN ('expiré', 'Terminé');

    -- Si aucun stage n'est ni 'expiré' ni 'Terminé', mettre à jour la table etudiant
    IF v_status_count = 0 THEN
        UPDATE etudiant
        SET a_stage = 'sans stage'
        WHERE id_etudiant = :NEW.id_etudiant;
    END IF;
END;
/
