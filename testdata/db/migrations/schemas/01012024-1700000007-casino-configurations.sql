-- +++ UP +++
create table configurations
(
    prefix char(8)     not null,
    code   varchar(32) not null,
    value  text        not null,
    constraint prefix
        unique (prefix, code)
);
