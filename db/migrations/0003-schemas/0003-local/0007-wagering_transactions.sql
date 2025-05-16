-- +++ UP +++
-- 7. wagering_transactions
create table wagering_transactions
(
    id             bigint unsigned auto_increment
        primary key,
    wagering_id    bigint unsigned                            not null,
    user_id        bigint unsigned                            not null,
    amount         decimal(20, 4)                             not null,
    balance_before decimal(20, 4)                             not null,
    balance_after  decimal(20, 4)                             not null,
    reference      varchar(128)                               not null,
    status         tinyint unsigned default '0'               not null,
    created_at     timestamp        default CURRENT_TIMESTAMP not null,
    updated_at     timestamp        default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
);

create index reference
    on wagering_transactions (reference);

-- +++ DOWN +++