-- +++ UP +++
-- 12. users
CREATE TABLE users
(
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uid             BIGINT UNSIGNED,
    segment         TINYINT UNSIGNED DEFAULT 0,
    username        VARCHAR(64)                     NOT NULL UNIQUE,
    password        VARCHAR(32)                     NOT NULL,
    email           VARCHAR(256) UNIQUE,
    phone           VARCHAR(16) UNIQUE,
    birth           DATE,
    balance         DECIMAL(20, 4)                  NOT NULL,
    real_balance    DECIMAL(20, 4),
    plus_bonus      DECIMAL(20, 4)   DEFAULT 0.0000 NOT NULL,
    bonus           DECIMAL(20, 4)   DEFAULT 0.0000 NOT NULL,
    currency        CHAR(5),
    active          INT              DEFAULT 1,
    verified        TINYINT          DEFAULT 0,
    deleted         TINYINT UNSIGNED DEFAULT 0,
    test            TINYINT(1)       DEFAULT 0,
    agent_id        BIGINT UNSIGNED,
    sign_in_version INT UNSIGNED     DEFAULT 0,
    created_at      TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,
    options         JSON,
    FOREIGN KEY (agent_id) REFERENCES agents (id)
);

CREATE INDEX agent_id ON users (agent_id);

-- +++ DOWN +++