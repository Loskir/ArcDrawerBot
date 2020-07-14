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

const getReplyTextByQueueLength = (queueLength) => {
  if (queueLength === 0) {
    return `Отлично, я начал рисовать твою картинку, подожди минутку`
  }

  const word = ['картинка', 'картинки', 'картинок'][pluralizeIndex(queueLength)]

  return `Отлично, я положил твою картинку в очередь. Перед тобой ${queueLength} ${word}, подожди немного. Используй команду /queue, чтобы следить за длиной очереди`
}

module.exports = {
  checkPendingByThisUser,
  getReplyTextByQueueLength,
}
