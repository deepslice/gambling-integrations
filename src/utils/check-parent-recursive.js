export async function checkParentRecursive(parentId, trx) {
  while (parentId) {
    const [[parent]] = await trx.query(`
        select id       as id
             , agent_id as parentId
             , active   as active
             , deleted  as deleted
        from agents
        where id = ?
    `, [parentId])

    if (!parent) {
      throw new Error('Parent not exist')
    }

    if (!parent.active || parent.deleted) {
      return false
    }

    parentId = parent.parentId
  }

  return true
}
