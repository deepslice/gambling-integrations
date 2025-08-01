-- +++ UP +++
-- 5. casino.final_game_limits
create table casino.final_game_limits
(
    prefix        char(8)        not null,
    bet_limit     decimal(20, 4) not null,
    final_game_id int unsigned   not null,
    primary key (prefix, final_game_id)
);

-- +++ DOWN +++