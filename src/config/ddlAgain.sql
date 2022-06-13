CREATE SCHEMA sf;
SET SEARCH_PATH TO sf;

-- BASE TABLES ==

-- STAFF TABLE (strong entity) --

CREATE TABLE staff (
    user_id BIGINT NOT NULL,
    f_name VARCHAR(20) NOT NULL,
    l_name VARCHAR(20) NOT NULL,
    email VARCHAR(20) NOT NULL,
    password VARCHAR NOT NULL,
    is_authorised BOOLEAN NOT NULL DEFAULT FALSE,
    
    CONSTRAINT user_pk PRIMARY KEY (user_id)
);

-- STUDENT TABLE (strong entity) --

CREATE TABLE student (
    user_id BIGINT NOT NULL,
    f_name VARCHAR(20) NOT NULL,
    l_name VARCHAR(20) NOT NULL,
    email VARCHAR(20) NOT NULL,
    password VARCHAR NOT NULL,
    student_id BIGINT NOT NULL,
    course VARCHAR (50) NOT NULL,
    school VARCHAR NOT NULL,
    placement_year VARCHAR(40) NOT NULL, 
    grad_year INTEGER NOT NULL
        CHECK (grad_year >= '2023'),
    pref_sector VARCHAR NOT NULL,
    other_sectors VARCHAR(100) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT student_pk PRIMARY KEY (user_id)      
);

-- USERS TABLE (weak entity based on staff and student entities)

CREATE TABLE users (
    user_id BIGINT NOT NULL,
    email VARCHAR(20) NOT NULL,
    password VARCHAR NOT NULL,
    is_authorised BOOLEAN NOT NULL DEFAULT FALSE,

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
    city VARCHAR NOT NULL,
    country VARCHAR NOT NULL,
    app_date DATE NOT NULL,
    deadline VARCHAR(20) NOT NULL,
    description VARCHAR(140),
    app_status VARCHAR NOT NULL,
    last_updated TIMESTAMP WITHOUT TIME ZONE NOT NULL,

    CONSTRAINT application_pk PRIMARY KEY (app_id),
    CONSTRAINT application_fk FOREIGN KEY (user_id) REFERENCES student
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- EMPLOYER TABLE (strong entity) --

CREATE TABLE employer (
    employer_id BIGINT NOT NULL,
    employer_name VARCHAR NOT NULL,
    sector VARCHAR NOT NULL,
    img VARCHAR,

    CONSTRAINT employer_pk PRIMARY KEY (employer_id)
);