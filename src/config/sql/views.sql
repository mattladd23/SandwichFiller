-- Create view for accepted applications per employer
CREATE VIEW acc_apps_per_emp AS
SELECT application.organisation,
count(application.organisation) AS accepted_apps
FROM sf.application
WHERE application.app_status::text = 'Accepted'::text
GROUP BY application.organisation
ORDER BY (count(application.organisation));


-- Create view for accepted applications
CREATE VIEW accepted_apps AS
SELECT student.f_name,
student.l_name,
student.user_id,
application.app_id,
application.app_status
FROM sf.student
LEFT JOIN sf.application ON student.user_id = application.user_id
WHERE application.app_status::text = 'Accepted'::text;


-- Create view for all submitted applications
CREATE VIEW all_submitted_apps AS
SELECT student.user_id,
student.f_name,
student.l_name,
student.student_id,
application.app_id,
application.app_status
FROM sf.student
JOIN sf.application ON student.user_id = application.user_id
WHERE application.app_status::text = ANY (ARRAY['Applied'::character varying, 'Online tests'::character varying, 'Assessment centre'::character varying, 'Interview'::character varying, 'Accepted'::character varying, 'Rejected'::character varying]::text[]);


-- Create view of students ordered by number of applications submitted
CREATE VIEW apps_submitted_ordered AS 
SELECT student.user_id,
student.f_name,
student.l_name,
student.student_id,
count(all_submitted_apps.app_id) AS num_apps
FROM sf.student
JOIN sf.all_submitted_apps ON student.user_id = all_submitted_apps.user_id
GROUP BY student.user_id
ORDER BY (count(all_submitted_apps.app_id)) DESC;


-- Create view of employers ordered by number of applications received
CREATE VIEW apps_per_emp AS
SELECT application.organisation,
count(application.organisation) AS total_apps
FROM sf.application
WHERE application.app_status::text = 'Applied'::text OR application.app_status::text = 'Online tests'::text OR application.app_status::text = 'Assessment centre'::text OR application.app_status::text = 'Interview'::text OR application.app_status::text = 'Accepted'::text OR application.app_status::text = 'Rejected'::text
GROUP BY application.organisation
ORDER BY (count(application.organisation));