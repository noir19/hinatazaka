const fs = require('fs')
const Path = require('path')
const axios = require('axios')
const $ = require('cheerio')

$.prototype[Symbol.iterator] = function*() {
  for (let i = 0; i < this.length; i += 1) {
    yield this[i]
  }
}

$.prototype.entries = function*() {
  for (let i = 0; i < this.length; i += 1) {
    yield [i, this[i]]
  }
}

async function getResponseData(url) {
  return await axios.get(url).then(response => response.data)
}
async function getMemEntDict(baseUrl) {
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

async function getPrevUrl(blog) {
  return $(
    '.c-pager__item.c-pager__item--prev.c-pager__item--kiji.c-pager__item--kiji__blog>a',
    blog
  ).attr('href')
}

async function getFirstBlog(url) {
  const blog = await getResponseData(url)
  return $(
    'div.p-blog-group > div:nth-child(1) > div.p-button__blog_detail > a',
    blog
  ).attr('href')
}

async function getPicture(blog) {
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

async function getSelectedText(selector, blog) {
  return $(selector, blog).text()
}

async function downloadImage(url, pathArr, name) {
  let basePath = 'images'
  createDir(basePath)
  for (const path of pathArr) {
    createDir(Path.resolve(__dirname, basePath, path))
    basePath = `${basePath}/${path}`
  }
  const writer = fs.createWriteStream(Path.resolve(__dirname, basePath, name))

  // const response = await axios({
  //   url,
  //   method: 'GET',
  //   responseType: 'stream'
  // })
  // response.data.pipe(writer)
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

function createDir(dirPath) {
  !fs.existsSync(dirPath) && fs.mkdirSync(dirPath)
}

module.exports = {
  getMemEntDict,
  getPicture,
  getPrevUrl,
  getFirstBlog,
  downloadImage,
  getResponseData,
  getSelectedText
}
