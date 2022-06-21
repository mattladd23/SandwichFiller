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


-- Insert a row in employer when a student creates an application

CREATE OR REPLACE FUNCTION student_employer_insert()

    RETURNS TRIGGER AS

$$

BEGIN

    INSERT INTO employer (organisation)
        VALUES (NEW.organisation);

RETURN NEW;

END;

$$

LANGUAGE 'plpgsql';


CREATE TRIGGER student_employer_insert

    AFTER INSERT

    ON application

    FOR EACH ROW

    EXECUTE PROCEDURE student_employer_insert();

