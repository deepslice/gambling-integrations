-- +++ UP +++
-- 4. casino_games
create table casino_games
(
    id               int unsigned auto_increment
        primary key,
    group_id         int unsigned                                                     null,
    name             varchar(128)                                                     not null,
    show_name        varchar(128)                                                     null,
    uuid             varchar(128)                                                     null,
    url              varchar(256)                                                     null,
    aggregator       varchar(32)                                                      not null,
    provider_uid     varchar(32)                                                      null,
    provider         varchar(64)                                                      not null,
    percent          decimal(4, 2)                                                    null,
    type             varchar(64)                                                      not null,
    description      text                                                             null,
    additional_id    varchar(64)                                                      null,
    technology       varchar(32)                                                      null,
    has_freespins    int                                                              null,
    has_demo         int                                                              null,
    device_support   int                                             default 2        not null,
    image            varchar(256)                                                     null,
    image_bg         varchar(256)                                                     null,
    image_svg        varchar(256)                                                     null,
    priority         int                                                              null,
    site_section     enum ('casino', 'virtual-sport', 'live-casino') default 'casino' null,
    marker_type      enum ('horizontal', 'oblique')                                   null,
    marker_text      varchar(256)                                                     null,
    deleted          int                                             default 0        null,
    active           tinyint(1)                                      default 1        null,
    staging          tinyint                                         default 0        not null,
    production       int                                             default 0        null,
    frame_size       int                                             default 0        null,
    position         int                                             default 0        null,
    page_code        varchar(64)                                                      null,
    mobile_page_code varchar(64)                                                      null,
    system_id        varchar(64)                                                      null,
    is_new           tinyint(1)                                                       null,
    section_type     tinyint unsigned                                                 null,
    final_game_id    int unsigned                                                     null,
    constraint uuid
        unique (uuid)
);

-- +++ DOWN +++
