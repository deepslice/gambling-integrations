-- +++ UP +++
-- 11. agents
CREATE TABLE agents
(
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    agent_id        BIGINT UNSIGNED NOT NULL,
    username        VARCHAR(64)     NOT NULL UNIQUE,
    balance         DECIMAL(20, 4)  NOT NULL,
    cash_balance    DECIMAL(20, 4)  NOT NULL,
    active          INT              DEFAULT 1,
    deleted         TINYINT UNSIGNED DEFAULT 0,
    test            TINYINT(1)       DEFAULT 0,
    sign_in_version INT UNSIGNED     DEFAULT 0,
    password        VARCHAR(32)     NOT NULL,
    role            INT             NOT NULL,
    options         JSON,
    created_at      TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,
    aff_active      TINYINT,
    aff_transfer    DECIMAL(20, 4),
    is_affiliate    TINYINT UNSIGNED DEFAULT 0
);

-- +++ DOWN +++