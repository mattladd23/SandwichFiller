SET SEARCH_PATH TO sf;

-- STAFF -------------------------------------------------------

CREATE OR REPLACE FUNCTION staff_user_insert()

    RETURNS trigger AS

$$

BEGIN

    INSERT INTO users (user_id, email, password)
        VALUES (NEW.user_id, NEW.email, NEW.password);

RETURN NEW;

END;

$$

LANGUAGE 'plpgsql';


CREATE TRIGGER staff_user_insert

    AFTER INSERT

    ON staff

    FOR EACH ROW

    EXECUTE PROCEDURE staff_user_insert();




-- STUDENT ----------------------------------------------

-- Insert a row into user table to make student user eligible for login auth

CREATE OR REPLACE FUNCTION student_user_insert()

    RETURNS trigger AS

$$

BEGIN

    INSERT INTO users (user_id, email, password)
        VALUES (NEW.user_id, NEW.email, NEW.password);

RETURN NEW;

END;

$$

LANGUAGE 'plpgsql';


CREATE TRIGGER student_user_insert

    AFTER INSERT

    ON student

    FOR EACH ROW

    EXECUTE PROCEDURE student_user_insert();

