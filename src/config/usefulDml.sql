/* Create a user */

SET SEARCH_PATH TO sf;

INSERT INTO users (user_id, f_name, l_name, email, password)
VALUES (1000000, 'm', 'm', 'm@m', 'm');
INSERT INTO student (user_id, student_id, course, school, placement_year, grad_year, pref_sector, other_sectors)
VALUES (1000000, 1010101010, 'm', 'm', 'm', 2025, 'm', 'm');
