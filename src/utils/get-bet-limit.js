export async function getBetLimit(pool, prefix, game, rate) {
  const [[betLimit]] = await pool.query(`
      select bet_limit / ? as amount
      from casino.game_limits
      where prefix = ?
        and uuid = ?
      union all
      select bet_limit / ? as amount
      from casino.provider_limits
      where prefix = ?
        and provider = ?
      union all
      select bet_limit / ? as amount
      from casino.section_limits
      where prefix = ?
        and site_section = ?
  `, [
    rate, prefix, game.uuid,
    rate, prefix, game.provider,
    rate, prefix, game.section,
  ])

  if (betLimit) {
    return betLimit.amount
  }

  return null
}
