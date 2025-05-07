-- +++ UP +++
-- 14. balance_history
CREATE TABLE balance_history
(
    id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT UNSIGNED  NOT NULL,
    type       TINYINT UNSIGNED NOT NULL,
    amount     DECIMAL(20, 4)   NOT NULL,
    balance    JSON             NOT NULL,
    info       JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX user_id ON balance_history (user_id);

-- +++ DOWN +++