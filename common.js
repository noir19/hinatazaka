const fs = require('fs')
const Path = require('path')
const Axios = require('axios')

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
  createDir(basePath)
  for (const path of pathArr) {
    createDir(Path.resolve(__dirname, basePath, path))
    basePath = `${basePath}/${path}`
  }
  const writer = fs.createWriteStream(Path.resolve(__dirname, basePath, name))

  // const response = await Axios({
  //   url,
  //   method: 'GET',
  //   responseType: 'stream'
  // })
  // response.data.pipe(writer)
  Axios({
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

module.exports = { getMemEntDict, getPicture, getPrevUrl, downloadImage }
