/* Create a user */

SET SEARCH_PATH TO sf;

/* Not that useful but shows inserting into two separate tables, albeit as unprepared statements */

INSERT INTO users (user_id, f_name, l_name, email, password)
VALUES (1000000, 'm', 'm', 'm@m', 'm');
INSERT INTO student (user_id, student_id, course, school, placement_year, grad_year, pref_sector, other_sectors)
VALUES (1000000, 1010101010, 'm', 'm', 'm', 2025, 'm', 'm');


/* Create a member of staff */

INSERT INTO staff (user_id, f_name, l_name, email, password)
VALUES (100006680, 'Eddie', 'Howe', 'eddie@gmail.com', 'eddie');


/* Create a student */

INSERT INTO student (user_id, f_name, l_name, email, password,
					 student_id, course, school, placement_year,
					 grad_year, pref_sector, other_sectors)
VALUES (100000000, 'Miguel', 'Almiron', 'miggy@gmail.com', 'miggy',
	   100120449, 'BA History', 'History', '2023-2024',
	   2025, 'Business', 'Football');


/* Edit an application */

UPDATE application 
SET role = 'Farmer', organisation = 'Self-employed', city = 'Somerset', 
country = 'UK', app_date = '11-11-2022', deadline = '01-01-2023', app_status = 'Applied',
description = 'Need to escape to the countryside'
WHERE app_id = 1655396214535
RETURNING *;

