-- +++ UP +++
-- 5. games
CREATE TABLE games
(
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id         INT UNSIGNED,
    name             VARCHAR(128) NOT NULL,
    show_name        VARCHAR(128),
    uuid             VARCHAR(128) UNIQUE,
    url              VARCHAR(256),
    aggregator       VARCHAR(32)  NOT NULL,
    provider_uid     VARCHAR(32),
    provider         VARCHAR(64)  NOT NULL,
    percent          DECIMAL(4, 2),
    type             VARCHAR(64)  NOT NULL,
    description      TEXT,
    additional_id    VARCHAR(64),
    technology       VARCHAR(32),
    has_freespins    INT,
    has_demo         INT,
    device_support   INT          NOT NULL                           DEFAULT 2,
    image            VARCHAR(256),
    image_bg         VARCHAR(256),
    image_svg        VARCHAR(256),
    priority         INT,
    site_section     ENUM ('casino', 'virtual-sport', 'live-casino') DEFAULT 'casino',
    marker_type      ENUM ('horizontal', 'oblique'),
    marker_text      VARCHAR(256),
    deleted          INT                                             DEFAULT 0,
    active           TINYINT(1)                                      DEFAULT 1,
    staging          TINYINT                                         DEFAULT 0 NOT NULL,
    production       INT                                             DEFAULT 0,
    frame_size       INT                                             DEFAULT 0,
    position         INT                                             DEFAULT 0,
    page_code        VARCHAR(64),
    mobile_page_code VARCHAR(64),
    system_id        VARCHAR(64),
    is_new           TINYINT(1),
    section_type     TINYINT UNSIGNED,
    final_game_id    INT UNSIGNED
);

-- +++ DOWN +++