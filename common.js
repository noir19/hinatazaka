const fs = require('fs')
const Path = require('path')
const axios = require('axios')
const $ = require('cheerio')

$.prototype[Symbol.iterator] = function* () {
  for (let i = 0; i < this.length; i += 1) {
    yield this[i]
  }
}

$.prototype.entries = function* () {
  for (let i = 0; i < this.length; i += 1) {
    yield [i, this[i]]
  }
}

const getResponseData = async url =>
  await axios.get(url).then(response => response.data)

const getMemEntDict = async baseUrl => {
  // 获取成员名字和博客入口字典
  const memEntDict = {}
  const homePage = await getResponseData(
    'https://www.hinatazaka46.com/s/official/diary/member?ima=0000'
  )

  const mems = $('.js-select > option:not(:nth-child(1))', homePage)
  for (const mem of mems) {
    const memName = $(mem)
      .text()
      .split('(')[0]
    memEntDict[memName] = baseUrl + $(mem).attr('value')
  }
  return memEntDict
}

const getPrevUrl = async blog =>
  $(
    '.c-pager__item.c-pager__item--prev.c-pager__item--kiji.c-pager__item--kiji__blog>a',
    blog
  ).attr('href')

const getFirstBlog = async url =>
  $(
    'div.p-blog-group > div:nth-child(1) > div.p-button__blog_detail > a',
    await getResponseData(url)
  ).attr('href')

const getPicture = async blog => {
  const imgs = await $('.c-blog-article__text img', blog)
  console.log(imgs.length)
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
  // 下载图片
  let basePath = 'images'
  createDir(basePath)
  for (const path of pathArr) {
    createDir(Path.resolve(__dirname, basePath, path))
    basePath = `${basePath}/${path}`
  }
  const writer = fs.createWriteStream(Path.resolve(__dirname, basePath, name))

  axios({
    url,
    method: 'GET',
    responseType: 'stream'
  }).then(response => {
    response.data.pipe(writer)
  })

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

const createDir = dirPath => !fs.existsSync(dirPath) && fs.mkdirSync(dirPath)

module.exports = {
  getMemEntDict,
  getPicture,
  getPrevUrl,
  getFirstBlog,
  downloadImage,
  getResponseData,
  getSelectedText
}
