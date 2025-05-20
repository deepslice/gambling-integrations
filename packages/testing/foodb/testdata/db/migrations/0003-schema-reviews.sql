-- +++ UP +++
create table reviews
(
    id            bigint unsigned auto_increment primary key,
    restaurant_id bigint unsigned,
    user_name     varchar(50) not null,
    review_text   text        not null,
    rating        integer check (rating >= 1 and rating <= 5),
    created_at    timestamp default current_timestamp
    constraint reviews_fk_1 foreign key (restaurant_id) references restaurants (id),
);

-- +++ DOWN +++