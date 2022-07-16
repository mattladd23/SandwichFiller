CREATE SCHEMA sf;
SET SEARCH_PATH TO sf;

-- BASE TABLES ==

-- STAFF TABLE (strong entity) --

CREATE TABLE staff (
    user_id BIGINT NOT NULL,
    f_name VARCHAR(20) NOT NULL,
    l_name VARCHAR(20) NOT NULL,
    email VARCHAR(40) NOT NULL,
    password VARCHAR NOT NULL,
    
    CONSTRAINT user_pk PRIMARY KEY (user_id)
);

-- STUDENT TABLE (strong entity) --

CREATE TABLE student (
    user_id BIGINT NOT NULL,
    f_name VARCHAR(20) NOT NULL,
    l_name VARCHAR(20) NOT NULL,
    email VARCHAR(40) NOT NULL,
    password VARCHAR NOT NULL,
    student_id BIGINT NOT NULL,
    course VARCHAR (50) NOT NULL,
    school VARCHAR NOT NULL,
    placement_year VARCHAR(40) NOT NULL, 
    grad_year INTEGER NOT NULL
        CHECK (grad_year >= '2023'),
    pref_sector VARCHAR NOT NULL,
    other_sectors VARCHAR(100) NOT NULL,

    CONSTRAINT student_pk PRIMARY KEY (user_id)      
);

-- USERS TABLE (weak entity based on staff and student entities)

CREATE TABLE users (
    user_id BIGINT NOT NULL,
    email VARCHAR(40) NOT NULL,
    password VARCHAR NOT NULL,    
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT users_pk PRIMARY KEY (user_id)
    -- CONSTRAINT users_fk1 FOREIGN KEY (user_id) REFERENCES staff
    --     ON UPDATE CASCADE ON DELETE CASCADE,
    -- CONSTRAINT users_fk2 FOREIGN KEY (user_id) REFERENCES student
    --     ON UPDATE CASCADE ON DELETE CASCADE
);

-- APPLICATION TABLE (weak entity based on creation by a student) --

CREATE TABLE application (    
    user_id BIGINT NOT NULL,
    app_id BIGINT NOT NULL,
    role VARCHAR NOT NULL,
    organisation VARCHAR NOT NULL,
    city VARCHAR,
    country VARCHAR,
    app_date VARCHAR,
    deadline DATE,
    description VARCHAR(140),
    app_status VARCHAR NOT NULL,
    last_updated TIMESTAMP WITHOUT TIME ZONE NOT NULL,

    CONSTRAINT application_pk PRIMARY KEY (app_id),
    CONSTRAINT application_fk FOREIGN KEY (user_id) REFERENCES student
        ON UPDATE CASCADE ON DELETE CASCADE 
);

/* Add a column to a table */

ALTER TABLE users
ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE;

/* Drop a column from a table */
ALTER TABLE student
DROP COLUMN is_verified;

/* Change the datatype of a column */
ALTER TABLE application
ALTER COLUMN app_date
TYPE VARCHAR;


