-- Write a query to do the following:

-- FULL OUTER JOIN the 'student' and 'course' tables using 'Course_id' to match the tables. Output the joined table.

Select * 
From student 
FULL OUTER JOIN course 
on student.course_id=course.course_id;
