-- +++ UP +++
-- 2. casino.restrictions
create table casino.restrictions
(
    code        varchar(32)    not null,
    description text           not null,
    ggr         decimal(20, 4) not null,
    currency    char(4)        not null,
    max_ggr     decimal(20, 4) null,
    constraint code
        unique (code)
);

-- +++ DOWN +++