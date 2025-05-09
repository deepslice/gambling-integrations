-- +++ UP +++
-- 17. wagering_transactions
CREATE TABLE wagering_transactions
(
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    wagering_id    BIGINT UNSIGNED                            NOT NULL,
    user_id        BIGINT UNSIGNED                            NOT NULL,
    amount         DECIMAL(20, 4)                             NOT NULL,
    balance_before DECIMAL(20, 4)                             NOT NULL,
    balance_after  DECIMAL(20, 4)                             NOT NULL,
    reference      VARCHAR(128)                               NOT NULL,
    status         TINYINT UNSIGNED DEFAULT 0                 NOT NULL,
    created_at     TIMESTAMP        DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at     TIMESTAMP        DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (wagering_id) REFERENCES wagering_balance (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX reference ON wagering_transactions (reference);

-- +++ DOWN +++