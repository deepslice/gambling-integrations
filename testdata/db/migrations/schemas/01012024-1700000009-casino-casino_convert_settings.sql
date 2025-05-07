-- +++ UP +++
-- 10. casino_convert_settings
CREATE TABLE casino_convert_settings
(
    prefix     CHAR(8)     NOT NULL,
    aggregator VARCHAR(32) NOT NULL,
    provider   VARCHAR(64) NOT NULL,
    currency   CHAR(5)
);

-- +++ DOWN +++