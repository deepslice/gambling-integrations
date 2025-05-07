-- +++ UP +++
create table balance_history
(
    id         bigint unsigned auto_increment
        primary key,
    user_id    bigint unsigned                     not null,
    type       tinyint unsigned                    not null,
    amount     decimal(20, 4)                      not null,
    balance    json                                not null,
    info       json                                null,
    created_at timestamp default CURRENT_TIMESTAMP null,
    constraint balance_history_ibfk_1
        foreign key (user_id) references users (id)
);

create index user_id
    on balance_history (user_id);
