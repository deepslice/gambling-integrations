-- +++ UP +++
-- 2. restrictions
CREATE TABLE restrictions
(
    code        VARCHAR(32)    NOT NULL UNIQUE,
    description TEXT           NOT NULL,
    ggr         DECIMAL(20, 4) NOT NULL,
    currency    CHAR(4)        NOT NULL,
    max_ggr     DECIMAL(20, 4)
);

-- +++ DOWN +++