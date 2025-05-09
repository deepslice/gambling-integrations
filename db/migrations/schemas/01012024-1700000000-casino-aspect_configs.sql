-- +++ UP +++
-- 1. aspect_configs
CREATE TABLE aspect_configs
(
    prefix  CHAR(8) NOT NULL PRIMARY KEY,
    configs JSON    NOT NULL
);

-- +++ DOWN +++