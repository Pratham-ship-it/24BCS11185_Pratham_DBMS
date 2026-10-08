SELECT f_name, f_cost, f_type 
FROM food f
WHERE (
    SELECT AVG(CAST(r.f_rating AS FLOAT)) 
    FROM ratings r 
    WHERE r.f_id = f.f_id
) >= 4;
