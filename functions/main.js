const {createCanvas, loadImage} = require('canvas')
const rimraf = require('rimraf')
const nanoid = require('nanoid/generate')
const {Composer, Telegram} = require('telegraf')

const {exec} = require('child_process')
const fs = require('fs')
const {promisify} = require('util')

const writeFileAsync = promisify(fs.writeFile)

const {randint, pad, wait} = require('../core/utils')
const {hrt, fmtMs, fmtPrc} = require('../functions/timings')

const bot = new Telegram(process.env.BOT_TOKEN)

const processImage = async (url, chatId) => {
  const start = hrt()

  const reqId = nanoid('abcdefbhijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 20)

  console.log(`starting for ${chatId}, id: ${reqId}`)

  const img = await loadImage(url)

  const maxDimension = 1000

  let imageWidth = img.width
  let imageHeight = img.height

  if (img.width > img.height) {
    imageWidth = maxDimension
    imageHeight = Math.round(img.height / img.width * maxDimension)
  } else {
    imageHeight = maxDimension
    imageWidth = Math.round(img.width / img.height * maxDimension)
  }
  imageHeight -= imageHeight % 2
  imageWidth -= imageWidth % 2

  const sourceCanvas = createCanvas(imageWidth, imageHeight)
  const sourceCtx = sourceCanvas.getContext('2d')

  sourceCtx.drawImage(img, 0, 0, imageWidth, imageHeight)

  const imgd = sourceCtx.getImageData(0, 0, imageWidth, imageHeight)
  const pix = imgd.data

  const resultCanvas = createCanvas(imageWidth, imageHeight)
  const resultCtx = resultCanvas.getContext('2d')

  resultCtx.fillStyle = 'white'
  resultCtx.fillRect(0, 0, imageWidth, imageHeight)

  const total = 100

  let circles = []

  const getCircleRadius = () => randint(10, 16)

  for (var i = 0; i < total; i++) {
    circles[i] = {}
    circles[i].prevPos = {x: imageWidth / 2, y: imageHeight / 2}
    circles[i].pos = {x: imageWidth / 2, y: imageHeight / 2}
    circles[i].dir = Math.random() > 0.5 ? 1 : -1
    circles[i].radius = getCircleRadius()
    circles[i].angle = Math.random() * Math.PI * 2
  }

  const fps = 60
  const length = 20

  const ticksPerFrame = 5

  const getPixel = (x, y) => {
    const baseIndex = (y * imageWidth + x) * 4

    const r = pix[baseIndex]
    const g = pix[baseIndex + 1]
    const b = pix[baseIndex + 2]

    return {r, g, b}
  }

  let writes = []

  fs.mkdirSync(`frames/${reqId}`)

  writes.push(writeFileAsync(`frames/${reqId}/${pad(0, 5)}.jpg`, resultCanvas.toBuffer('image/jpeg')))

  for (let i = 0; i < fps * length; ++i) {
    const iterStart = hrt()
    for (let j = 0; j < total; j++) {
      for (let k = 0; k < ticksPerFrame; ++k) {
        const startCircle = hrt()
        let circle = circles[j]
        circle.angle += 1 / circle.radius * circle.dir

        if (circle.pos.x < 0) {
          circle.pos.x = 0
        } else if (circle.pos.x > imageWidth) {
          circle.pos.x = imageWidth
        }

        if (circle.pos.y < 0) {
          circle.pos.y = 0
        } else if (circle.pos.y > imageHeight) {
          circle.pos.y = imageHeight
        }

        const movement = circle.radius / 2

        circle.pos.x += Math.cos(circle.angle) * movement
        circle.pos.y += Math.sin(circle.angle) * movement

        const x = Math.round(circle.pos.x)
        const y = Math.round(circle.pos.y)

        const {r, g, b} = getPixel(x, y)

        const brightness = Math.max(r, g, b)

        // quadDiff > 900

        // const prevX = Math.round(circle.prevPos.x)
        // const prevY = Math.round(circle.prevPos.y)

        // const {r: prevR, g: prevG, b: prevB} = getPixel(prevX, prevY)

        // const quadDiff = Math.abs(r - prevR)**2 + Math.abs(g - prevG)**2 + Math.abs(b - prevB)**2

        if ((Math.random() > 0.7) || circle.pos.x < 0 || circle.pos.x > imageWidth || circle.pos.y < 0 || circle.pos.y > imageHeight) {
          circle.dir *= -1
          circle.radius = getCircleRadius()
          circle.angle += Math.PI
        }

        resultCtx.lineWidth = 1.5
        resultCtx.strokeStyle = `rgb(${r}, ${g}, ${b})`
        // resultCtx.strokeStyle = `red`
        // console.log(`rgb(${r}, ${g}, ${b})`)
        //stroke(img.get(circle.pos.x, circle.pos.y))

        resultCtx.beginPath()
        resultCtx.moveTo(Math.round(circle.prevPos.x), Math.round(circle.prevPos.y))
        resultCtx.lineTo(x, y)
        resultCtx.stroke()
        resultCtx.closePath()

        resultCtx.fillStyle = 'red'
        // resultCtx.fillRect(x, y, 1, 1)

        // line(circle.prevPos.x, circle.prevPos.y, circle.pos.x, circle.pos.y)

        circle.prevPos.x = circle.pos.x
        circle.prevPos.y = circle.pos.y
        // console.log(`frame ${i} circle${j}  line of rgb(${r}, ${g}, ${b}) from ${Math.round(circle.prevPos.x)} ${Math.round(circle.prevPos.y)} to ${x} ${y} in ${fmtPrc(hrt(startCircle), 2)}ms, stroke: ${fmtPrc(strokeEnd, 2)}ms`)”1
      }
    }
    // console.log(`iter ${i} done in ${1000/fmtMs(hrt(iterStart))} iter/sec`)
    // console.log(resultCanvas.toBuffer())
    const resultBuffer = resultCanvas.toBuffer('image/jpeg')
    writes.push(writeFileAsync(`frames/${reqId}/${pad(i + 1, 5)}.jpg`, resultBuffer))
  }

  await Promise.all(writes)

  const resultBuffer = resultCanvas.toBuffer()

  const time = fmtMs(hrt(start))

  console.log(`done in ${time}ms (${time / (fps * length)} ms/iter)`)

  await bot.sendPhoto(chatId, {source: resultBuffer})
  await bot.sendMessage(chatId, 'Вот что у меня получилось. А скоро будет готово видео')

  const ffmpegStart = hrt()

  const ls = exec(`ffmpeg -y -framerate 60 -i frames/${reqId}/%05d.jpg -c:v libx264 -pix_fmt yuv420p ${reqId}.mp4`)

  // ls.stderr.on('data', (data) => {
  //   console.error(`stderr: ${data}`)
  // })

  return new Promise((resolve) => {
    ls.on('close', async (code) => {
      console.log(`ffmpeg done with code ${code} in ${fmtPrc(hrt(ffmpegStart), 0)}ms`)

      await wait(1000)

      await bot.sendAnimation(chatId, {source: fs.createReadStream(`${reqId}.mp4`)})
      await new Promise((resolve) => rimraf(`frames/${reqId}`, resolve))
      await promisify(fs.unlink)(`${reqId}.mp4`)
      resolve()
    })
  })

}

module.exports = {processImage}
