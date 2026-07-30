-- 1.Employee and Manager Names: Display a list of employee names along with their manager's names. Use the 'employees' table provided.

-- 2.Every Possible Combination: Show every possible combination of 'customer_name' from the 'customers' table and 'product_name' from the 'products' table.

Select e1.employee_name AS Employee,e2.employee_name AS manager
FROM employees e1
LEFT JOIN employees e2 ON e1.manager_id=e2.employee_id;

Select c.customer_name,p.product_name
FROM customers c 
CROSS JOIN products p;
