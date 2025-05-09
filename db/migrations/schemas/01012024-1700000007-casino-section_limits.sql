-- +++ UP +++
-- 8. section_limits
CREATE TABLE section_limits
(
    prefix       CHAR(8)        NOT NULL,
    bet_limit    DECIMAL(20, 4) NOT NULL,
    site_section ENUM ('casino', 'virtual-sport', 'live-casino'),
    UNIQUE (prefix, site_section)
);

-- +++ DOWN +++