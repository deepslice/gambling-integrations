-- +++ UP +++
-- 18. drop_history
CREATE TABLE drop_history
(
    id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid       VARCHAR(64)     NOT NULL,
    user_id    BIGINT UNSIGNED NOT NULL,
    amount     DECIMAL(20, 4)  NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- +++ DOWN +++