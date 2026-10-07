--Implement a Row-Level BEFORE UPDATE Trigger on the Salary_Hike table that restricts a salary 
--increase to no more than 15% of the :OLD.salary value; if the increase exceeds this limit, 
--the trigger must raise a custom User-Defined Exception  with a specific message

CREATE TABLE Salary_Hike (
    emp_id   INT PRIMARY KEY,
    emp_name VARCHAR(50),
    salary   NUMERIC(10,2)
);

INSERT INTO Salary_Hike VALUES
(1, 'Amit', 30000),
(2, 'Ravi', 40000),
(3, 'Neha', 50000);

CREATE OR REPLACE FUNCTION check_salary_hike()
RETURNS TRIGGER
AS $$
BEGIN
    IF NEW.salary > OLD.salary * 1.15 THEN
        RAISE EXCEPTION 'Salary increase not allowed: new salary % exceeds 15%% of old salary % (max allowed: %)',
            NEW.salary, OLD.salary, OLD.salary * 1.15
            USING ERRCODE = 'U0001';  
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_salary_hike_limit ON Salary_Hike;

CREATE TRIGGER trg_salary_hike_limit
BEFORE UPDATE
ON Salary_Hike
FOR EACH ROW
EXECUTE FUNCTION check_salary_hike();

UPDATE Salary_Hike SET salary = 33000 WHERE emp_id = 1;

UPDATE Salary_Hike SET salary = 46000 WHERE emp_id = 2;

UPDATE Salary_Hike SET salary = 60000 WHERE emp_id = 3;

SELECT * FROM Salary_Hike;
