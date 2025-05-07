-- +++ UP +++
create table aspect_configs
(
    prefix  char(8) not null
        primary key,
    configs json    not null
);
