// src/content/panda/thoughtPhrases.ts
//
// ФРАЗЫ ПАНДЫ — короткие фразы на китайском, которые панда говорит, когда пользователь
// тапает по облачку «…» (см. utils/panda/thoughts.ts).
//
// Как добавить фразу:
//   id     — любой уникальный ключ, после выхода НЕ МЕНЯТЬ (по нему помнится, какие фразы
//            уже были и какие лежат в коллекции профиля);
//   words  — фраза по словам, как в словаре (好看, а не 好 + 看); знаки препинания —
//            отдельными элементами. Склеенные words — это и есть фраза;
//   ru, en — перевод (под плашкой «Показать перевод»). Если в русском есть род
//            пользователя, пиши обе формы: «Ты сегодня {пил|пила} воду?» — подставится
//            по выбору в профиле, без выбора — «пил(а)» (utils/gender.ts);
//   pinyin — только если пиньинь слова во фразе отличается от словаря
//            (изменение тона: { "一个": "yí gè" }). Остальное берётся из словаря;
//   note   — необязательно: «Почему так говорят?» — откуда фраза, когда её говорят,
//            чем отличается от похожих (ru, en). Показывается сразу под фразой.
//            Иероглифы подряд в пояснении — одно выражение: тап переводит его целиком
//            (送钟 «дарить часы», а не 送 и 钟 по отдельности). Перевод берётся из
//            note.terms, затем из самой фразы/ответов, затем из словаря. Если выражения
//            нет в словаре или в пояснении у него особый смысл — допиши в terms:
//            terms: { "送钟": { pinyin: "sòng zhōng", ru: "дарить часы", en: "give a clock" } };
//   replies — необязательно, у вопросов: варианты ответа (тоже по-китайски, с переводом)
//            и реакция панды на каждый (reaction). Ответ запоминается (pandaStore.answers);
//   requires — необязательно: фраза появится, только если на вопрос phraseId ответили
//            replyId. Так панда «помнит» ответы: «ты любишь зелёный — мой цветок тоже».
//
// Панда покажет фразу, только когда у пользователя есть хотя бы 1 точка (перевода
// или письма) у каждого её слова. Проверка: node --no-warnings --experimental-strip-types scripts/check-panda-phrases.mjs
// (слова, которых нет в словаре, и склейку).

/** Строка по-китайски с переводом: реплика, ответ, реакция. */
export interface PhraseLine {
  words: string[];
  ru: string;
  en: string;
  pinyin?: Record<string, string>;
}

export interface PhraseReply extends PhraseLine {
  /** Ключ ответа, после выхода НЕ МЕНЯТЬ (по нему помнится ответ). */
  id: string;
  /** Что панда скажет в ответ. */
  reaction?: PhraseLine;
}

export interface PandaPhrase extends PhraseLine {
  id: string;
  note?: {
    ru: string;
    en: string;
    /** Выражения из пояснения, которых нет в словаре или у которых тут особый смысл. */
    terms?: Record<string, { pinyin?: string; ru: string; en: string }>;
  };
  replies?: PhraseReply[];
  requires?: { phraseId: string; replyId: string };
}

