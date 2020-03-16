const common = require('./common.js')
const member = require('./member.js')
const argv = process.argv

const baseUrl = 'https://www.hinatazaka46.com'

async function main (memberName) {
  let memEntDict = {}
  const originMemEntDict = await common.getMemEntDict(baseUrl)
  if (memberName !== undefined) {
    if (member[memberName] !== undefined) {
      memEntDict[member[memberName]] = originMemEntDict[member[memberName]]
    } else {
      console.log('成员名输入错误！')
      return
    }
  } else memEntDict = originMemEntDict
  for (const [memName, memEntry] of Object.entries(memEntDict)) {
    let prevUrl = `${baseUrl}${await common.getFirstBlog(memEntry)}`
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // console.log(prevUrl)
      const prevBlog = await common.getResponseData(prevUrl)
      // console.log(prevBlog)
      const pathArr = [memName]
      try {
        const title = (
          await common.getSelectedText('.c-blog-article__title', prevBlog)
        ).trim()
        const postTime = await common.getSelectedText(
          '.c-blog-article__date>time',
          prevBlog
        )
        pathArr.push(`${postTime}-${title}`)
        const picUrls = await common.getPicture(prevBlog)
        // console.log(picUrls)
        prevUrl = `${baseUrl}${await common.getPrevUrl(prevBlog)}`
        try {
          if (picUrls.length !== 0) {
            for (const picUrl of picUrls) {
              const picUrlArr = picUrl.split('/')
              const picName = picUrlArr[picUrlArr.length - 1]
              await common.downloadImage(picUrl, pathArr, picName) // 加上await用于串行下载
            }
          }
        } catch (e) {
          console.log(picUrls)
        }
      } catch (e) {
        console.log(e)
        break
      }
    }
  }
}

if (argv.length === 2) {
  main()
} else if (argv.length === 3) {
  main(argv[2])
}
