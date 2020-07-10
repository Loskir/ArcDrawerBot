const mongoose = require('mongoose')
require('dotenv').config()

const Results = require('./models/results')

const {processImage} = require('./functions/main')
const {wait} = require('./core/utils')

void (async () => {
  await mongoose.connect(process.env.MONGO_URL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })

  console.log('connected')

  while (true) {
    const result = await Results.findOneAndUpdate({status: 0}, {$inc: {status: 1}})

    if (!result) {
      await wait(1000)
      continue
    }

    await processImage(result.url, result.user_id)

    await Results.updateOne({_id: result._id}, {$set: {status: 2}})
  }
})()

