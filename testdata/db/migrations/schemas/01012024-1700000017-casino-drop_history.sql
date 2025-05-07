-- +++ UP +++
create table drop_history
(
    id         bigint unsigned auto_increment
        primary key,
    uuid       varchar(64)                         not null,
    user_id    bigint unsigned                     not null,
    amount     decimal(20, 4)                      not null,
    created_at timestamp default CURRENT_TIMESTAMP null
);
