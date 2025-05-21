-- +++ UP +++
create table restaurants
(
    id                bigint unsigned auto_increment primary key,
    name              varchar(100) not null,
    cuisine_type      varchar(50)  not null,
    rating            decimal(3, 1),
    is_vegan_friendly boolean default false,
    description       text
);

-- +++ DOWN +++