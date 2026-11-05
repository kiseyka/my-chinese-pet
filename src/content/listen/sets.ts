// src/content/listen/sets.ts
//
// Сеты фраз для «Слушай и повторяй»: ситуации из жизни (кафе, магазин…).
// Китайский озвучивает голос телефона (expo-speech, zh-CN), перевод — тоже он
// (ru-RU). Пиньинь — с тонами как произносится (不 и 一 — с учётом смены тона).

export interface ListenPhrase {
  hanzi: string;
  pinyin: string;
  ru: string;
}

export interface ListenSet {
  id: string;
  title: string;
  phrases: ListenPhrase[];
}

export const LISTEN_SETS: ListenSet[] = [
  {
    id: "cafe",
    title: "Кафе и доставка",
    phrases: [
      { hanzi: "你好，我想点菜。", pinyin: "Nǐ hǎo, wǒ xiǎng diǎn cài.", ru: "Здравствуйте, я хочу сделать заказ." },
      { hanzi: "有菜单吗？", pinyin: "Yǒu càidān ma?", ru: "Есть меню?" },
      { hanzi: "我要一杯奶茶。", pinyin: "Wǒ yào yì bēi nǎichá.", ru: "Мне стакан молочного чая." },
      { hanzi: "少放点糖。", pinyin: "Shǎo fàng diǎn táng.", ru: "Поменьше сахара." },
      { hanzi: "这个辣不辣？", pinyin: "Zhège là bu là?", ru: "Это острое?" },
      { hanzi: "在这儿吃还是带走？", pinyin: "Zài zhèr chī háishi dàizǒu?", ru: "Здесь или с собой?" },
      { hanzi: "带走，谢谢。", pinyin: "Dàizǒu, xièxie.", ru: "С собой, спасибо." },
      { hanzi: "一共多少钱？", pinyin: "Yígòng duōshao qián?", ru: "Сколько всего?" },
      { hanzi: "可以用微信支付吗？", pinyin: "Kěyǐ yòng Wēixìn zhīfù ma?", ru: "Можно оплатить через WeChat?" },
      { hanzi: "外卖什么时候到？", pinyin: "Wàimài shénme shíhou dào?", ru: "Когда приедет доставка?" },
    ],
  },
  {
    id: "shop",
    title: "Магазин",
    phrases: [
      { hanzi: "这个多少钱？", pinyin: "Zhège duōshao qián?", ru: "Сколько это стоит?" },
      { hanzi: "太贵了。", pinyin: "Tài guì le.", ru: "Слишком дорого." },
      { hanzi: "可以便宜一点吗？", pinyin: "Kěyǐ piányi yìdiǎn ma?", ru: "Можно чуть дешевле?" },
      { hanzi: "我只是看看。", pinyin: "Wǒ zhǐshì kànkan.", ru: "Я просто смотрю." },
      { hanzi: "有大一点的吗？", pinyin: "Yǒu dà yìdiǎn de ma?", ru: "Есть побольше?" },
      { hanzi: "我要这个。", pinyin: "Wǒ yào zhège.", ru: "Мне вот это." },
      { hanzi: "需要袋子吗？", pinyin: "Xūyào dàizi ma?", ru: "Нужен пакет?" },
      { hanzi: "不用了，谢谢。", pinyin: "Búyòng le, xièxie.", ru: "Не нужно, спасибо." },
      { hanzi: "可以扫码吗？", pinyin: "Kěyǐ sǎomǎ ma?", ru: "Можно оплатить по QR-коду?" },
      { hanzi: "我用手机付钱。", pinyin: "Wǒ yòng shǒujī fù qián.", ru: "Я заплачу телефоном." },
    ],
  },
];
