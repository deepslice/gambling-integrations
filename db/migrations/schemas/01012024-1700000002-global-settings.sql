-- +++ UP +++
-- 3. settings
CREATE TABLE settings
(
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(32)  NOT NULL UNIQUE,
    project    VARCHAR(128) NOT NULL UNIQUE,
    prefix     CHAR(8)      NOT NULL UNIQUE,
    db_name    VARCHAR(32)  NOT NULL UNIQUE,
    configs    MEDIUMTEXT   NOT NULL,
    sportsbook TINYINT UNSIGNED DEFAULT 0,
    readonly   TINYINT          DEFAULT 0
);

CREATE INDEX prefix_2 ON settings (prefix);

-- +++ DOWN +++