-- +++ UP +++
-- 4. limits
CREATE TABLE limits
(
    project_id INT UNSIGNED                NOT NULL PRIMARY KEY,
    bet_limit  FLOAT(20, 4) DEFAULT 0.0000 NOT NULL,
    CONSTRAINT limits_ibfk_1 FOREIGN KEY (project_id) REFERENCES settings (id)
);

-- +++ DOWN +++