-- +++ UP +++
create table casino_transactions
(
    id                 bigint unsigned auto_increment
        primary key,
    amount             decimal(20, 4)                                  null,
    transaction_id     varchar(128)                                    not null,
    player_id          bigint unsigned                                 not null,
    action             enum ('BET', 'WIN', 'REFUND', 'ROLLBACK')       not null,
    aggregator         varchar(16)                                     not null,
    provider           varchar(64)                                     null,
    game_id            varchar(128)                                    null,
    currency           varchar(8)                                      null,
    session_id         varchar(128)                                    null,
    bet_transaction_id varchar(128)                                    null,
    round_id           varchar(128)                                    null,
    section            enum ('casino', 'virtual-sport', 'live-casino') null,
    change_balance     int       default 1                             null,
    jackpot_info       text                                            null,
    inserted_at        timestamp default CURRENT_TIMESTAMP             not null,
    updated_at         timestamp default CURRENT_TIMESTAMP             not null on update CURRENT_TIMESTAMP,
    is_freespin        int                                             null,
    freespin_id        varchar(128)                                    null,
    fee                int                                             null comment 'in case of fee',
    additional_info    text                                            null comment 'in case of force major',
    for_gamingBoard    int                                             null,
    constraint casino_transactions_ibfk_1
        foreign key (player_id) references users (id),
    constraint casino_transactions_ibfk_2
        foreign key (game_id) references casino.games (uuid)
);

create index game_id
    on casino_transactions (game_id);

create index inserted_at
    on casino_transactions (inserted_at);

create index player_id
    on casino_transactions (player_id);

create index transaction_id
    on casino_transactions (transaction_id);
