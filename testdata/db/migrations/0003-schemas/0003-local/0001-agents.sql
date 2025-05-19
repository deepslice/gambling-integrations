-- +++ UP +++
-- 1. agents
create table agents
(
    id              bigint unsigned auto_increment
        primary key,
    agent_id        bigint unsigned                            not null,
    username        varchar(64)                                not null,
    balance         decimal(20, 4)                             not null,
    cash_balance    decimal(20, 4)                             not null,
    active          int              default 1                 null,
    deleted         tinyint unsigned default '0'               null,
    test            tinyint(1)       default 0                 null,
    sign_in_version int unsigned     default '0'               null,
    password        varchar(32)                                not null,
    role            int                                        not null,
    options         json                                       null,
    created_at      timestamp        default CURRENT_TIMESTAMP null,
    aff_active      tinyint                                    null,
    aff_transfer    decimal(20, 4)                             null,
    is_affiliate    tinyint unsigned default '0'               null,
    constraint username
        unique (username)
);

-- +++ DOWN +++