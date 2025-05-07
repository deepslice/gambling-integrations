-- +++ UP +++
-- 6. final_game_limits
CREATE TABLE final_game_limits
(
    prefix        CHAR(8)        NOT NULL,
    bet_limit     DECIMAL(20, 4) NOT NULL,
    final_game_id INT UNSIGNED   NOT NULL,
    PRIMARY KEY (prefix, final_game_id),
    FOREIGN KEY (final_game_id) REFERENCES games (id)
);

-- +++ DOWN +++