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

async function main() {
  const homePage = await axios
    .get('https://www.hinatazaka46.com/s/official/diary/member?ima=0000')
    .then(response => response.data)

  const mems = $('.js-select > option:not(:nth-child(1))', homePage)
  for (const mem of mems) {
    console.log(
      $(mem)
        .text()
        .split('(')[0]
    )
  }
}

main()
