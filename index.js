const puppeteer = require('puppeteer')
const common = require('./common.js')
const member = require('./member.js')
const argv = process.argv

async function main(memberName) {
  const baseUrl = 'https://www.hinatazaka46.com'
  const browser = await puppeteer.launch({
    // headless: false
  })

  try {
    const page = (await browser.pages())[0]
    await page.setDefaultNavigationTimeout(0)
    await page.goto(
      'https://www.hinatazaka46.com/s/official/diary/member?ima=0000'
    )
    const originMemEntDict = await common.getMemEntDict(baseUrl, page)
    let memEntDict = {}
    if (memberName !== undefined) {
      if (member[memberName] !== undefined) {
        memEntDict[member[memberName]] = originMemEntDict[member[memberName]]
      } else {
        await browser.close()
        console.log('成员名输入错误！')
        return
      }
    } else memEntDict = originMemEntDict
    for (const [memName, memEntry] of Object.entries(memEntDict)) {
      await page.goto(memEntry)
      let prevUrl
      try {
        prevUrl = await (
          await page.$(
            'div.p-blog-group > div:nth-child(1) > div.p-button__blog_detail > a'
          )
        ).evaluate(node => node.href)
      } catch (e) {
        console.log(e)
      }
      while (true) {
        console.log(prevUrl)
        const pathArr = [memName]
        try {
          await page.goto(prevUrl)
          const title = await (
            await page.$('div.c-blog-article__title')
          ).evaluate(node => node.innerText)
          const postTime = await (
            await page.$('div.c-blog-article__date')
          ).evaluate(node => node.innerText)
          pathArr.push(`${postTime}-${title}`)
          const picUrls = await common.getPicture(page)
          prevUrl = await common.getPrevUrl(page)
          try {
            if (picUrls.length !== 0) {
              for (const picUrl of picUrls) {
                const picUrlArr = picUrl.split('/')
                const picName = picUrlArr[picUrlArr.length - 1]
                common.downloadImage(picUrl, pathArr, picName)
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
    await browser.close()
  } catch (error) {
    console.log(error)
  }
}

if (argv.length === 2) {
  main()
} else if (argv.length === 3) {
  main(argv[2])
}
