-- +++ UP +++
create table dishes
(
    id            bigint unsigned auto_increment primary key,
    restaurant_id bigint unsigned,
    name          varchar(100)   not null,
    price         decimal(10, 2) not null,
    calories      integer,
    ingredients   text,
    constraint dishes_fk_1 foreign key (restaurant_id) references restaurants (id)
);

-- +++ DOWN +++