-- +++ UP +++
create table limits
(
    project_id int unsigned                not null
        primary key,
    bet_limit  float(20, 4) default 0.0000 not null,
    constraint limits_ibfk_1
        foreign key (project_id) references global.settings (id)
);
