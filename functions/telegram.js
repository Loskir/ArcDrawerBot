const {
  pluralizeIndex,
} = require('../core/utils')

const Results = require('../models/results')

const checkPendingByThisUser = async (ctx, next) => {
  const pendingByThisUser = await Results.countDocuments({user_id: ctx.from.id, status: 0})

  if (pendingByThisUser >= 10) {
    return ctx.reply('Подожди немного, в очереди слишком много твоих заявок')
  }

  return next()
}

module.exports = {
  checkPendingByThisUser,
}
