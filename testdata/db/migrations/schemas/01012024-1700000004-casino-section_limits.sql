-- +++ UP +++
create table section_limits
(
    prefix       char(8)                                         not null,
    bet_limit    decimal(20, 4)                                  not null,
    site_section enum ('casino', 'virtual-sport', 'live-casino') null,
    constraint prefix
        unique (prefix, site_section)
);
