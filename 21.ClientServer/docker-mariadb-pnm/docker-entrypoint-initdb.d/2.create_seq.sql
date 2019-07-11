use AGENT_DB;

-- DROP TABLE master_seq;
CREATE TABLE master_seq
(
     id decimal(22,0) not null, 
     seq_name varchar(50) not null,
     min_id decimal(22,0)  default 0,
     max_id decimal(22,0)  default -1
);


-- DROP FUNCTION IF EXISTS nextval;  

DELIMITER //

CREATE FUNCTION nextval (p_seq_name VARCHAR(45))
RETURNS INT READS SQL DATA
BEGIN
    DECLARE result_id INT;

    UPDATE master_seq 
    SET id = 
        CASE WHEN max_id < 0 
        THEN LAST_INSERT_ID(id+1) 
        ELSE ( 
            CASE WHEN LAST_INSERT_ID(id+1) > max_id 
            THEN LAST_INSERT_ID(min_id) 
            ELSE LAST_INSERT_ID(id+1) 
            END 
        ) 
        END
      WHERE seq_name = p_seq_name;

    SET result_id = (SELECT LAST_INSERT_ID());

    RETURN result_id;
END //
DELIMITER ;

-- DROP FUNCTION IF EXISTS currval;  

DELIMITER //

CREATE FUNCTION currval (p_seq_name VARCHAR(45))
RETURNS INT READS SQL DATA
BEGIN
    DECLARE RESULT_ID INT;

    SELECT ID INTO RESULT_ID FROM master_seq WHERE seq_name = p_seq_name;
    RETURN RESULT_ID;

END //
DELIMITER ;


INSERT INTO master_seq (id,seq_name,min_id,max_id) VALUES (0 ,'SEQ_SEND_SMS' ,0,99999999);
INSERT INTO master_seq (id,seq_name,min_id,max_id) VALUES (0 ,'SEQ_SEND_LMS' ,0,99999999);
INSERT INTO master_seq (id,seq_name,min_id,max_id) VALUES (0 ,'SEQ_SEND_MMS' ,0,99999999);

SELECT nextval('SEQ_SEND_SMS');
SELECT currval('SEQ_SEND_SMS');



----------------------------------------------------------------
-- Oracle
-- DROP SEQUENCE ACL_SEQ;
-- DROP SEQUENCE BOARD_SEQ;
-- DROP SEQUENCE NODE_SEQ;
-- DROP SEQUENCE SEQID;
-- DROP SEQUENCE WORK_HISTORY_SEQ;

-- CREATE SEQUENCE ACL_SEQ INCREMENT BY 1 START WITH 332 NOCYCLE;
-- CREATE SEQUENCE BOARD_SEQ INCREMENT BY 1 START WITH 394 NOCYCLE;
-- CREATE SEQUENCE NODE_SEQ INCREMENT BY 1 START WITH 82 NOCYCLE;
-- CREATE SEQUENCE SEQID INCREMENT BY 1 START WITH 1 CYCLE;
-- CREATE SEQUENCE WORK_HISTORY_SEQ INCREMENT BY 1 START WITH 1 CYCLE;
