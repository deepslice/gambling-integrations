-- +++ UP +++
-- 16. wagering_balance
CREATE TABLE wagering_balance
(
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED                        NOT NULL,
    balance         DECIMAL(20, 4)                         NOT NULL,
    initial_balance DECIMAL(20, 4)                         NOT NULL,
    rollovers       DECIMAL(12, 2)                         NOT NULL,
    free_spin       TINYINT      DEFAULT 0                 NOT NULL,
    type            INT UNSIGNED                           NOT NULL,
    template_id     INT UNSIGNED,
    params          JSON,
    status          INT UNSIGNED DEFAULT 0                 NOT NULL,
    priority        INT UNSIGNED,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at      TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    wagered         DECIMAL(20, 4),
    destination     DECIMAL(20, 4),
    payout          DECIMAL(20, 4),
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX user_id ON wagering_balance (user_id);

-- +++ DOWN +++