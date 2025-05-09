-- +++ UP +++
-- 15. casino_transactions
CREATE TABLE casino_transactions
(
    id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    amount             DECIMAL(20, 4),
    transaction_id     VARCHAR(128)                              NOT NULL,
    player_id          BIGINT UNSIGNED                           NOT NULL,
    action             ENUM ('BET', 'WIN', 'REFUND', 'ROLLBACK') NOT NULL,
    aggregator         VARCHAR(16)                               NOT NULL,
    provider           VARCHAR(64),
    game_id            VARCHAR(128),
    currency           VARCHAR(8),
    session_id         VARCHAR(128),
    bet_transaction_id VARCHAR(128),
    round_id           VARCHAR(128),
    section            ENUM ('casino', 'virtual-sport', 'live-casino'),
    change_balance     INT       DEFAULT 1,
    jackpot_info       TEXT,
    inserted_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP       NOT NULL,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP       NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    is_freespin        INT,
    freespin_id        VARCHAR(128),
    fee                INT COMMENT 'in case of fee',
    additional_info    TEXT COMMENT 'in case of force major',
    for_gamingBoard    INT,
    FOREIGN KEY (player_id) REFERENCES users (id),
    FOREIGN KEY (game_id) REFERENCES games (uuid)
);

CREATE INDEX player_id ON casino_transactions (player_id);
CREATE INDEX game_id ON casino_transactions (game_id);
CREATE INDEX inserted_at ON casino_transactions (inserted_at);
CREATE INDEX transaction_id ON casino_transactions (transaction_id);

-- +++ DOWN +++