const puppeteer = require('puppeteer')
const Fs = require('fs')
const Path = require('path')
const Axios = require('axios')

async function main() {
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
    const memEntries = await getMemEntries(baseUrl, page)
    for (const memEntry of memEntries) {
      let prevUrl = memEntry
      while (typeof prevUrl !== undefined) {
        page.goto(prevUrl)
        const pics = await getPicture(page)
        prevUrl = getPrevUrl(page)
        for (const pic of pics) {
          const picArr = pic.split('/')
          const picName = picArr[picArr[length - 1]]
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

async function getPicture(page) {
  const latestHref = await page.$eval(
    'div.p-blog-group > div:nth-child(1) > div.p-button__blog_detail > a',
    el => el.href
  )
  await page.goto(latestHref)
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
  return await page.$eval(
    'div.p-pager > div.c-pager__item.c-pager__item--prev.c-pager__item--kiji.c-pager__item--kiji__blog > a',
    el => el.value
  )
}

main()
