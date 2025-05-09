-- +++ UP +++
-- 13. casino_rounds
CREATE TABLE casino_rounds
(
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    bet_amount      DECIMAL(20, 4),
    win_amount      DECIMAL(20, 4),
    round_id        VARCHAR(128)                        NOT NULL UNIQUE,
    user_id         BIGINT UNSIGNED                     NOT NULL,
    aggregator      VARCHAR(16)                         NOT NULL,
    provider        VARCHAR(64),
    uuid            VARCHAR(128),
    currency        VARCHAR(8)                          NOT NULL,
    session_id      VARCHAR(128),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    additional_info JSON,
    status          TINYINT   DEFAULT 0                 NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX user_id ON casino_rounds (user_id);

-- +++ DOWN +++