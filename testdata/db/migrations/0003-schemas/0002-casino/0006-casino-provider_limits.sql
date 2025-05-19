-- +++ UP +++
-- 6. casino.provider_limits
create table casino.provider_limits
(
    prefix    char(8)        not null,
    bet_limit decimal(20, 4) not null,
    provider  varchar(64)    not null,
    constraint prefix
        unique (prefix, provider)
);

-- +++ DOWN +++