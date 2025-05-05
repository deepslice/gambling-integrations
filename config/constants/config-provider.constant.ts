export const getProviderConfigQuery = `
    select s.id                                            as id,
        s.prefix                                           as prefix,
        s.db_name                                          as db,
        json_extract(s.configs, '$.currency')              as currency,
        json_extract(s.configs, '$.database')              as config,
        json_extract(ac.configs, '$.secretKey')            as secretKey,
        json_extract(ac.configs, '$.operatorId')           as operatorId,
        json_value(bl.value, '$' returning decimal(20, 4)) as balanceLimit,
        json_value(wl.value, '$' returning decimal(20, 4)) as winLimit
    from casino.aspect_configs ac
        inner join global.settings s on s.prefix = ac.prefix
        left join global.configurations bl on bl.code = 'balance_limit' and bl.prefix = ac.prefix
        left join global.configurations wl on wl.code = 'win_limit' and wl.prefix = ac.prefix
    where ac.prefix = ?`
