-- +++ UP +++
-- 1. casino.aspect_configs
create table casino.aspect_configs
(
    prefix  char(8) not null
        primary key,
    configs json    not null
);

-- +++ DOWN +++