// Тестовые фразы — замени своими
export const pandaPhrases: PandaPhrase[] = [
  {
    id: "flower-pretty",
    words: ["我", "的", "花", "很", "好看", "。"],
    ru: "Мой цветок очень красивый.",
    en: "My flower is very pretty.",
  },
  {
    id: "drank-water",
    words: ["你", "今天", "喝", "水", "了", "吗", "？"],
    ru: "Ты сегодня {пил|пила} воду?",
    en: "Have you had water today?",
    pinyin: { 吗: "ma" },
    replies: [
      {
        id: "yes",
        words: ["喝", "了", "。"],
        ru: "Да, уже.",
        en: "Yes, I have.",
        reaction: {
          words: ["太", "好", "了", "！"],
          ru: "Отлично!",
          en: "Great!",
        },
      },
      {
        id: "no",
        words: ["还", "没有", "。"],
        ru: "Ещё нет.",
        en: "Not yet.",
        reaction: {
          words: ["快", "去", "喝", "水", "吧", "！"],
          ru: "Скорее иди попей воды!",
          en: "Go drink some water!",
        },
      },
    ],
  },
  {
    id: "like-rice",
    words: ["我", "喜欢", "吃", "米饭", "。"],
    ru: "Я люблю есть рис.",
    en: "I like eating rice.",
  },
  {
    id: "weather-good",
    words: ["今天", "天气", "很", "好", "。"],
    ru: "Сегодня хорошая погода.",
    en: "The weather is nice today.",
  },
  // Черновик от Claude — проверь, поправь или замени
  {
    id: "hungry",
    words: ["我", "饿", "了", "。"],
    ru: "Я проголодалась.",
    en: "I'm hungry.",
  },
  {
    id: "tea-together",
    words: ["我们", "一起", "喝", "茶", "吧", "！"],
    ru: "Давай вместе попьём чаю!",
    en: "Let's have some tea together!",
    pinyin: { 一起: "yì qǐ" },
  },
  {
    id: "rain-outside",
    words: ["外面", "下雨", "了", "。"],
    ru: "На улице пошёл дождь.",
    en: "It started raining outside.",
  },
  {
    id: "dress-warm",
    words: ["今天", "很", "冷", "，", "多", "穿", "衣服", "！"],
    ru: "Сегодня холодно, оденься потеплее!",
    en: "It's cold today, dress warmly!",
  },
  {
    id: "moon",
    words: ["我", "喜欢", "看", "月亮", "。"],
    ru: "Я люблю смотреть на луну.",
    en: "I like looking at the moon.",
  },
  {
    id: "rest",
    words: ["我们", "休息", "一会儿", "吧", "。"],
    ru: "Давай немного отдохнём.",
    en: "Let's rest for a bit.",
    pinyin: { 一会儿: "yí huìr" },
  },
  {
    id: "flower-smell",
    words: ["我", "的", "花", "很", "香", "。"],
    ru: "Мой цветок так приятно пахнет.",
    en: "My flower smells so nice.",
  },
  {
    id: "dumplings",
    words: ["我", "想", "吃", "饺子", "。"],
    ru: "Хочу пельменей.",
    en: "I want some dumplings.",
  },
  {
    id: "happy-today",
    words: ["我", "今天", "很", "高兴", "！"],
    ru: "Мне сегодня так радостно!",
    en: "I'm so happy today!",
  },
  {
    id: "thanks-study",
    words: ["谢谢", "你", "和", "我", "一起", "学习", "！"],
    ru: "Спасибо, что учишься вместе со мной!",
    en: "Thank you for studying with me!",
    pinyin: { 一起: "yì qǐ" },
  },
  {
    id: "no-rain",
    words: ["我", "不", "喜欢", "下雨", "。"],
    ru: "Я не люблю дождь.",
    en: "I don't like rain.",
  },
  {
    id: "what-color",
    words: ["你", "喜欢", "什么", "颜色", "？"],
    ru: "Какой цвет тебе нравится?",
    en: "What color do you like?",
    replies: [
      {
        id: "green",
        words: ["我", "喜欢", "绿色", "。"],
        ru: "Мне нравится зелёный.",
        en: "I like green.",
        reaction: {
          words: ["我", "也", "喜欢", "绿色", "！"],
          ru: "Я тоже люблю зелёный!",
          en: "I like green too!",
        },
      },
      {
        id: "red",
        words: ["我", "喜欢", "红色", "。"],
        ru: "Мне нравится красный.",
        en: "I like red.",
        reaction: {
          words: ["红色", "很", "漂亮", "！"],
          ru: "Красный — очень красивый!",
          en: "Red is very pretty!",
        },
      },
      {
        id: "blue",
        words: ["我", "喜欢", "蓝色", "。"],
        ru: "Мне нравится синий.",
        en: "I like blue.",
        reaction: {
          words: ["蓝色", "很", "好看", "！"],
          ru: "Синий очень красивый!",
          en: "Blue looks great!",
        },
      },
      {
        id: "yellow",
        words: ["我", "喜欢", "黄色", "。"],
        ru: "Мне нравится жёлтый.",
        en: "I like yellow.",
        reaction: {
          words: ["黄色", "很", "好看", "！"],
          ru: "Жёлтый очень красивый!",
          en: "Yellow looks great!",
        },
      },
    ],
  },
  {
    id: "green",
    words: ["我", "最", "喜欢", "绿色", "。"],
    ru: "Больше всего я люблю зелёный.",
    en: "Green is my favorite color.",
  },
  {
    id: "stars",
    words: ["晚上", "我们", "看", "星星", "吧", "。"],
    ru: "Вечером давай посмотрим на звёзды.",
    en: "Let's look at the stars tonight.",
  },
  {
    id: "cake",
    words: ["蛋糕", "很", "甜", "，", "我", "很", "喜欢", "！"],
    ru: "Торт сладкий, обожаю!",
    en: "Cake is sweet, I love it!",
  },
  {
    id: "not-hard",
    words: ["汉语", "不", "难", "！"],
    ru: "Китайский — это не сложно!",
    en: "Chinese isn't hard!",
  },
  {
    id: "reading-room",
    words: ["我", "在", "房间", "里", "看", "书", "。"],
    ru: "Я читаю книжку в комнате.",
    en: "I'm reading a book in my room.",
  },
  {
    id: "what-today",
    words: ["你", "今天", "想", "做", "什么", "？"],
    ru: "Что ты хочешь сегодня делать?",
    en: "What do you want to do today?",
    replies: [
      {
        id: "study",
        words: ["我", "想", "学习", "汉语", "。"],
        ru: "Хочу учить китайский.",
        en: "I want to study Chinese.",
        reaction: {
          words: ["太", "好", "了", "！", "加油", "！"],
          ru: "Здорово! Вперёд!",
          en: "Great! Go for it!",
        },
      },
      {
        id: "rest",
        words: ["我", "想", "休息", "。"],
        ru: "Хочу отдохнуть.",
        en: "I want to rest.",
        reaction: {
          words: ["好", "，", "我们", "一起", "休息", "吧", "。"],
          ru: "Хорошо, давай отдохнём вместе.",
          en: "Okay, let's rest together.",
          pinyin: { 一起: "yì qǐ" },
        },
      },
      {
        id: "read",
        words: ["我", "想", "看书", "。"],
        ru: "Хочу почитать.",
        en: "I want to read.",
        reaction: {
          words: ["我", "也", "喜欢", "看书", "！"],
          ru: "Я тоже люблю читать!",
          en: "I like reading too!",
        },
      },
      {
        id: "sport",
        words: ["我", "想", "运动", "。"],
        ru: "Хочу позаниматься спортом.",
        en: "I want to exercise.",
        reaction: {
          words: ["真", "棒", "！"],
          ru: "Вот это да!",
          en: "Awesome!",
        },
      },
    ],
  },
  {
    id: "write-name",
    words: ["我", "会", "写", "我", "的", "名字", "！"],
    ru: "Я умею писать своё имя!",
    en: "I can write my name!",
  },
  {
    id: "know-name",
    words: ["你", "知道", "我", "的", "名字", "吗", "？"],
    ru: "Ты знаешь, как меня зовут?",
    en: "Do you know my name?",
    pinyin: { 吗: "ma" },
  },
  {
    id: "our-room",
    words: ["我", "很", "喜欢", "我们", "的", "房间", "。"],
    ru: "Мне очень нравится наша комната.",
    en: "I really like our room.",
  },
  {
    id: "park-walk",
    words: ["我", "想", "去", "公园", "散步", "。"],
    ru: "Хочу погулять в парке.",
    en: "I want to go for a walk in the park.",
  },
  {
    id: "fruit",
    words: ["苹果", "好吃", "，", "香蕉", "也", "好吃", "！"],
    ru: "Яблоки вкусные, и бананы тоже!",
    en: "Apples are tasty, and bananas too!",
  },
  {
    id: "sunny",
    words: ["今天", "的", "太阳", "真", "好", "。"],
    ru: "Сегодня такое хорошее солнышко.",
    en: "The sun is so nice today.",
  },
  {
    id: "hanzi-pretty",
    words: ["汉字", "很", "漂亮", "。"],
    ru: "Иероглифы такие красивые.",
    en: "Chinese characters are so beautiful.",
  },
  {
    id: "cute-sleeping",
    words: ["我", "睡觉", "的", "时候", "很", "可爱", "吗", "？"],
    ru: "Я милая, когда сплю?",
    en: "Am I cute when I sleep?",
    pinyin: { 吗: "ma" },
    replies: [
      {
        id: "very",
        words: ["很", "可爱", "！"],
        ru: "Очень милая!",
        en: "Very cute!",
        reaction: {
          words: ["谢谢", "你", "！"],
          ru: "Спасибо!",
          en: "Thank you!",
        },
      },
      {
        id: "of-course",
        words: ["当然", "！"],
        ru: "Конечно!",
        en: "Of course!",
        reaction: {
          words: ["我", "很", "高兴", "！"],
          ru: "Как приятно!",
          en: "That makes me happy!",
        },
      },
    ],
  },
  {
    id: "good-friend",
    words: ["你", "是", "我", "的", "好", "朋友", "。"],
    ru: "Ты мой хороший друг.",
    en: "You're my good friend.",
  },
  {
    id: "see-tomorrow",
    words: ["明天见", "！"],
    ru: "До завтра!",
    en: "See you tomorrow!",
  },
  {
    id: "snow-outside",
    words: ["下雪", "了", "！", "我们", "出去", "吧", "！"],
    ru: "Пошёл снег! Пойдём на улицу!",
    en: "It's snowing! Let's go outside!",
  },
  // Разговорные фразы с пояснением «Почему так говорят?» — черновик от Claude
  {
    id: "chi-le-ma",
    words: ["你", "吃", "了", "吗", "？"],
    ru: "Привет! (дословно: «Ты {поел|поела}?»)",
    en: "Hi! (literally: “Have you eaten?”)",
    pinyin: { 吗: "ma" },
    note: {
      ru: "Это приветствие, а не вопрос про еду. Так показывают заботу: «у тебя всё хорошо?». Обычно это объясняют тем, что сытость веками была главной заботой: если человек поел, значит, всё в порядке. Отвечают коротко: 吃了 (поел) или 还没 (ещё нет). Сейчас так говорят реже, чаще старшие.",
      en: "It's a greeting, not a question about food — a way to show you care. It's usually explained by centuries when having enough to eat was the main worry: if you've eaten, all is well. Short answers: 吃了 (I have) or 还没 (not yet). Today it's less common, more often said by older people.",
      terms: {
        "吃了": { pinyin: "chī le", ru: "{поел|поела}", en: "I've eaten" },
        "还没": { pinyin: "hái méi", ru: "ещё нет", en: "not yet" },
      },
    },
    replies: [
      {
        id: "ate",
        words: ["吃", "了", "。"],
        ru: "Да, уже.",
        en: "Yes, already.",
        reaction: {
          words: ["我", "也", "吃", "了", "！"],
          ru: "Я тоже!",
          en: "Me too!",
        },
      },
      {
        id: "not-yet",
        words: ["还", "没有", "。"],
        ru: "Ещё нет.",
        en: "Not yet.",
        reaction: {
          words: ["我们", "一起", "吃", "饭", "吧", "！"],
          ru: "Давай поедим вместе!",
          en: "Let's eat together!",
          pinyin: { 一起: "yì qǐ" },
        },
      },
    ],
  },
  {
    id: "bai-bai",
    words: ["拜拜", "！"],
    ru: "Пока-пока!",
    en: "Bye-bye!",
    note: {
      ru: "Это заимствование из английского bye-bye — звучит почти так же. 拜拜 — лёгкое прощание с друзьями, в мессенджерах. 再见 («снова увидимся») — обычное, подходит для всех. В речи часто слышно báibái, хотя в словарях пишут bàibài.",
      en: "A loanword from English “bye-bye” — it sounds almost the same. 拜拜 is a casual goodbye for friends and chats. 再见 (“see again”) is the standard one, fine with anyone. In speech you'll often hear báibái, though dictionaries write bàibài.",
    },
  },
  {
    id: "hui-tou-jian",
    words: ["回头见", "！"],
    ru: "Ещё увидимся!",
    en: "See you later!",
    note: {
      ru: "Дословно «обернусь — увижу»: значит, встретимся скоро. Так прощаются с одноклассниками или коллегами. А если знаешь, когда увидитесь, время ставят перед 见: 明天见 — до завтра.",
      en: "Literally “turn your head and see”: we'll meet again soon. Said to classmates or coworkers. If you know when you'll meet, the time goes before 见: 明天见 — see you tomorrow.",
    },
  },
  {
    id: "hao-jiu-bu-jian",
    words: ["好久不见", "！"],
    ru: "Давно не виделись!",
    en: "Long time no see!",
    note: {
      ru: "Дословно «очень долго не видеть». Английское long time no see звучит слово в слово так же и выглядит как калька с китайского — но откуда оно на самом деле, лингвисты спорят: есть и версия про упрощённый английский индейцев Северной Америки.",
      en: "Literally “very long not see”. English “long time no see” matches it word for word and looks like a calque from Chinese — but linguists still argue about its origin; there's also a theory it comes from Native American pidgin English.",
    },
  },
  {
    id: "jia-you",
    words: ["学习", "汉语", "，", "加油", "！"],
    ru: "Учишь китайский — давай, вперёд!",
    en: "Learning Chinese — go for it!",
    note: {
      ru: "加油 дословно «добавь масла», как заправить машину. Так подбадривают всех: спортсменов, друзей перед экзаменом, себя.",
      en: "加油 literally means “add oil”, like refuelling a car. It's how you cheer on anyone: athletes, friends before an exam, yourself.",
    },
  },
  {
    id: "xin-ku-le",
    words: ["今天", "辛苦了", "！"],
    ru: "Спасибо за сегодняшние труды!",
    en: "Thanks for your hard work today!",
    note: {
      ru: "辛苦 — «горько и тяжело». 辛苦了 говорят тому, кто потрудился: коллегам после работы, курьеру, другу после трудного дня. Это не жалость, а благодарность за усилия.",
      en: "辛苦 means “bitter and hard”. 辛苦了 is said to someone who worked hard: coworkers after work, a courier, a friend after a tough day. It's not pity — it's thanks for the effort.",
    },
  },
  {
    id: "man-zou",
    words: ["慢", "走", "！"],
    ru: "Счастливо! (дословно: «Иди медленно»)",
    en: "Take care! (literally: “Walk slowly”)",
    note: {
      ru: "Так хозяева, продавцы или официанты прощаются с уходящим гостем: не спеши, береги себя по дороге. Сам уходящий так не говорит.",
      en: "Hosts, shopkeepers or waiters say this to a leaving guest: don't hurry, take care on the way. The person leaving doesn't say it.",
    },
  },
  {
    id: "na-li-na-li",
    words: ["你", "说", "我", "可爱", "？", "哪里", "哪里", "！"],
    ru: "Говоришь, я милая? Да что ты, что ты!",
    en: "You say I'm cute? Oh, not at all!",
    pinyin: { 哪里: "nǎ li" },
    note: {
      ru: "哪里哪里 дословно «где? где?» — «где же тут хорошее?». Так скромно отвечают на похвалу. Сейчас это звучит немного официально: молодые чаще просто говорят 谢谢.",
      en: "哪里哪里 is literally “where? where?” — “where's the good part?”. It's a modest reply to a compliment. Today it sounds a bit formal; younger people often just say 谢谢.",
      terms: {
        "哪里哪里": { pinyin: "nǎ li nǎ li", ru: "что вы, что вы (скромно в ответ на похвалу)", en: "oh, not at all (modest reply to praise)" },
      },
    },
  },
  {
    id: "gan-bei",
    words: ["喝", "茶", "，", "干杯", "！"],
    ru: "Пьём чай — до дна!",
    en: "Let's drink tea — cheers!",
    note: {
      ru: "干杯 дословно «сухой бокал» — то есть выпить до дна. Но допивать необязательно: после тоста достаточно сделать глоток.",
      en: "干杯 literally means “dry cup” — drink it all. But you don't have to finish: a sip after the toast is fine.",
    },
  },
  {
    id: "nin-hao",
    words: ["您好", "！"],
    ru: "Здравствуйте!",
    en: "Hello! (polite)",
    note: {
      ru: "您 — вежливое «вы»: к старшим, учителям, незнакомым. Посмотри на иероглиф: это 你 («ты»), а под ним 心 — «сердце». Получается «ты» с уважением от сердца.",
      en: "您 is the polite “you”: for elders, teachers, strangers. Look at the character: it's 你 (“you”) with 心 (“heart”) underneath — “you”, with respect from the heart.",
    },
  },
  {
    id: "bu-ke-qi",
    words: ["不客气", "！"],
    ru: "Не за что!",
    en: "You're welcome!",
    pinyin: { 不客气: "bú kè qi" },
    note: {
      ru: "Дословно «не будь гостем»: не церемонься, мы свои. Так отвечают на 谢谢. Ещё говорят 不用谢 — «не нужно благодарить».",
      en: "Literally “don't be a guest”: no need for ceremony, we're close. It's the reply to 谢谢. People also say 不用谢 — “no need to thank”.",
      terms: {
        "不用谢": { pinyin: "bú yòng xiè", ru: "не нужно благодарить", en: "no need to thank me" },
      },
    },
  },
  {
    id: "mei-guan-xi",
    words: ["没关系", "！"],
    ru: "Ничего страшного!",
    en: "No worries!",
    note: {
      ru: "Дословно «нет связи»: это ни на что не влияет, не переживай. Классический ответ на 对不起 (прости).",
      en: "Literally “no connection”: it doesn't matter, don't worry. The classic reply to 对不起 (sorry).",
    },
  },
  {
    id: "duo-he-re-shui",
    words: ["多", "喝", "热", "水", "！"],
    ru: "Пей побольше горячей воды!",
    en: "Drink more hot water!",
    note: {
      ru: "Самый частый китайский совет при любом недомогании: простуда, усталость, болит живот. В интернете фраза стала мемом про заботу «для галочки» — когда больше сказать нечего.",
      en: "The most common Chinese advice for any ailment: a cold, tiredness, a stomach ache. Online it became a meme about token care — what you say when you have nothing else to offer.",
    },
  },
  {
    id: "sui-bian",
    words: ["吃", "什么", "？", "随便", "！"],
    ru: "Что поедим? — Да всё равно!",
    en: "What shall we eat? — Whatever!",
    note: {
      ru: "随便 — «как удобно, как угодно». Это самый частый ответ на «что будем есть?», и над ним шутят: «随便» — самое трудное блюдо, его нет ни в одном меню.",
      en: "随便 means “as you like, whatever”. It's the most common answer to “what shall we eat?”, and people joke that “随便” is the hardest dish — no menu has it.",
    },
  },
  {
    id: "li-hai",
    words: ["你", "真", "厉害", "！"],
    ru: "Ну ты даёшь, круто!",
    en: "You're amazing!",
    note: {
      ru: "Раньше 厉害 значило «суровый, жёсткий, страшный». Сейчас это главная разговорная похвала: «круто, впечатляет».",
      en: "厉害 used to mean “harsh, fierce, terrible”. Now it's the go-to casual praise: “awesome, impressive”.",
    },
  },
  {
    id: "wei-ni-hao",
    words: ["喂", "？", "你好", "！"],
    ru: "Алло? Привет!",
    en: "Hello? (on the phone)",
    pinyin: { 喂: "wéi" },
    note: {
      ru: "喂 по телефону обычно звучит вторым тоном — wéi, мягко, как «алло?». А wèi четвёртым тоном — резкое «эй!», им окликают.",
      en: "On the phone 喂 is usually said with the second tone — wéi, soft, like “hello?”. With the fourth tone, wèi, it's a sharp “hey!” to call someone.",
    },
  },
  {
    id: "chi-bao-le",
    words: ["我", "吃", "饱", "了", "！"],
    ru: "Я наелась!",
    en: "I'm full!",
    note: {
      ru: "Хозяева в Китае подкладывают гостю еду, пока тарелка не опустеет. 我吃饱了 — вежливый способ сказать «спасибо, больше не нужно».",
      en: "Chinese hosts keep adding food to a guest's plate while it's empty. 我吃饱了 is the polite way to say “thank you, I'm done”.",
    },
  },
  // Панда помнит ответы: фразы появляются только после нужного ответа (requires)
  {
    id: "remember-green",
    requires: { phraseId: "what-color", replyId: "green" },
    words: ["你", "喜欢", "绿色", "，", "我", "的", "花", "也", "是", "绿色", "的", "！"],
    ru: "Ты любишь зелёный — а мой цветок тоже зелёный!",
    en: "You like green — and my flower is green too!",
  },
  {
    id: "remember-red",
    requires: { phraseId: "what-color", replyId: "red" },
    words: ["你", "喜欢", "红色", "，", "我", "也", "喜欢", "红色", "的", "花", "！"],
    ru: "Ты любишь красный — я тоже люблю красные цветы!",
    en: "You like red — I like red flowers too!",
  },
  {
    id: "remember-study",
    requires: { phraseId: "what-today", replyId: "study" },
    words: ["你", "学习", "汉语", "，", "我", "很", "高兴", "！"],
    ru: "Ты учишь китайский — я так рада!",
    en: "You're learning Chinese — I'm so happy!",
  },
  // Ещё фразы с фактами и вопросами — черновик от Claude (23 октября)
  {
    id: "i-am-panda",
    words: ["我", "是", "熊猫", "！"],
    ru: "Я панда!",
    en: "I'm a panda!",
    note: {
      ru: "熊猫 дословно «медведь-кошка»: 熊 — медведь, 猫 — кошка. А на Тайване говорят наоборот — 猫熊, «кошка-медведь». Животное одно, слова переставлены.",
      en: "熊猫 literally means “bear-cat”: 熊 is bear, 猫 is cat. In Taiwan it's the other way round — 猫熊, “cat-bear”. Same animal, swapped words.",
      terms: {
        "猫熊": { pinyin: "māo xióng", ru: "панда (так говорят на Тайване), дословно «кошка-медведь»", en: "panda (in Taiwan), lit. “cat-bear”" },
      },
    },
  },
  {
    id: "zao",
    words: ["早", "！"],
    ru: "Доброе утро!",
    en: "Morning!",
    note: {
      ru: "早 — «рано». Это короткое 早上好 («доброе утро»): утром знакомым часто говорят просто 早！ Отвечают тем же словом.",
      en: "早 means “early”. It's short for 早上好 (“good morning”): in the morning people often just say 早！ and get the same word back.",
    },
  },
  {
    id: "tea-question",
    words: ["你", "喜欢", "喝", "茶", "吗", "？"],
    ru: "Ты любишь чай?",
    en: "Do you like tea?",
    pinyin: { 吗: "ma" },
    note: {
      ru: "Русское «чай» пришло от 茶 chá — через северные сухопутные торговые пути. А английское tea — от южного диалекта Фуцзяни, где говорят «te»: туда приходили морские корабли. Одно слово — два пути по миру.",
      en: "Russian «чай» comes from 茶 chá, via the northern overland trade routes. English “tea” comes from the southern Fujian dialect, where it's “te” — that's where the sea ships came. One word, two routes around the world.",
    },
    replies: [
      {
        id: "yes",
        words: ["我", "很", "喜欢", "茶", "！"],
        ru: "Я очень люблю чай!",
        en: "I really like tea!",
        reaction: {
          words: ["我们", "一起", "喝", "茶", "吧", "！"],
          ru: "Давай вместе попьём!",
          en: "Let's have some together!",
          pinyin: { 一起: "yì qǐ" },
        },
      },
      {
        id: "no",
        words: ["我", "不", "喜欢", "。"],
        ru: "Не люблю.",
        en: "I don't like it.",
        reaction: {
          words: ["那", "我们", "喝", "水", "吧", "！"],
          ru: "Тогда попьём воды!",
          en: "Then let's drink water!",
        },
      },
    ],
  },
  {
    id: "what-food",
    words: ["你", "喜欢", "吃", "什么", "？"],
    ru: "Что ты любишь есть?",
    en: "What do you like to eat?",
    note: {
      ru: "В Китае говорят «юг — рис, север — пшеница». На юге растёт рис, и его едят почти каждый день. На севере больше пшеницы — там любят лапшу, пельмени 饺子 и паровые булочки.",
      en: "In China they say “rice in the south, wheat in the north”. The south grows rice and eats it almost daily. The north grows more wheat — noodles, 饺子 dumplings and steamed buns.",
    },
    replies: [
      {
        id: "rice",
        words: ["我", "喜欢", "米饭", "。"],
        ru: "Я люблю рис.",
        en: "I like rice.",
        reaction: {
          words: ["南方", "人", "也", "喜欢", "米饭", "！"],
          ru: "На юге тоже любят рис!",
          en: "Southerners love rice too!",
        },
      },
      {
        id: "noodles",
        words: ["我", "喜欢", "面条", "。"],
        ru: "Я люблю лапшу.",
        en: "I like noodles.",
        reaction: {
          words: ["北方", "人", "也", "喜欢", "面条", "！"],
          ru: "На севере тоже любят лапшу!",
          en: "Northerners love noodles too!",
        },
      },
      {
        id: "dumplings",
        words: ["我", "喜欢", "饺子", "。"],
        ru: "Я люблю пельмени.",
        en: "I like dumplings.",
        reaction: {
          words: ["我", "也", "想", "吃", "饺子", "！"],
          ru: "Я тоже хочу пельменей!",
          en: "I want dumplings too!",
        },
      },
    ],
  },
  {
    id: "weather-today",
    words: ["今天", "天气", "怎么样", "？"],
    ru: "Какая сегодня погода?",
    en: "How's the weather today?",
    replies: [
      {
        id: "good",
        words: ["天气", "很", "好", "！"],
        ru: "Погода хорошая!",
        en: "The weather is nice!",
        reaction: {
          words: ["我们", "去", "公园", "吧", "！"],
          ru: "Пойдём в парк!",
          en: "Let's go to the park!",
        },
      },
      {
        id: "cold",
        words: ["很", "冷", "。"],
        ru: "Холодно.",
        en: "It's cold.",
        reaction: {
          words: ["多", "穿", "衣服", "！"],
          ru: "Оденься потеплее!",
          en: "Dress warmly!",
        },
      },
      {
        id: "rain",
        words: ["下雨", "了", "。"],
        ru: "Идёт дождь.",
        en: "It's raining.",
        reaction: {
          words: ["我们", "在", "家", "喝", "茶", "吧", "。"],
          ru: "Тогда посидим дома с чаем.",
          en: "Then let's stay home with tea.",
        },
      },
    ],
  },
  {
    id: "tired-question",
    words: ["你", "累", "吗", "？"],
    ru: "Ты {устал|устала}?",
    en: "Are you tired?",
    pinyin: { 吗: "ma" },
    replies: [
      {
        id: "no",
        words: ["不", "累", "！"],
        ru: "Не {устал|устала}!",
        en: "I'm not tired!",
        pinyin: { 不: "bú" },
        reaction: {
          words: ["太", "好", "了", "！", "加油", "！"],
          ru: "Здорово! Вперёд!",
          en: "Great! Keep going!",
        },
      },
      {
        id: "a-bit",
        words: ["有点儿", "累", "。"],
        ru: "Немного {устал|устала}.",
        en: "A little tired.",
        pinyin: { 有点儿: "yǒu diǎnr" },
        reaction: {
          words: ["我们", "休息", "一会儿", "吧", "。"],
          ru: "Давай немного отдохнём.",
          en: "Let's rest a bit.",
          pinyin: { 一会儿: "yí huìr" },
        },
      },
    ],
  },
  {
    id: "lucky-number",
    words: ["你", "喜欢", "什么", "数字", "？"],
    ru: "Какое число тебе нравится?",
    en: "What number do you like?",
    note: {
      ru: "У чисел в Китае есть «характер» — из-за похожих слов. 八 bā созвучно 发 «богатеть» — восьмёрка самая счастливая. 六 liù похоже на 流 «течь гладко». А 四 sì звучит почти как 死 «смерть» — в некоторых домах нет четвёртого этажа.",
      en: "Numbers in China have a “character” because of similar-sounding words. 八 bā sounds like 发 “to prosper” — eight is the luckiest. 六 liù is like 流 “to flow smoothly”. And 四 sì sounds almost like 死 “death” — some buildings skip the 4th floor.",
      terms: {
        "发": { pinyin: "fā", ru: "богатеть (как в 发财 fā cái)", en: "to get rich (as in 发财 fā cái)" },
      },
    },
    replies: [
      {
        id: "eight",
        words: ["我", "喜欢", "八", "。"],
        ru: "Мне нравится восемь.",
        en: "I like eight.",
        reaction: {
          words: ["八", "是", "好", "数字", "！"],
          ru: "Восьмёрка — счастливое число!",
          en: "Eight is a lucky number!",
        },
      },
      {
        id: "six",
        words: ["我", "喜欢", "六", "。"],
        ru: "Мне нравится шесть.",
        en: "I like six.",
        reaction: {
          words: ["六", "也", "很", "好", "！"],
          ru: "Шестёрка тоже хорошая!",
          en: "Six is good too!",
        },
      },
      {
        id: "four",
        words: ["我", "喜欢", "四", "。"],
        ru: "Мне нравится четыре.",
        en: "I like four.",
        reaction: {
          words: ["四", "？", "真", "的", "吗", "？"],
          ru: "Четыре? Правда?",
          en: "Four? Really?",
          pinyin: { 吗: "ma" },
        },
      },
    ],
  },
  {
    id: "dong-xi",
    words: ["你", "想", "买", "什么", "东西", "？"],
    ru: "Что ты хочешь купить?",
    en: "What do you want to buy?",
    note: {
      ru: "东西 — «восток-запад», а значит «вещь». Одна из версий: в старой столице Чанъань были два больших рынка, Восточный и Западный. «Пойти на восток и запад» значило пойти за покупками, а потом так стали называть сами покупки.",
      en: "东西 is “east-west”, and it means “thing”. One theory: the old capital Chang'an had two big markets, East and West. “Going east and west” meant going shopping — and then the purchases themselves got the name.",
    },
  },
  {
    id: "middle-kingdom",
    words: ["我", "想", "去", "中国", "！"],
    ru: "Хочу поехать в Китай!",
    en: "I want to go to China!",
    note: {
      ru: "中国 — «срединное государство»: 中 — середина, 国 — страна. Посмотри на 中: черта прямо через центр квадрата.",
      en: "中国 means “middle kingdom”: 中 is middle, 国 is country. Look at 中: a stroke right through the middle of a square.",
    },
  },
  {
    id: "chopsticks",
    words: ["我", "会", "用", "筷子", "！"],
    ru: "Я умею есть палочками!",
    en: "I can use chopsticks!",
    note: {
      ru: "Палочки нельзя втыкать в рис вертикально: так ставят благовония для умерших. Стучать ими по тарелке тоже не принято — так когда-то просили милостыню.",
      en: "Don't stick chopsticks upright in rice: that's how incense is offered to the dead. Tapping them on a bowl is also rude — it's how beggars once asked for food.",
    },
  },
  {
    id: "red-color",
    words: ["我", "喜欢", "红色", "的", "衣服", "。"],
    ru: "Мне нравится красная одежда.",
    en: "I like red clothes.",
    note: {
      ru: "Красный в Китае — цвет удачи и праздника. Невесты традиционно в красном, на Новый год дарят деньги в красных конвертах 红包.",
      en: "Red is the colour of luck and celebration in China. Brides traditionally wear red, and at New Year money is given in red envelopes, 红包.",
    },
  },
  {
    id: "white-flowers",
    words: ["白色", "的", "花", "很", "漂亮", "。"],
    ru: "Белые цветы очень красивые.",
    en: "White flowers are very pretty.",
    note: {
      ru: "Традиционно белый в Китае — цвет траура, поэтому белые цветы в подарок лучше не нести, особенно пожилым. Сейчас, правда, белое свадебное платье тоже стало обычным.",
      en: "Traditionally white is the colour of mourning in China, so white flowers aren't a good gift, especially for older people. These days white wedding dresses are common too, though.",
    },
  },
  {
    id: "gift",
    words: ["我", "想", "送", "你", "礼物", "！"],
    ru: "Хочу подарить тебе подарок!",
    en: "I want to give you a present!",
    note: {
      ru: "Часы в подарок — плохая примета: 送钟 «дарить часы» звучит как 送终 «провожать в последний путь». Груши тоже не дарят и не делят на двоих: 梨 lí созвучно 离 «расставаться».",
      en: "A clock is a bad gift: 送钟 “give a clock” sounds like 送终 “see someone off to death”. Pears aren't given or shared either: 梨 lí sounds like 离 “to part”.",
      terms: {
        "送钟": { pinyin: "sòng zhōng", ru: "дарить часы", en: "to give a clock" },
        "送终": { pinyin: "sòng zhōng", ru: "провожать в последний путь", en: "to see someone off to the grave" },
        "梨": { pinyin: "lí", ru: "груша", en: "pear" },
      },
    },
  },
  {
    id: "good-plus-verb",
    words: ["饺子", "很", "好吃", "！"],
    ru: "Пельмени очень вкусные!",
    en: "Dumplings are delicious!",
    note: {
      ru: "Удобная схема: 好 + глагол = «приятно это делать». 好吃 — вкусно (хорошо есть), 好看 — красиво (хорошо смотреть), 好听 — приятно звучит (хорошо слушать).",
      en: "A handy pattern: 好 + verb = “nice to do”. 好吃 — tasty (good to eat), 好看 — pretty (good to look at), 好听 — sounds nice (good to listen to).",
    },
  },
  {
    id: "hanzi-fun",
    words: ["汉字", "很", "有意思", "！"],
    ru: "Иероглифы такие интересные!",
    en: "Chinese characters are so interesting!",
    note: {
      ru: "Каллиграфов раньше учили на одном иероглифе — 永 «вечность». В нём есть почти все основные черты: точка, горизонтальная, вертикальная, крюк, откидные. Это называют «восемь правил 永».",
      en: "Calligraphers used to practise on one character — 永 “eternity”. It contains almost all the basic strokes: dot, horizontal, vertical, hook and sweeps. It's called “the eight principles of 永”.",
      terms: {
        "永": { pinyin: "yǒng", ru: "вечный; вечность", en: "eternal; forever" },
      },
    },
  },
  {
    id: "uncle-aunt",
    words: ["叔叔", "阿姨", "好", "！"],
    ru: "Здравствуйте, дядя и тётя!",
    en: "Hello, uncle and auntie!",
    note: {
      ru: "Дети и молодые часто зовут незнакомых взрослых 叔叔 «дядя» и 阿姨 «тётя» — продавщицу, соседа, водителя. Это вежливо и тепло, родство тут ни при чём.",
      en: "Kids and young people often call adult strangers 叔叔 “uncle” and 阿姨 “auntie” — a shop assistant, a neighbour, a driver. It's polite and warm; no family ties needed.",
    },
  },
  {
    id: "cat-meow",
    words: ["我", "喜欢", "猫", "！"],
    ru: "Я люблю кошек!",
    en: "I love cats!",
    note: {
      ru: "Прислушайся к 猫 māo — похоже на «мяу». Считается, что слово и появилось как подражание кошачьему голосу.",
      en: "Listen to 猫 māo — it sounds like “meow”. The word is thought to have started as an imitation of a cat's call.",
    },
  },
  {
    id: "good-night",
    words: ["晚安", "，", "做", "个", "好", "梦", "！"],
    ru: "Спокойной ночи, сладких снов!",
    en: "Good night, sweet dreams!",
    pinyin: { 个: "ge" },
  },
];

const byId = new Map(pandaPhrases.map((phrase) => [phrase.id, phrase]));

export function findPandaPhrase(id: string): PandaPhrase | undefined {
  return byId.get(id);
}
