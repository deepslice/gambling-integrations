-- +++ UP +++
-- 3. global.casino_convert_settings
create table global.casino_convert_settings
(
    prefix     char(8)     not null,
    aggregator varchar(32) not null,
    provider   varchar(64) not null,
    currency   char(5)     null
);

-- +++ DOWN +++