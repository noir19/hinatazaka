const fs = require('fs')
const Path = require('path')
const axios = require('axios')
const cheerio = require('cheerio')

// cheerio.prototype[Symbol.iterator] = function* () {
//   for (let i = 0; i < this.length; i += 1) {
//     yield this[i]
//   }
// }

// cheerio.prototype.entries = function* () {
//   for (let i = 0; i < this.length; i += 1) {
//     yield [i, this[i]]
//   }
// }

const getResponseData = async (url) =>
  await axios.get(url).then((response) => response.data)

const getMemEntDict = async (baseUrl) => {
  // 获取成员名字和博客入口字典
  const memEntDict = {}
  const homePage = await getResponseData(
    'https://www.hinatazaka46.com/s/official/diary/member?ima=0000'
  )

  $ = cheerio.load(homePage)
  const mems = $('.js-select > option:not(:nth-child(1))', homePage)
  for (const mem of mems) {
    const memName = $(mem)
      .text()
      .split('(')[0]
    memEntDict[memName] = baseUrl + $(mem).attr('value')
  }
  return memEntDict
}

const getPrevUrl = async (blog) =>
  $(
    '.c-pager__item.c-pager__item--prev.c-pager__item--kiji.c-pager__item--kiji__blog>a',
    blog
  ).attr('href')

const getFirstBlog = async (url) =>
  $(
    'div.p-blog-group > div:nth-child(1) > div.p-button__blog_detail > a',
    await getResponseData(url)
  ).attr('href')

const getPicture = async (blog) => {
  const imgs = await $('.c-blog-article__text img', blog)
  const srcs = []
  if (imgs.length !== 0) {
    for (const img of imgs) {
      srcs.push($(img).attr('src'))
    }
  }
  return srcs
}

const getSelectedText = async (selector, blog) => await $(selector, blog).text()

const downloadImage = async (url, pathArr, name) => {
  if (name === '') return
  // 下载图片
  const writer = fs.createWriteStream(
    Path.resolve(__dirname, ['..', 'hinatazakaImages', ...pathArr].join('/'), name)
  )

  axios({
    url,
    method: 'GET',
    responseType: 'stream'
  }).then((response) => {
    response.data.pipe(writer)
  })

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

const createDir = (dirPath) =>
  !fs.existsSync(dirPath) && fs.mkdirSync(dirPath, { recursive: true })

const getDirectories = (path) =>
  fs
    .readdirSync(path, { withFileTypes: true })
    .filter((dir) => dir.isDirectory())
    .map((dir) => dir.name)

const intersection = (a, b) => a.filter((v) => b.includes(v))
const difference = (a, b) => a.concat(b).filter((v) => !a.includes(v)) // b-a

module.exports = {
  getMemEntDict,
  getPicture,
  getPrevUrl,
  getFirstBlog,
  downloadImage,
  getResponseData,
  getSelectedText,
  createDir,
  getDirectories,
  intersection,
  difference
}
