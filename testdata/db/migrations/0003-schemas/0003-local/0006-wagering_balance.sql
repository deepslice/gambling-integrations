-- +++ UP +++
-- 6. wagering_balance
create table wagering_balance
(
    id              bigint unsigned auto_increment
        primary key,
    user_id         bigint unsigned                        not null,
    balance         decimal(20, 4)                         not null,
    initial_balance decimal(20, 4)                         not null,
    rollovers       decimal(12, 2)                         not null,
    free_spin       tinyint      default 0                 not null,
    type            int unsigned                           not null,
    template_id     int unsigned                           null,
    params          json                                   null,
    status          int unsigned default '0'               not null,
    priority        int unsigned                           null,
    created_at      timestamp    default CURRENT_TIMESTAMP not null,
    expires_at      timestamp                              null,
    updated_at      timestamp    default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    wagered         decimal(20, 4)                         null,
    destination     decimal(20, 4)                         null,
    payout          decimal(20, 4)                         null
);

create index user_id
    on wagering_balance (user_id);

-- +++ DOWN +++