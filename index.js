const puppeteer = require('puppeteer')
const fs = require('fs')
const Path = require('path')
const Axios = require('axios')

async function main() {
  const baseUrl = 'https://www.hinatazaka46.com'
  const browser = await puppeteer.launch({
    headless: false
  })

  try {
    const page = (await browser.pages())[0]
    await page.setDefaultNavigationTimeout(0)
    await page.goto(
      'https://www.hinatazaka46.com/s/official/diary/member?ima=0000'
    )
    // const memEntries = await getMemEntries(baseUrl, page)
    const memEntDict = await getMemEntDict(baseUrl, page)
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
          const picUrls = await getPicture(page)
          prevUrl = await getPrevUrl(page)
          try {
            if (picUrls.length !== 0) {
              for (const picUrl of picUrls) {
                const picUrlArr = picUrl.split('/')
                const picName = picUrlArr[picUrlArr.length - 1]
                downloadImage(picUrl, pathArr, picName)
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

async function getMemEntries(baseUrl, page) {
  const memEntries = []
  const baseMemEntries = await page.$$eval(
    'div.p-blog-member-filter > div > form > select > option:not(:nth-child(1))',
    options => options.map(option => option.value)
  )
  for (const baseMemEntry of baseMemEntries) {
    memEntries.push(`${baseUrl}${baseMemEntry}`)
  }
  return memEntries
}

async function getMemEntDict(baseUrl, page) {
  const memEntDict = {}
  const baseMemNodes = await page.$$(
    'div.p-blog-member-filter > div > form > select > option:not(:nth-child(1))'
  )
  for (const baseMemNode of baseMemNodes) {
    const memName = (await baseMemNode.evaluate(node => node.innerText)).split(
      '('
    )[0]
    const memEntry = await baseMemNode.evaluate(node => node.value)
    memEntDict[memName] = `${baseUrl}${memEntry}`
  }
  return memEntDict
}

async function getPicture(page) {
  const mainContent = await page.$(
    'div.l-maincontents--blog > div.p-blog-group > div > div.c-blog-article__text'
  )
  const imgs = await mainContent.$$('img:not([class])')
  const srcs =
    imgs.length === 0
      ? []
      : await Promise.all(
          imgs.map(async img => await img.evaluate(node => node.src))
        )
  return srcs
}

async function getPrevUrl(page) {
  return await (
    await page.$(
      'div.p-pager > div.c-pager__item.c-pager__item--prev.c-pager__item--kiji.c-pager__item--kiji__blog > a'
    )
  ).evaluate(node => node.href)
}

async function downloadImage(url, pathArr, name) {
  let basePath = 'images'
  for (const path of pathArr) {
    createDir(Path.resolve(__dirname, basePath, path))
    basePath = `${basePath}/${path}`
  }
  console.log(basePath)
  const writer = fs.createWriteStream(Path.resolve(__dirname, basePath, name))

  const response = await Axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })

  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

function createDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath)
  }
}

main()
