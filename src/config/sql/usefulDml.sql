/* Create a user */

SET SEARCH_PATH TO sf;

/* Not that useful but shows inserting into two separate tables, albeit as unprepared statements */
/* Can only be done as unprepared statements so is not appropriate for this use case */

INSERT INTO users (user_id, f_name, l_name, email, password)
VALUES (1000000, 'm', 'm', 'm@m', 'm');
INSERT INTO student (user_id, student_id, course, school, placement_year, grad_year, pref_sector, other_sectors)
VALUES (1000000, 1010101010, 'm', 'm', 'm', 2025, 'm', 'm');


/* Create a member of staff (also unprepared, so only to be used in early stage testing) */

INSERT INTO staff (user_id, f_name, l_name, email, password)
VALUES (100006680, 'Eddie', 'Howe', 'eddie@gmail.com', 'eddie');


/* Create a student */

INSERT INTO student (user_id, f_name, l_name, email, password,
					 student_id, course, school, placement_year,
					 grad_year, pref_sector, other_sectors)
VALUES (100000000, 'Miguel', 'Almiron', 'miggy@gmail.com', 'miggy',
	   100120449, 'BA History', 'History', '2023-2024',
	   2025, 'Business', 'Football');


/* Create an application */

INSERT INTO application(user_id, app_id, role, organisation, city, country, app_date, deadline,
						description, app_status, last_updated)
VALUES (1655717043952, 1655816283228, 'Investment Intern', 'Citi Bank', 'Milan', 'Italy',
		'06/07/2022', '06/28/2022', 'Must learn italian', 'Applied', LOCALTIMESTAMP(0));


/* Edit an application */

-- UPDATE application 
-- SET role = 'Farmer', organisation = 'Self-employed', city = 'Somerset', 
-- country = 'UK', app_date = '11-11-2022', deadline = '01-01-2023', app_status = 'Applied',
-- description = 'Need to escape to the countryside'
-- WHERE app_id = 1655396214535
-- RETURNING *;

/* Data from last, not past week */

select * from application
WHERE last_updated BETWEEN
    NOW()::DATE-EXTRACT(DOW FROM NOW())::INTEGER-7 
    AND NOW()::DATE-EXTRACT(DOW from NOW())::INTEGER

/* Data from past week / 7 days */

select * from application
where last_updated > current_date - interval '7 days'

/* Data from past month */

select * from application
where last_updated > current_date - interval '7 days'


/* Draft of reporting system queries */

-- Application deadlines this week - where student is yet to have applied

select * from application
where 
deadline <= NOW() + interval '7 days'
and
app_status = 'Interested';

-- Accepted applications active this week

select * from application
where
last_updated >= NOW() - interval '7 days'
and
app_status = 'Accepted';

-- Rejected applications active this week

select * from application
where
last_updated >= NOW() - interval '7 days'
and
app_status = 'Rejected';

-- Show all students in order of applications submitted

select student.user_id, student.f_name, student.l_name, student.student_id,
count(application.app_id) AS num_apps
from student
join application
on student.user_id = application.user_id
group by student.user_id
order by num_apps DESC;

-- show all submitted applications

select *
from application
where application.app_status
in ('Applied', 'Online tests', 'Assessment centre', 'Interview', 'Accepted', 'Rejected')

-- create view for all submitted applications

create view all_submitted_apps as
select student.user_id, student.f_name, student.l_name, student.student_id,
application.app_id, application.app_status
from student
join application
on student.user_id = application.user_id
where application.app_status
in ('Applied', 'Online tests', 'Assessment centre', 'Interview', 'Accepted', 'Rejected');


-- select all students in order of apps submitted - MUST USE VIEW!!

select student.user_id, student.f_name, student.l_name, student.student_id,
count(all_submitted_apps.app_id) AS num_apps
from student
join all_submitted_apps
on student.user_id = all_submitted_apps.user_id
group by student.user_id
order by num_apps DESC;

-- Finds upper quartile of number of applications submitted

select percentile_disc(0.75)
within group
(order by apps_submitted_ordered.num_apps)
from apps_submitted_ordered


-- Finds lower quartile of number of applications submitted

select percentile_disc(0.25)
within group
(order by apps_submitted_ordered.num_apps)
from apps_submitted_ordered

-- Students with lowest number of applications submitted (lower quartile)

select * from apps_submitted_ordered
where apps_submitted_ordered.num_apps <= (
	select percentile_disc(0.25)
	within group
	(order by apps_submitted_ordered.num_apps)
	from apps_submitted_ordered
);

-- Students with highest number of applications submitted (upper quartile)

select * from apps_submitted_ordered
where apps_submitted_ordered.num_apps >= (
	select percentile_disc(0.75)
	within group
	(order by apps_submitted_ordered.num_apps)
	from apps_submitted_ordered
);

-- Orders only students with applications accepted by number of offers

select student.user_id, student.f_name, student.l_name,
count(application.app_status) as apps_accepted
from student
join application
on student.user_id = application.user_id
where application.app_status = 'Accepted'
group by student.user_id
order by apps_accepted desc;

-- Selects all students who have submitted applications

select student.user_id, student.f_name, student.l_name,
count(application.app_status) as total_apps
from student
join application
on student.user_id = application.user_id
group by student.user_id;

-- Organisations with most applications received

select application.organisation, count(application.organisation) as num_apps from application
where application.app_status = 'Applied' 
OR application.app_status = 'Online tests' 
OR application.app_status = 'Assessment centre' 
OR application.app_status = 'Interview'
OR application.app_status = 'Accepted' 
OR application.app_status = 'Rejected'
group by application.organisation
order by num_apps;


-- Organisations with most offers made

select application.organisation, count(application.organisation) as num_apps from application
where application.app_status = 'Applied'
group by application.organisation
order by num_apps;