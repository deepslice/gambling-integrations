-- +++ UP +++
-- 9. configurations
CREATE TABLE configurations
(
    prefix CHAR(8)     NOT NULL,
    code   VARCHAR(32) NOT NULL,
    value  TEXT        NOT NULL,
    UNIQUE (prefix, code)
);

-- +++ DOWN +++