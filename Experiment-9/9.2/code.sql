CREATE TABLE employee10 (
    emp_id INT PRIMARY KEY,
    emp_name VARCHAR(100),
    per_hour_salary NUMERIC(10,2),
    working_hours NUMERIC(10,2),
    payable_amount NUMERIC(10,2)
);

CREATE OR REPLACE FUNCTION cal_emp_payable_amount()
RETURNS TRIGGER
AS $$
BEGIN
    NEW.payable_amount := NEW.per_hour_salary * NEW.working_hours;

    IF NEW.payable_amount > 25000 THEN
        RAISE EXCEPTION 'Payable amount is %, which should not be greater than 25000',
            NEW.payable_amount;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS emp_payable_sal_trg ON employee10;

CREATE TRIGGER emp_payable_sal_trg
BEFORE INSERT OR UPDATE
ON employee10
FOR EACH ROW
EXECUTE FUNCTION cal_emp_payable_amount();

CREATE OR REPLACE FUNCTION msg_emp_payable_amount()
RETURNS TRIGGER
AS $$
BEGIN
    RAISE NOTICE 'Rows Updated Successfully';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS msg_emp_payable_sal_trg ON employee10;

CREATE TRIGGER msg_emp_payable_sal_trg
AFTER INSERT OR UPDATE
ON employee10
FOR EACH STATEMENT
EXECUTE FUNCTION msg_emp_payable_amount();


INSERT INTO employee10 (emp_id, emp_name, per_hour_salary, working_hours)
VALUES
(101, 'Amit', 500, 8),
(102, 'Rahul', 600, 7),
(103, 'Priya', 550, 9);

SELECT * FROM employee10;

UPDATE employee10
SET per_hour_salary = 700, working_hours = 10
WHERE emp_id = 101;

SELECT * FROM employee10;

INSERT INTO employee10 (emp_id, emp_name, per_hour_salary, working_hours)
VALUES (104, 'Neha', 1000, 30);

UPDATE employee10
SET per_hour_salary = 900, working_hours = 40
WHERE emp_id = 102;

SELECT * FROM employee10;
