// const common = require('./common.js')
const member = require('./member.js')
const fs = require('fs')
const moment = require('moment')
const winston = require('winston')
const { logConfiguration } = require('./winston-config.js')

const {
  getMemEntDict,
  getPicture,
  getPrevUrl,
  getFirstBlog,
  downloadImage,
  getResponseData,
  getSelectedText,
  createDir,
  getDirectories,
  difference
} = require('./common.js')

const argv = process.argv
const baseUrl = 'https://www.hinatazaka46.com'
const dateFormat = 'YYYY.MM.DD HH:mm'

async function main (memberName) {
  const logName = `${moment().format('YYYY-MM-DD-HH:mm:ss')}.log`
  createDir('./logs')
  const logger = winston.createLogger(logConfiguration(logName))
  logger.info('tooth!')
  let historyBlog = {}
  const memEntDict = await getMemEntDict(baseUrl)
  if (fs.existsSync('./history.json')) {
    historyBlog = JSON.parse(fs.readFileSync('./history.json', 'utf-8'))
    let newMems = difference(Object.keys(historyBlog), Object.keys(memEntDict))
    let graduatedMems = difference(
      Object.keys(memEntDict),
      Object.keys(historyBlog)
    )
    if (newMems.length !== 0) {
      for (const newMem of newMems) {
        historyBlog[newMem] = `${baseUrl}${await getFirstBlog(
          memEntDict[newMem]
        )}`
        logger.info(`添加${newMem}`)
      }
    }
    if (graduatedMems.length !== 0) {
      for (const graduatedMem of graduatedMems) {
        delete historyBlog[graduatedMem]
        logger.info(`${graduatedMem}毕业`)
      }
    }
    if (newMems.length !== 0 || graduatedMems.length !== 0) {
      fs.writeFileSync('./history.json', JSON.stringify(historyBlog), 'utf-8')
    }
  } else {
    for (const [memName, memEntry] of Object.entries(memEntDict)) {
      historyBlog[memName] = `${baseUrl}${await getFirstBlog(memEntry)}`
    }
    fs.writeFileSync('./history.json', JSON.stringify(historyBlog), 'utf-8')
  }
  let realMemName
  if (memberName !== undefined) {
    if (member[memberName] !== undefined) {
      realMemName = member[memberName]
    } else {
      console.log('成员名输入错误！')
      return
    }
  }
  for (const [memName, memEntry] of Object.entries(memEntDict)) {
    let stopTime = moment('2015.11.29 00:00', dateFormat) // 默认停止时间
    if (realMemName !== undefined && realMemName !== memName) {
      continue
    }
    if (fs.existsSync(`./images/${memName}`)) {
      let memBlogsTime = getDirectories(`./images/${memName}`)
        .map(dir => moment(dir.split('-')[0], dateFormat))
        .sort((a, b) => {
          if (a > b) return -1
          if (a < b) return 1
          return 0
        })
      if (memBlogsTime.length > 0) stopTime = memBlogsTime[0]
    }
    logger.info(`${memName}的stopTime:${stopTime.format(dateFormat)}`)
    let url = `${baseUrl}${await getFirstBlog(memEntry)}`
    let historyFLag = false
    let title_time
    // eslint-disable-next-line no-constant-condition
    while (true) {
      logger.info(url)
      let prevUrl
      try {
        let blog = await getResponseData(url)
        // 获取发布时间
        let postTime = await getSelectedText('.c-blog-article__date>time', blog)
        if (moment(postTime, dateFormat) <= stopTime && !historyFLag) {
          prevUrl = await getPrevUrl(
            await getResponseData(historyBlog[memName])
          )
          if (prevUrl === undefined) {
            break
          } else {
            url = `${baseUrl}${prevUrl}`
            blog = await getResponseData(url)
            // 获取发布时间
            postTime = await getSelectedText('.c-blog-article__date>time', blog)
            historyFLag = true
          }
        }
        const pathArr = [memName]
        // 获取标题
        const title = (await getSelectedText('.c-blog-article__title', blog))
          .trim()
          .slice(0, 20)
        if (title_time === `${postTime}-${title}`) break
        createDir(`./images/${memName}/${postTime}-${title}`)
        pathArr.push(`${postTime}-${title}`)
        const picUrls = await getPicture(blog)
        logger.info(`${memName}-${postTime}-${title}-${picUrls.length}pictures`)
        if (picUrls.length !== 0) {
          for (const picUrl of picUrls) {
            const picUrlArr = picUrl.split('/')
            const picName = picUrlArr[picUrlArr.length - 1]
            await downloadImage(picUrl, pathArr, picName) // 加上await用于串行下载
          }
        }
        if (moment(postTime, dateFormat) <= stopTime) {
          historyBlog[memName] = url
          fs.writeFileSync(
            './history.json',
            JSON.stringify(historyBlog),
            'utf-8'
          )
        }
        prevUrl = await getPrevUrl(blog)
        if (prevUrl === undefined) {
          break
        } else {
          url = `${baseUrl}${prevUrl}`
        }
        title_time = `${postTime}-${title}` // 保存当前的时间加标题
      } catch (e) {
        logger.error(e)
        break
      }
    }
  }
}

if (argv.length === 2) {
  main()
  setInterval(main, 1000 * 3600 * 24)
} else if (argv.length === 3) {
  main(argv[2])
}
