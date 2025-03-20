export async function getBetLimit(pool, prefix, game) {
  const [[betLimit]] = await pool.query(`
      select bet_limit as amount
      from casino.final_game_limits
      where prefix = ?
        and uuid = ?
      union all
      select bet_limit as amount
      from casino.provider_limits
      where prefix = ?
        and provider = ?
      union all
      select bet_limit as amount
      from casino.section_limits
      where prefix = ?
        and site_section = ?
  `, [
    prefix, game.finalGameId,
    prefix, game.provider,
    prefix, game.section,
  ])

  if (betLimit) {
    return betLimit.amount
  }

  return null
}
