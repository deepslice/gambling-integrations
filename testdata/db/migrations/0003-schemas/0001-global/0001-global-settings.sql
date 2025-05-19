-- +++ UP +++
create table global.settings
(
    id         int unsigned auto_increment
        primary key,
    name       varchar(32)                  not null,
    project    varchar(128)                 not null,
    prefix     char(8)                      not null,
    db_name    varchar(32)                  not null,
    configs    mediumtext                   not null,
    sportsbook tinyint unsigned default '0' null,
    readonly   tinyint          default 0   not null,
    constraint db_name
        unique (db_name),
    constraint name
        unique (name),
    constraint prefix
        unique (prefix),
    constraint project
        unique (project)
);

create index prefix_2
    on global.settings (prefix);

-- +++ DOWN +++