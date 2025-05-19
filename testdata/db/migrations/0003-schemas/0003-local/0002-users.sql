-- +++ UP +++
-- 2. users
create table users
(
    id              bigint unsigned auto_increment primary key,
    uid             bigint unsigned                            null,
    segment         tinyint unsigned default '0'               null,
    username        varchar(64)                                not null,
    password        varchar(32)                                not null,
    email           varchar(256)                               null,
    phone           varchar(16)                                null,
    birth           date                                       null,
    balance         decimal(20, 4)                             not null,
    real_balance    decimal(20, 4)                             null,
    plus_bonus      decimal(20, 4)   default 0.0000            not null,
    bonus           decimal(20, 4)   default 0.0000            not null,
    currency        char(5)                                    null,
    active          int              default 1                 null,
    verified        tinyint          default 0                 null,
    deleted         tinyint unsigned default '0'               null,
    test            tinyint(1)       default 0                 not null,
    agent_id        bigint unsigned                            null,
    sign_in_version int unsigned     default '0'               null,
    created_at      timestamp        default CURRENT_TIMESTAMP null,
    options         json                                       null,
    constraint email
        unique (email),
    constraint phone
        unique (phone),
    constraint username
        unique (username),
    constraint users_ibfk_1
        foreign key (agent_id) references agents (id)
);

create index agent_id
    on users (agent_id);

-- +++ DOWN +++