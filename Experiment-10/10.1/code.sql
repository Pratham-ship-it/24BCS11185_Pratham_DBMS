--cost of dishes greater than average food cost

select f_name, f_cost, f_type
from food
where f_cost > 
(select avg(f_cost) from food)

--second highest salary

select EmpName, Salary 
from Employee
where salary < (
  select max(Salary) from Employee
)
order by Salary DESC limit 1;

--third highest salary

select EmpName, Salary 
from Employee
where salary < (
  select max(Salary) from Employee
  where salary < (
  select max(Salary) from Employee
  )
)
order by Salary DESC limit 1;
