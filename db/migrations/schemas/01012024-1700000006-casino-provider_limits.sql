-- +++ UP +++
-- 7. provider_limits
CREATE TABLE provider_limits
(
    prefix    CHAR(8)        NOT NULL,
    bet_limit DECIMAL(20, 4) NOT NULL,
    provider  VARCHAR(64)    NOT NULL,
    UNIQUE (prefix, provider)
);

-- +++ DOWN +++