import {dataPacks} from './data-packs.js'

class Foodb {
  constructor() {
    this.packs = dataPacks
    this.customPacks = {}
  }

  // Добавление своего набора данных
  addPack(name, pack) {
    this.customPacks[name] = pack
    return `(っ˘ω˘ς) Набор '${name}' добавлен!`
  }

  // Генерация текста по категории и длине
  text(category, maxLength = 100) {
    const pack = this.customPacks[category] || this.packs[category]
    if (!pack) throw new Error(`(´• ω •\`)ﾉ Набор '${category}' не найден! Попробуйте: ${Object.keys({...this.packs, ...this.customPacks}).join(', ')}`)

    let result = this._generateFromTemplate(category)
    if (result.length > maxLength) {
      result = result.slice(0, maxLength - 3) + '...'
    }
    return result
  }

  // Генерация varchar/char
  varchar(category, maxLength) {
    return this.text(category, maxLength)
  }

  // Внутренний метод: генерация по шаблону
  _generateFromTemplate(category) {
    const pack = this.customPacks[category] || this.packs[category]
    const template = pack.templates
      ? pack.templates[Math.floor(Math.random() * pack.templates.length)]
      : '[default]'

    return template.replace(/\[(\w+)\]/g, (match, key) => {
      return pack[key]
        ? pack[key][Math.floor(Math.random() * pack[key].length)]
        : match
    })
  }
}

export const foodb = new Foodb()
