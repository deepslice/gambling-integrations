-- +++ UP +++
-- 3. casino_rounds
create table casino_rounds
(
    id              bigint unsigned auto_increment
        primary key,
    bet_amount      decimal(20, 4)                      null,
    win_amount      decimal(20, 4)                      null,
    round_id        varchar(128)                        not null,
    user_id         bigint unsigned                     not null,
    aggregator      varchar(16)                         not null,
    provider        varchar(64)                         null,
    uuid            varchar(128)                        null,
    currency        varchar(8)                          not null,
    session_id      varchar(128)                        null,
    created_at      timestamp default CURRENT_TIMESTAMP not null,
    updated_at      timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    additional_info json                                null,
    status          tinyint   default 0                 not null,
    constraint round_id
        unique (round_id)
);

create index user_id
    on casino_rounds (user_id);

-- +++ DOWN +++