const {createCanvas, loadImage} = require('canvas')
const nanoid = require('nanoid/generate')
const {Telegram} = require('telegraf')

const {spawn} = require('child_process')
const fs = require('fs')
const {promisify} = require('util')

const {randint, pad, wait} = require('../core/utils')
const {hrt, fmtMs, fmtPrc} = require('../functions/timings')

const bot = new Telegram(process.env.BOT_TOKEN)

const toBufferAsync = (canvas) => new Promise(((resolve, reject) => {
  canvas.toBuffer((err, buf) => {
    if (err) {
      return reject(err)
    }
    return resolve(buf)
  }, 'image/jpeg')
}))

const processImage = async (url, chatId, asAvatar = false, bgColor = 'white') => {
  const start = hrt()

  const reqId = nanoid('abcdefbhijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 20)

  console.log(`starting for ${chatId}, id: ${reqId}`)

  let img
  try {
    img = await loadImage(url)
  } catch (e) {
    console.log(`Failed to get image for ${reqId}`)
    await bot.sendMessage(chatId, `Я не смог получить изображение по ссылке :(. Пожалуйста, попробуй ещё раз.`)
    throw new Error('FAILED_GET_IMAGE')
  }

  let imageWidth = img.width
  let imageHeight = img.height

  if (asAvatar) {
    const dimension = 800
    imageWidth = dimension
    imageHeight = dimension
  } else {
    const maxDimension = 1000

    if (img.width > img.height) {
      imageWidth = maxDimension
      imageHeight = Math.round(img.height / img.width * maxDimension)
    } else {
      imageHeight = maxDimension
      imageWidth = Math.round(img.width / img.height * maxDimension)
    }
    imageHeight -= imageHeight % 2
    imageWidth -= imageWidth % 2
  }

  const sourceCanvas = createCanvas(imageWidth, imageHeight)
  const sourceCtx = sourceCanvas.getContext('2d')

  if (asAvatar) {
    const sourceDimension = Math.min(img.width, img.height)
    const offsetLeft = (img.width - sourceDimension) / 2
    const offsetTop = (img.height - sourceDimension) / 2
    sourceCtx.drawImage(img, offsetLeft, offsetTop, sourceDimension, sourceDimension, 0, 0, imageWidth, imageHeight)
  } else {
    sourceCtx.drawImage(img, 0, 0, imageWidth, imageHeight)
  }

  const imgd = sourceCtx.getImageData(0, 0, imageWidth, imageHeight)
  const pix = imgd.data

  const resultCanvas = createCanvas(imageWidth, imageHeight)
  const resultCtx = resultCanvas.getContext('2d')

  resultCtx.fillStyle = bgColor
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
  const length = asAvatar ? 9 : 20

  const ticksPerFrame = asAvatar ? 10 : 5

  const getPixel = (x, y) => {
    const baseIndex = (y * imageWidth + x) * 4

    const r = pix[baseIndex]
    const g = pix[baseIndex + 1]
    const b = pix[baseIndex + 2]

    return {r, g, b}
  }

  const ffmpegStart = hrt()

  const ls = spawn('ffmpeg', [
    '-y',
    '-framerate', '60',
    '-i', '-',
    // '-i', `frames/${reqId}/%05d.jpg`,
    ...asAvatar ? ['-b:v', '1638K'] : [],
    '-s', `${imageWidth}x${imageHeight}`,
    // '-loglevel', 'error',
    // '-f', 'rawvideo',
    '-vcodec', 'libx264',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', asAvatar ? 'veryslow' : 'medium',
    `${reqId}.mp4`,
  ])

  ls.stdin.write(await toBufferAsync(resultCanvas))

  const avatarLastFrames = 1 // кадры в конце, когда показывается исходная картинка

  let framesNum = fps * length - 1 // один кадр — пустой экран
  if (asAvatar) {
    framesNum -= avatarLastFrames
  }

  for (let i = 0; i < framesNum; ++i) {
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
    ls.stdin.write(await toBufferAsync(resultCanvas))
  }

  if (asAvatar) {
    const sourceBuffer = await toBufferAsync(sourceCanvas)
    for (let i = 0; i < avatarLastFrames; ++i) {
      ls.stdin.write(sourceBuffer)
    }
  }

  ls.stdin.end()

  const time = fmtMs(hrt(start))

  console.log(`done in ${time}ms (${time / (fps * length)} ms/iter)`)

  toBufferAsync(resultCanvas)
    .then(async (resultBuffer) => {
      await bot.sendPhoto(chatId, {source: resultBuffer})
      await bot.sendMessage(chatId, 'Вот что у меня получилось. А скоро будет готово видео')
    })

  const code = await new Promise((r) => ls.on('close', (code) => r(code)))

  console.log(`ffmpeg done with code ${code} in ${fmtPrc(hrt(ffmpegStart), 0)}ms`)

  if (asAvatar) {
    await bot.sendVideo(chatId, {source: fs.createReadStream(`${reqId}.mp4`)})
  } else {
    await bot.sendAnimation(chatId, {source: fs.createReadStream(`${reqId}.mp4`)})
  }
  await promisify(fs.unlink)(`${reqId}.mp4`)
}

module.exports = {processImage}
