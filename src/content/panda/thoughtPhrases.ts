// src/content/panda/thoughtPhrases.ts
//
// ФРАЗЫ ДНЯ — короткие фразы на китайском, одна в день: панда говорит её, когда
// пользователь тапает по облачку «…» (см. utils/panda/thoughts.ts). Прочитанные —
// в «Фразах дня» в профиле, поэтому каждая фраза должна быть интересна и потом.
// Фраза без вариантов ответа должна нести интересный факт или пояснение (note);
// просто реплик («я проголодалась», «сегодня хорошая погода») не пишем.
// Вопрос — знакомство с пользователем (цвет, еда, чай или кофе, фрукты, погода):
// в реакции панда делится своим вкусом («я больше всего люблю рис, но лапша тоже
// вкусная»), ответ она запоминает. Вопросов, на которые нечего ответить, кроме
// «да/нет» (пил ли воду, устал ли), не пишем.
//
// Слова не из словаря (имя панды, 仙人掌) — в глоссарии content/panda/glossary.ts.
// О панде: её зовут 竹竹 Жужа, она любит кактусы, зелёный цвет, рис, зелёный чай и
// бананы, не любит кофе и дождь — новые фразы не должны этому противоречить.
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
//   note   — необязательно: пояснение под фразой — факт, откуда фраза, когда её говорят,
//            чем отличается от похожих (ru, en). Показывается сразу под фразой.
//            Заголовок — по kind: "why" — «Почему так говорят?» (разговорные выражения),
//            "word" — «Откуда это слово?», без kind — «Интересный факт».
//            Иероглифы подряд в пояснении — одно выражение: тап переводит его целиком
//            (送钟 «дарить часы», а не 送 и 钟 по отдельности). Перевод берётся из
//            note.terms, затем из самой фразы/ответов, затем из словаря. Если выражения
//            нет в словаре или в пояснении у него особый смысл — допиши в terms:
//            terms: { "送钟": { pinyin: "sòng zhōng", ru: "дарить часы", en: "give a clock" } };
//   replies — необязательно, у вопросов: варианты ответа (тоже по-китайски, с переводом)
//            и реакция панды на каждый (reaction; mood: "surprised" — панда удивится,
//            иначе обрадуется). Ответ запоминается (pandaStore.answers);
//   when   — необязательно: когда фраза к месту. time — время суток (morning 5–11,
//            day 11–17, evening 17–22, night 22–5), season — время года (winter —
//            декабрь–февраль и т.д.). Задано несколько — подходит любое из них;
//            заданы оба поля — должны подойти оба. Без when фраза подходит всегда.
//            «Доброе утро» — { time: ["morning"] }, «пошёл снег» — { season: ["winter"] };
//   requires — необязательно: фраза появится, только если на вопрос phraseId ответили
//            replyId. Так панда «помнит» ответы: «ты любишь зелёный — мой цветок тоже».
//
// Фраза открывается по уровню HSK (utils/panda/phraseLevel): уровень фразы — HSK
// большей части её слов (вместе с ответами и реакциями); фразы HSK 1 и 2 открыты сразу,
// HSK 3 — когда пользователь на HSK 2, HSK 4 — на HSK 3.
// Проверка: node --no-warnings --experimental-strip-types scripts/check-panda-phrases.mjs
// (уровень каждой фразы, слова, которых нет в словаре, склейку).

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
  /** Что панда скажет в ответ. mood — как отзовётся в сцене: обрадуется (по умолчанию)
   *  или удивится. */
  reaction?: PhraseLine & { mood?: "happy" | "surprised" };
}

export type TimeOfDay = "morning" | "day" | "evening" | "night";
export type Season = "winter" | "spring" | "summer" | "autumn";

export interface PandaPhrase extends PhraseLine {
  id: string;
  /** Когда фраза к месту (см. шапку файла). */
  when?: { time?: TimeOfDay[]; season?: Season[] };
  note?: {
    ru: string;
    en: string;
    /** Заголовок пояснения: why — «Почему так говорят?» (разговорные выражения),
     *  word — «Откуда это слово?», без kind — «Интересный факт». */
    kind?: "why" | "word";
    /** Выражения из пояснения, которых нет в словаре или у которых тут особый смысл. */
    terms?: Record<string, { pinyin?: string; ru: string; en: string }>;
  };
  replies?: PhraseReply[];
  requires?: { phraseId: string; replyId: string };
}

// Фраза без вариантов ответа — не «реплика по ситуации» («завтра экзамен», «вот сто
// юаней»): у пользователя такой ситуации может не быть. Лучше — то, что панда правда
// может сказать: о себе, о вас двоих, «в магазине говорят…», «китайцы часто говорят…».
export const pandaPhrases: PandaPhrase[] = [
  // Панда представляется — первая фраза дня (FIRST_PHRASE_ID в utils/panda/thoughts)
  {
    id: "hello-name",
    words: ["你好", "！", "我", "是", "竹竹", "！"],
    ru: "Привет! Я Жужа!",
    en: "Hi! I'm Zhuzhu!",
    note: {
      kind: "word",
      ru: "竹竹 — моё имя. 竹 значит «бамбук». Китайцы часто дают малышам и питомцам ласковые имена из двух одинаковых слогов. По-русски зови меня Жужа!",
      en: "竹竹 is my name. 竹 means “bamboo”. Chinese often give children and pets cute names made of a doubled syllable. You can call me Zhuzhu!",
      terms: {
        "竹竹": { pinyin: "Zhúzhu", ru: "Жужа — имя панды", en: "Zhuzhu, the panda's name" },
        "竹": { pinyin: "zhú", ru: "бамбук", en: "bamboo" },
      },
    },
  },
  // Панда любит кактусы (первое растение в комнате — кактус, см. docs/panda-thoughts.md)
  {
    id: "cactus",
    words: ["我", "最", "喜欢", "仙人掌", "！", "你", "喜欢", "吗", "？"],
    ru: "Больше всего я люблю кактусы! А тебе они нравятся?",
    en: "I love cacti most of all! Do you like them?",
    pinyin: { 吗: "ma" },
    note: {
      kind: "word",
      ru: "仙人掌 дословно «ладонь небожителя»: 仙人 — бессмертный небожитель, 掌 — ладонь. Плоские стебли кактуса-опунции и правда похожи на ладони.",
      en: "仙人掌 literally means “palm of an immortal”: 仙人 is an immortal, 掌 is a palm. The flat pads of the prickly pear cactus really do look like palms.",
      terms: {
        "仙人": { pinyin: "xiān rén", ru: "бессмертный, небожитель", en: "immortal, celestial being" },
        "掌": { pinyin: "zhǎng", ru: "ладонь", en: "palm (of the hand)" },
      },
    },
    replies: [
      {
        id: "me-too",
        words: ["我", "也", "喜欢", "！"],
        ru: "Мне тоже нравятся!",
        en: "I like them too!",
        reaction: {
          words: ["那", "我们", "一起", "养", "仙人掌", "吧", "！"],
          ru: "Тогда давай вместе растить кактусы!",
          en: "Then let's grow cacti together!",
          pinyin: { 一起: "yì qǐ" },
        },
      },
      {
        id: "flowers",
        words: ["我", "更", "喜欢", "花", "。"],
        ru: "Мне больше нравятся цветы.",
        en: "I like flowers more.",
        reaction: {
          words: ["仙人掌", "也", "会", "开花", "！"],
          ru: "Кактусы тоже цветут!",
          en: "Cacti bloom too!",
        },
      },
      {
        id: "why",
        words: ["为什么", "？"],
        ru: "Почему?",
        en: "Why?",
        reaction: {
          words: ["仙人掌", "不用", "很", "多", "水", "！"],
          ru: "Кактусу не нужно много воды!",
          en: "A cactus doesn't need much water!",
        },
      },
    ],
  },
  {
    id: "weather-today",
    words: ["今天", "天气", "怎么样", "？"],
    ru: "Какая сегодня погода?",
    en: "How's the weather today?",
    note: {
      kind: "word",
      ru: "天气 дословно «небесный воздух»: 天 — небо, 气 — воздух, пар. Тот же 气 есть в 生气 — «сердиться», дословно «рождать пар».",
      en: "天气 literally means “sky air”: 天 is sky, 气 is air or vapour. The same 气 is in 生气, “to get angry” — literally “to produce steam”.",
    },
    replies: [
      {
        id: "sunny",
        words: ["今天", "是", "晴天", "！"],
        ru: "Сегодня солнечно!",
        en: "It's sunny today!",
        reaction: {
          words: ["今天", "的", "太阳", "真", "好", "！"],
          ru: "Какое сегодня хорошее солнышко!",
          en: "The sun is so nice today!",
        },
      },
      {
        id: "rain",
        words: ["下雨", "了", "。"],
        ru: "Идёт дождь.",
        en: "It's raining.",
        reaction: {
          words: ["我", "不", "喜欢", "下雨", "……", "我们", "在", "家", "喝", "茶", "吧", "。"],
          ru: "Не люблю дождь… Давай посидим дома с чаем.",
          en: "I don't like rain… Let's stay home with some tea.",
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
    ],
  },
  {
    id: "dumplings",
    words: ["过年", "吃", "饺子", "！"],
    ru: "На Новый год едят пельмени!",
    en: "Dumplings for the New Year!",
    note: {
      ru: "На севере Китая пельмени 饺子 лепят всей семьёй в канун Нового года по лунному календарю. По форме они похожи на старинный слиток серебра 元宝, поэтому пельмени — к богатству. Иногда в один прячут монетку: кому попадётся, тому весь год везёт.",
      en: "In northern China, families make 饺子 dumplings together on Lunar New Year's Eve. They're shaped like an old silver ingot, 元宝, so dumplings stand for wealth. Sometimes a coin is hidden in one — whoever finds it is lucky all year.",
      terms: {
        "元宝": { pinyin: "yuán bǎo", ru: "старинный слиток серебра или золота", en: "old silver or gold ingot" },
      },
    },
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
  // Разговорные фразы с пояснением «Почему так говорят?» (note.kind: "why")
  {
    id: "chi-le-ma",
    words: ["你", "吃", "了", "吗", "？"],
    ru: "Привет! (дословно: «Ты {поел|поела}?»)",
    en: "Hi! (literally: “Have you eaten?”)",
    pinyin: { 吗: "ma" },
    note: {
      kind: "why",
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
      kind: "why",
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
      kind: "why",
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
      kind: "why",
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
      kind: "why",
      ru: "加油 дословно «добавь масла», как заправить машину. Так подбадривают всех: спортсменов, друзей перед экзаменом, себя.",
      en: "加油 literally means “add oil”, like refuelling a car. It's how you cheer on anyone: athletes, friends before an exam, yourself.",
    },
  },
  {
    id: "xin-ku-le",
    when: { time: ["evening"] },
    words: ["今天", "辛苦了", "！"],
    ru: "Спасибо за сегодняшние труды!",
    en: "Thanks for your hard work today!",
    note: {
      kind: "why",
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
      kind: "why",
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
      kind: "why",
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
      kind: "why",
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
      kind: "why",
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
      kind: "why",
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
      kind: "why",
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
      kind: "why",
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
      kind: "why",
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
      kind: "why",
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
      kind: "why",
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
      kind: "why",
      ru: "Хозяева в Китае подкладывают гостю еду, пока тарелка не опустеет. 我吃饱了 — вежливый способ сказать «спасибо, больше не нужно».",
      en: "Chinese hosts keep adding food to a guest's plate while it's empty. 我吃饱了 is the polite way to say “thank you, I'm done”.",
    },
  },
  // Панда помнит ответы: фразы появляются только после нужного ответа (requires)
  {
    id: "remember-green",
    requires: { phraseId: "what-color", replyId: "green" },
    words: ["你", "喜欢", "绿色", "，", "我", "的", "仙人掌", "也", "是", "绿色", "的", "！"],
    ru: "Ты любишь зелёный — а мой кактус тоже зелёный!",
    en: "You like green — and my cactus is green too!",
  },
  {
    id: "remember-red",
    requires: { phraseId: "what-color", replyId: "red" },
    words: ["你", "喜欢", "红色", "，", "我", "也", "喜欢", "红色", "的", "花", "！"],
    ru: "Ты любишь красный — я тоже люблю красные цветы!",
    en: "You like red — I like red flowers too!",
  },
  // Ещё фразы с фактами и вопросами — черновик от Claude (23 октября)
  {
    id: "i-am-panda",
    words: ["我", "是", "熊猫", "！"],
    ru: "Я панда!",
    en: "I'm a panda!",
    note: {
      kind: "word",
      ru: "熊猫 дословно «медведь-кошка»: 熊 — медведь, 猫 — кошка. А на Тайване говорят наоборот — 猫熊, «кошка-медведь». Животное одно, слова переставлены.",
      en: "熊猫 literally means “bear-cat”: 熊 is bear, 猫 is cat. In Taiwan it's the other way round — 猫熊, “cat-bear”. Same animal, swapped words.",
      terms: {
        "猫熊": { pinyin: "māo xióng", ru: "панда (так говорят на Тайване), дословно «кошка-медведь»", en: "panda (in Taiwan), lit. “cat-bear”" },
      },
    },
  },
  {
    id: "zao",
    when: { time: ["morning"] },
    words: ["早", "！"],
    ru: "Доброе утро!",
    en: "Morning!",
    note: {
      kind: "why",
      ru: "早 — «рано». Это короткое 早上好 («доброе утро»): утром знакомым часто говорят просто 早！ Отвечают тем же словом.",
      en: "早 means “early”. It's short for 早上好 (“good morning”): in the morning people often just say 早！ and get the same word back.",
    },
  },
  {
    id: "tea-or-coffee",
    words: ["你", "喜欢", "喝", "茶", "还是", "咖啡", "？"],
    ru: "Ты больше любишь чай или кофе?",
    en: "Do you prefer tea or coffee?",
    note: {
      kind: "word",
      ru: "Русское «чай» пришло от 茶 chá — через северные сухопутные торговые пути. А английское tea — от южного диалекта Фуцзяни, где говорят «te»: туда приходили морские корабли. И ещё: 红茶, «красный чай», — это то, что мы называем чёрным. Китайцы называют чай по цвету настоя.",
      en: "Russian «чай» comes from 茶 chá, via the northern overland trade routes. English “tea” comes from the southern Fujian dialect, where it's “te” — that's where the sea ships came. Also: 红茶, “red tea”, is what we call black tea. Chinese name tea by the colour of the brew.",
    },
    replies: [
      {
        id: "green-tea",
        words: ["我", "喜欢", "绿茶", "。"],
        ru: "Я люблю зелёный чай.",
        en: "I like green tea.",
        reaction: {
          words: ["我", "也", "最", "喜欢", "绿茶", "！"],
          ru: "Я тоже больше всего люблю зелёный!",
          en: "Green tea is my favourite too!",
        },
      },
      {
        id: "black-tea",
        words: ["我", "喜欢", "红茶", "。"],
        ru: "Я люблю чёрный чай.",
        en: "I like black tea.",
        reaction: {
          words: ["红茶", "也", "很", "不错", "！"],
          ru: "Чёрный тоже очень хорош!",
          en: "Black tea is great too!",
        },
      },
      {
        id: "coffee",
        words: ["我", "喜欢", "咖啡", "。"],
        ru: "Я люблю кофе.",
        en: "I like coffee.",
        reaction: {
          words: ["咖啡", "？", "我", "不", "喜欢", "咖啡", "，", "太", "苦", "了", "！"],
          ru: "Кофе? Я не люблю кофе, он слишком горький!",
          en: "Coffee? I don't like coffee, it's too bitter!",
          mood: "surprised",
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
          words: ["我", "也", "最", "喜欢", "米饭", "！"],
          ru: "Я тоже больше всего люблю рис!",
          en: "Rice is my favourite too!",
        },
      },
      {
        id: "noodles",
        words: ["我", "喜欢", "面条", "。"],
        ru: "Я люблю лапшу.",
        en: "I like noodles.",
        reaction: {
          words: ["我", "最", "喜欢", "米饭", "，", "不过", "面条", "也", "很", "好吃", "！"],
          ru: "Я больше всего люблю рис, но лапша тоже очень вкусная!",
          en: "I like rice best, but noodles are very tasty too!",
        },
      },
      {
        id: "dumplings",
        words: ["我", "喜欢", "饺子", "。"],
        ru: "Я люблю пельмени.",
        en: "I like dumplings.",
        reaction: {
          words: ["我", "最", "喜欢", "米饭", "，", "不过", "饺子", "也", "很", "好吃", "！"],
          ru: "Я больше всего люблю рис, но пельмени тоже очень вкусные!",
          en: "I like rice best, but dumplings are very tasty too!",
        },
      },
    ],
  },
  {
    id: "what-sweet",
    words: ["你", "喜欢", "什么", "甜", "的", "东西", "？"],
    ru: "Какие сладости ты любишь?",
    en: "What sweets do you like?",
    pinyin: { 东西: "dōng xi" },
    note: {
      kind: "word",
      ru: "甜 — «сладкий», и не только про еду. 嘴甜, «сладкий рот», говорят о том, кто умеет сказать приятное.",
      en: "甜 means “sweet”, and not only about food. 嘴甜, “sweet mouth”, describes someone who knows how to say nice things.",
      terms: {
        "嘴甜": { pinyin: "zuǐ tián", ru: "«сладкий рот» — о том, кто говорит приятное", en: "“sweet mouth” — someone who says nice things" },
      },
    },
    replies: [
      {
        id: "cake",
        words: ["我", "喜欢", "蛋糕", "。"],
        ru: "Я люблю торт.",
        en: "I like cake.",
        reaction: {
          words: ["蛋糕", "很", "甜", "，", "我", "很", "喜欢", "！"],
          ru: "Торт сладкий, обожаю!",
          en: "Cake is sweet, I love it!",
        },
      },
      {
        id: "chocolate",
        words: ["我", "喜欢", "巧克力", "。"],
        ru: "Я люблю шоколад.",
        en: "I like chocolate.",
        reaction: {
          words: ["巧克力", "？", "我", "也", "喜欢", "！"],
          ru: "Шоколад? Я тоже люблю!",
          en: "Chocolate? I like it too!",
        },
      },
      {
        id: "mooncake",
        words: ["我", "喜欢", "月饼", "。"],
        ru: "Я люблю лунные пряники.",
        en: "I like mooncakes.",
        reaction: {
          words: ["月饼", "很", "甜", "，", "也", "很", "好看", "！"],
          ru: "Лунные пряники сладкие и такие красивые!",
          en: "Mooncakes are sweet and so pretty!",
        },
      },
    ],
  },
  {
    id: "what-fruit",
    words: ["你", "喜欢", "什么", "水果", "？"],
    ru: "Какие фрукты ты любишь?",
    en: "What fruit do you like?",
    note: {
      ru: "苹果 píngguǒ звучит похоже на 平安 píng'ān — «мир, благополучие». Поэтому в сочельник, по-китайски 平安夜 — «ночь мира», — друзья дарят друг другу яблоки в красивой упаковке.",
      en: "苹果 píngguǒ sounds like 平安 píng'ān, “peace, safety”. So on Christmas Eve — 平安夜, “peaceful night” in Chinese — friends give each other nicely wrapped apples.",
      terms: {
        "平安": { pinyin: "píng ān", ru: "мир, благополучие", en: "peace, safety" },
        "平安夜": { pinyin: "píng ān yè", ru: "сочельник, «ночь мира»", en: "Christmas Eve, “peaceful night”" },
      },
    },
    replies: [
      {
        id: "apple",
        words: ["我", "喜欢", "苹果", "。"],
        ru: "Я люблю яблоки.",
        en: "I like apples.",
        reaction: {
          words: ["苹果", "好吃", "，", "香蕉", "也", "好吃", "！"],
          ru: "Яблоки вкусные, и бананы тоже!",
          en: "Apples are tasty, and bananas too!",
        },
      },
      {
        id: "banana",
        words: ["我", "喜欢", "香蕉", "。"],
        ru: "Я люблю бананы.",
        en: "I like bananas.",
        reaction: {
          words: ["我", "也", "最", "喜欢", "香蕉", "！"],
          ru: "Я тоже больше всего люблю бананы!",
          en: "Bananas are my favourite too!",
        },
      },
      {
        id: "watermelon",
        words: ["我", "喜欢", "西瓜", "。"],
        ru: "Я люблю арбуз.",
        en: "I like watermelon.",
        reaction: {
          words: ["西瓜", "很", "甜", "！"],
          ru: "Арбуз такой сладкий!",
          en: "Watermelon is so sweet!",
        },
      },
    ],
  },
  {
    id: "what-hobby",
    words: ["你", "喜欢", "做", "什么", "？"],
    ru: "Чем ты любишь заниматься?",
    en: "What do you like to do?",
    note: {
      ru: "В китайских парках с утра людно: пожилые занимаются тайцзицюанем 太极拳, а по вечерам на площадях танцуют 广场舞 — «танцы на площади» — под музыку из колонки.",
      en: "Chinese parks are busy in the morning: older people practise tai chi, 太极拳, and in the evening they do 广场舞, “square dancing”, to music from a speaker.",
      terms: {
        "太极拳": { pinyin: "tài jí quán", ru: "тайцзицюань (тайчи)", en: "tai chi" },
        "广场舞": { pinyin: "guǎng chǎng wǔ", ru: "«танцы на площади»", en: "“square dancing”" },
      },
    },
    replies: [
      {
        id: "read",
        words: ["我", "喜欢", "看书", "。"],
        ru: "Я люблю читать.",
        en: "I like reading.",
        reaction: {
          words: ["我", "也", "喜欢", "看书", "！"],
          ru: "Я тоже люблю читать!",
          en: "I like reading too!",
        },
      },
      {
        id: "sport",
        words: ["我", "喜欢", "运动", "。"],
        ru: "Я люблю спорт.",
        en: "I like sports.",
        reaction: {
          words: ["我们", "一起", "去", "跑步", "吧", "！"],
          ru: "Давай вместе пойдём на пробежку!",
          en: "Let's go for a run together!",
          pinyin: { 一起: "yì qǐ" },
        },
      },
      {
        id: "walk",
        words: ["我", "喜欢", "散步", "。"],
        ru: "Я люблю гулять.",
        en: "I like going for walks.",
        reaction: {
          words: ["我", "也", "想", "去", "公园", "散步", "！"],
          ru: "Я тоже хочу погулять в парке!",
          en: "I want to walk in the park too!",
        },
      },
      {
        id: "chinese",
        words: ["我", "喜欢", "学习", "汉语", "。"],
        ru: "Я люблю учить китайский.",
        en: "I like learning Chinese.",
        reaction: {
          words: ["谢谢", "你", "和", "我", "一起", "学习", "！"],
          ru: "Спасибо, что учишься вместе со мной!",
          en: "Thank you for studying with me!",
          pinyin: { 一起: "yì qǐ" },
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
          mood: "surprised",
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
      kind: "word",
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
      kind: "word",
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
      kind: "why",
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
      kind: "word",
      ru: "Прислушайся к 猫 māo — похоже на «мяу». Считается, что слово и появилось как подражание кошачьему голосу.",
      en: "Listen to 猫 māo — it sounds like “meow”. The word is thought to have started as an imitation of a cat's call.",
    },
  },
  {
    id: "good-night",
    when: { time: ["night"] },
    words: ["晚安", "，", "做", "个", "好", "梦", "！"],
    ru: "Спокойной ночи, сладких снов!",
    en: "Good night, sweet dreams!",
    pinyin: { 个: "ge" },
  },
  // ── Фразы от 25 октября (черновик — проверить) ───────────────────────────────
  {
    id: "dian-ying",
    words: ["我们", "一起", "看", "电影", "吧", "！"],
    ru: "Давай вместе посмотрим кино!",
    en: "Let's watch a movie together!",
    pinyin: { 一起: "yì qǐ" },
    note: {
      kind: "word",
      ru: "电影 — дословно «электрическая тень»: 电 — электричество, 影 — тень. Так же устроены и другие новые вещи: 电脑 «электрический мозг» — компьютер, 电视 «электрическое зрение» — телевизор.",
      en: "电影 literally means “electric shadow”: 电 is electricity, 影 is shadow. Other modern things work the same way: 电脑 “electric brain” is a computer, 电视 “electric seeing” is a TV.",
      terms: {
        "影": { pinyin: "yǐng", ru: "тень", en: "shadow" },
        "电视": { pinyin: "diàn shì", ru: "телевизор", en: "television" },
      },
    },
  },
  {
    id: "shou-ji",
    words: ["我", "的", "手机", "呢", "？"],
    ru: "А где мой телефон?",
    en: "Where's my phone?",
    note: {
      kind: "word",
      ru: "手机 — «ручная машинка»: 手 — рука, 机 — машина. А обычный телефон — 电话, «электрическая речь». 呢 в конце — короткий вопрос «а где же…?».",
      en: "手机 is a “hand machine”: 手 is hand, 机 is machine. A landline is 电话, “electric speech”. 呢 at the end makes a short question: “where's…?”",
      terms: {
        "机": { pinyin: "jī", ru: "машина, механизм", en: "machine" },
      },
    },
  },
  {
    id: "huo-che",
    words: ["我", "想", "坐", "火车", "去", "中国", "。"],
    ru: "Хочу поехать в Китай на поезде.",
    en: "I want to go to China by train.",
    note: {
      kind: "word",
      ru: "火车 — «огненная повозка»: первые поезда тянули паровозы с топкой. А 汽车 — «паровая повозка», так назвали автомобиль. Поезд давно не на огне, а название осталось.",
      en: "火车 is a “fire cart”: the first trains were pulled by steam engines with a firebox. 汽车, a “steam cart”, became the word for car. Trains no longer run on fire, but the name stuck.",
    },
  },
  {
    id: "sheng-ri",
    words: ["生日", "快乐", "！"],
    ru: "С днём рождения!",
    en: "Happy birthday!",
    note: {
      ru: "На день рождения в Китае едят 长寿面 — «лапшу долголетия». Чем длиннее лапша, тем длиннее жизнь, поэтому её не режут и стараются не перекусывать.",
      en: "On birthdays people in China eat 长寿面, “longevity noodles”. The longer the noodles, the longer the life — so they're never cut, and you try not to bite them through.",
      terms: {
        "长寿面": { pinyin: "cháng shòu miàn", ru: "лапша долголетия", en: "longevity noodles" },
      },
    },
  },
  {
    id: "xin-nian",
    when: { season: ["winter"] },
    words: ["新年", "快乐", "！"],
    ru: "С Новым годом!",
    en: "Happy New Year!",
    note: {
      ru: "На Новый год на дверь вешают иероглиф 福 «счастье» вверх ногами. «Перевёрнутый» — 倒 dào, а это звучит как 到 dào «пришло». Получается 福到了 — «счастье пришло».",
      en: "At New Year the character 福 “good fortune” is hung upside down on the door. “Upside down” is 倒 dào, which sounds like 到 dào “has arrived” — so it says 福到了, “fortune has arrived”.",
      terms: {
        "福": { pinyin: "fú", ru: "счастье, удача", en: "good fortune" },
        "倒": { pinyin: "dào", ru: "перевёрнутый", en: "upside down" },
        "到": { pinyin: "dào", ru: "прибыть, прийти", en: "to arrive" },
        "福到了": { pinyin: "fú dào le", ru: "счастье пришло", en: "fortune has arrived" },
      },
    },
  },
  {
    id: "da-jia",
    words: ["大家", "好", "！"],
    ru: "Всем привет!",
    en: "Hi, everyone!",
    note: {
      kind: "word",
      ru: "大家 — «все», а дословно «большая семья»: 大 — большой, 家 — семья, дом. Так здороваются с группой — учитель с классом, ведущий со зрителями.",
      en: "大家 means “everyone”, literally “big family”: 大 is big, 家 is family, home. It's how you greet a group — a teacher with a class, a host with an audience.",
    },
  },
  {
    id: "you-peng",
    words: ["有", "朋友", "来", "，", "我", "很", "高兴", "！"],
    ru: "Когда приходят друзья, я так рада!",
    en: "When friends come over, I'm so happy!",
    note: {
      ru: "Это почти цитата из Конфуция: 有朋自远方来，不亦乐乎 — «Разве не радостно, когда друг приезжает издалека?». Её до сих пор говорят, встречая гостей.",
      en: "This is almost a quote from Confucius: 有朋自远方来，不亦乐乎 — “Isn't it a joy when a friend comes from afar?”. People still say it when welcoming guests.",
      terms: {
        "有朋自远方来": {
          pinyin: "yǒu péng zì yuǎn fāng lái",
          ru: "друг приезжает издалека",
          en: "a friend comes from afar",
        },
        "不亦乐乎": { pinyin: "bú yì lè hū", ru: "разве не радостно?", en: "isn't it a joy?" },
      },
    },
  },
  {
    id: "he-cha",
    words: ["我们", "一起", "喝", "茶", "吧", "！"],
    ru: "Давай вместе выпьем чаю!",
    en: "Let's drink some tea together!",
    pinyin: { 一起: "yì qǐ" },
    note: {
      kind: "word",
      ru: "Русское «чай» пришло от 茶 chá — по суше, с караванами. А английское tea — от «тэ», так 茶 звучит в провинции Фуцзянь, откуда чай везли морем. Оба слова — один и тот же иероглиф!",
      en: "Russian “chai” comes from 茶 chá, carried overland by caravans. English “tea” comes from “te”, how 茶 sounds in Fujian, where tea was shipped by sea. Both words are the same character!",
    },
  },
  {
    id: "xiu-xi",
    words: ["我", "想", "休息", "。"],
    ru: "Хочу отдохнуть.",
    en: "I want to rest.",
    note: {
      kind: "word",
      ru: "Посмотри на 休: слева человек 亻, справа дерево 木. Человек прислонился к дереву — отдыхает.",
      en: "Look at 休: a person 亻 on the left, a tree 木 on the right. A person leaning against a tree — resting.",
      terms: {
        "休": { pinyin: "xiū", ru: "отдыхать", en: "to rest" },
        "亻": { pinyin: "rén", ru: "человек (ключ)", en: "person (radical)" },
        "木": { pinyin: "mù", ru: "дерево", en: "tree" },
      },
    },
  },
  {
    id: "ming-tian",
    words: ["明天", "见", "！"],
    ru: "До завтра!",
    en: "See you tomorrow!",
    note: {
      kind: "word",
      ru: "明 — солнце 日 и луна 月 вместе, значит «светлый, ясный». А 明天 — «наступающий день», завтра.",
      en: "明 is the sun 日 and the moon 月 together, meaning “bright, clear”. And 明天 is “the coming day” — tomorrow.",
      terms: {
        "明": { pinyin: "míng", ru: "светлый, ясный", en: "bright, clear" },
        "日": { pinyin: "rì", ru: "солнце, день", en: "sun, day" },
        "月": { pinyin: "yuè", ru: "луна, месяц", en: "moon, month" },
      },
    },
  },
  {
    id: "liang-ge",
    words: ["我", "有", "两", "个", "朋友", "。"],
    ru: "У меня два друга.",
    en: "I have two friends.",
    pinyin: { 个: "ge" },
    note: {
      kind: "why",
      ru: "Цифра «два» — 二 èr, но когда считают предметы, говорят 两 liǎng: 两个朋友, а не 二个. 二 остаётся для счёта и чисел: 一、二、三, 十二.",
      en: "The digit “two” is 二 èr, but when counting things you say 两 liǎng: 两个朋友, not 二个. 二 stays for counting and numbers: 一、二、三, 十二.",
      terms: {
        "两个朋友": { pinyin: "liǎng ge péng you", ru: "два друга", en: "two friends" },
        "二个": { pinyin: "èr ge", ru: "(так не говорят)", en: "(not used)" },
        "十二": { pinyin: "shí èr", ru: "двенадцать", en: "twelve" },
      },
    },
  },
  {
    id: "wei-phone",
    words: ["喂", "？", "你好", "！"],
    ru: "Алло? Здравствуйте!",
    en: "Hello? (on the phone)",
    pinyin: { 喂: "wéi" },
    note: {
      kind: "why",
      ru: "По телефону 喂 произносят мягко, вторым тоном — wéi. А резкое wèi четвёртым тоном — это «эй!», так окликают человека.",
      en: "On the phone 喂 is said softly, with the second tone — wéi. A sharp fourth-tone wèi is “hey!”, used to call out to someone.",
    },
  },
  {
    id: "cat-or-dog",
    words: ["你", "喜欢", "猫", "还是", "狗", "？"],
    ru: "Ты любишь кошек или собак?",
    en: "Do you like cats or dogs?",
    note: {
      kind: "why",
      ru: "还是 — «или» в вопросе с выбором. В обычном предложении «или» — другое слово, 或者: 喝茶或者咖啡都可以 — «можно чай или кофе».",
      en: "还是 is “or” in a question with a choice. In a plain statement “or” is a different word, 或者: 喝茶或者咖啡都可以 — “tea or coffee are both fine”.",
      terms: {
        "或者": { pinyin: "huò zhě", ru: "или (в утверждении)", en: "or (in statements)" },
        "喝茶或者咖啡都可以": {
          pinyin: "hē chá huò zhě kā fēi dōu kě yǐ",
          ru: "можно чай или кофе",
          en: "tea or coffee are both fine",
        },
      },
    },
    replies: [
      {
        id: "cat",
        words: ["我", "喜欢", "猫", "。"],
        ru: "Я люблю кошек.",
        en: "I like cats.",
        reaction: {
          words: ["我", "也", "喜欢", "猫", "！"],
          ru: "Я тоже люблю кошек!",
          en: "I like cats too!",
        },
      },
      {
        id: "dog",
        words: ["我", "喜欢", "狗", "。"],
        ru: "Я люблю собак.",
        en: "I like dogs.",
        reaction: {
          words: ["狗", "很", "可爱", "！"],
          ru: "Собаки такие милые!",
          en: "Dogs are so cute!",
        },
      },
      {
        id: "both",
        words: ["我", "都", "喜欢", "！"],
        ru: "Я люблю и тех, и других!",
        en: "I like both!",
        reaction: {
          words: ["我", "也", "是", "！"],
          ru: "Я тоже!",
          en: "Me too!",
        },
      },
    ],
  },
  {
    id: "what-season",
    words: ["你", "最", "喜欢", "什么", "季节", "？"],
    ru: "Какое время года ты любишь больше всего?",
    en: "What's your favourite season?",
    replies: [
      {
        id: "spring",
        words: ["春天", "。"],
        ru: "Весну.",
        en: "Spring.",
        reaction: {
          words: ["春天", "很", "漂亮", "，", "花", "很", "多", "！"],
          ru: "Весной так красиво, столько цветов!",
          en: "Spring is so pretty, so many flowers!",
        },
      },
      {
        id: "summer",
        words: ["夏天", "。"],
        ru: "Лето.",
        en: "Summer.",
        reaction: {
          words: ["夏天", "太", "热", "了", "，", "熊猫", "怕", "热", "！"],
          ru: "Летом слишком жарко, панды боятся жары!",
          en: "Summer is too hot — pandas don't like the heat!",
          mood: "surprised",
        },
      },
      {
        id: "autumn",
        words: ["秋天", "。"],
        ru: "Осень.",
        en: "Autumn.",
        reaction: {
          words: ["秋天", "不", "冷", "也", "不", "热", "，", "真", "好", "！"],
          ru: "Осенью ни холодно, ни жарко — здорово!",
          en: "Autumn is neither cold nor hot — lovely!",
        },
      },
      {
        id: "winter",
        words: ["冬天", "。"],
        ru: "Зиму.",
        en: "Winter.",
        reaction: {
          words: ["我", "也", "最", "喜欢", "冬天", "！", "熊猫", "不", "怕", "冷", "。"],
          ru: "Я тоже больше всего люблю зиму! Панды не боятся холода.",
          en: "Winter is my favourite too! Pandas aren't afraid of the cold.",
        },
      },
    ],
  },
  // ── Фразы из присланного списка (25 октября, отобраны и поправлены — проверить) ──
  {
    id: "wan-shang-hao",
    when: { time: ["evening"] },
    words: ["晚上", "好", "！"],
    ru: "Добрый вечер!",
    en: "Good evening!",
    note: {
      kind: "why",
      ru: "晚上好 — приветствие после 18 часов. А 晚安 — это пожелание перед сном: им не здороваются, а говорят, когда ложатся спать.",
      en: "晚上好 is a greeting after 6 pm. 晚安 is a bedtime wish — you say it when going to sleep, not as a hello.",
    },
  },
  {
    id: "xia-wu-hao",
    when: { time: ["day"] },
    words: ["下午", "好", "！"],
    ru: "Добрый день!",
    en: "Good afternoon!",
    note: {
      kind: "why",
      ru: "下午 — время после обеда. С 11 до 13 часов формально 中午 («полдень») и есть слово 中午好, но так здороваются редко — чаще просто 你好.",
      en: "下午 is after lunch. 11 am to 1 pm is 中午 (midday) and 中午好 exists, but it's rarely used — people just say 你好.",
      terms: {
        "中午好": { pinyin: "zhōng wǔ hǎo", ru: "добрый день (в полдень)", en: "good noon" },
      },
    },
  },
  {
    id: "shui-jiao-le",
    when: { time: ["night"] },
    words: ["我", "要", "睡觉", "了", "，", "晚安", "！"],
    ru: "Я спать, спокойной ночи!",
    en: "I'm going to bed, good night!",
    note: {
      ru: "要 + глагол + 了 рассказывает о плане: 我要走了 — «я пошёл/пошла». А 晚安 — «тихая ночь»: 晚 — поздно, 安 — спокойствие.",
      en: "要 + verb + 了 states a plan: 我要走了 — “I'm leaving”. 晚安 is “quiet night”: 晚 is late, 安 is peace.",
      terms: {
        "我要走了": { pinyin: "wǒ yào zǒu le", ru: "я пошёл/пошла", en: "I'm leaving" },
        "安": { pinyin: "ān", ru: "спокойствие", en: "peace, calm" },
      },
    },
  },
  {
    id: "tian-qi-zhen-hao",
    words: ["今天", "天气", "真", "好", "！"],
    ru: "Какая сегодня хорошая погода!",
    en: "The weather is so nice today!",
    note: {
      ru: "真 усиливает похвалу: 真好 — «правда хорошо», 真漂亮 — «очень красиво», 真好吃 — «очень вкусно». Отрицание тоже усиливает: 真难 — «ужасно трудно».",
      en: "真 strengthens praise: 真好 “really good”, 真漂亮 “really pretty”, 真好吃 “really tasty”. With negation it also intensifies: 真难 “really hard”.",
      terms: {
        "真好": { pinyin: "zhēn hǎo", ru: "правда хорошо", en: "really good" },
        "真漂亮": { pinyin: "zhēn piào liang", ru: "очень красиво", en: "really pretty" },
        "真好吃": { pinyin: "zhēn hǎo chī", ru: "очень вкусно", en: "really tasty" },
        "真难": { pinyin: "zhēn nán", ru: "ужасно трудно", en: "really hard" },
      },
    },
  },
  {
    id: "xia-xue-le",
    when: { season: ["winter"] },
    words: ["下雪", "了", "！"],
    ru: "Пошёл снег!",
    en: "It's snowing!",
    note: {
      ru: "下雪 дословно «падает снег»: 下 — «идти (об осадках)», 雪 — снег. Поэтому «дождь идёт» — 下雨, а «дождь закончился» — 雨停了.",
      en: "下雪 is literally “snow falls”: 下 is the verb for precipitation, 雪 is snow. So “it rains” is 下雨 and “the rain stopped” is 雨停了.",
      terms: {
        "雨停了": { pinyin: "yǔ tíng le", ru: "дождь кончился", en: "the rain stopped" },
      },
    },
  },
  {
    id: "you-xia-yu",
    words: ["又", "下雨", "了", "……"],
    ru: "Опять дождь……",
    en: "It's raining again...",
    note: {
      ru: "又 — «снова, опять». Панда не любит дождь, а вот китайская поговорка говорит: 春雨贵如油 — «весенний дождь дороже масла»: весной он очень ценен.",
      en: "又 means “again”. The panda doesn't like rain, but a Chinese saying goes: 春雨贵如油 — “spring rain is as precious as oil”.",
      terms: {
        "春雨贵如油": { pinyin: "chūn yǔ guì rú yóu", ru: "весенний дождь дороже масла", en: "spring rain is as precious as oil" },
      },
    },
  },
  {
    id: "chun-tian-lai-le",
    when: { season: ["spring"] },
    words: ["春天", "来", "了", "！"],
    ru: "Пришла весна!",
    en: "Spring is here!",
    note: {
      ru: "Китайский Новый год по лунному календарю называется 春节 — «праздник весны», хотя он выпадает на конец января или февраль. По старому календарю с него и начиналась весна.",
      en: "The Lunar New Year is called 春节, the “Spring Festival”, even though it falls in late January or February. In the old calendar that's when spring began.",
      terms: {
        "春节": { pinyin: "Chūn jié", ru: "Праздник весны, китайский Новый год", en: "Spring Festival, Chinese New Year" },
      },
    },
  },
  {
    id: "xia-tian-re",
    when: { season: ["summer"] },
    words: ["夏天", "很", "热", "。"],
    ru: "Летом жарко.",
    en: "Summer is hot.",
    note: {
      ru: "夏天 — лето, 热 — жарко. Летом в Китае спасаются 空调 (кондиционером) и арбузом — самым любимым летним фруктом.",
      en: "夏天 is summer, 热 is hot. In summer China survives on 空调 (air conditioning) and watermelon, the favourite summer fruit.",
    },
  },
  {
    id: "qiu-tian-piao-liang",
    when: { season: ["autumn"] },
    words: ["秋天", "很", "漂亮", "。"],
    ru: "Осень очень красивая.",
    en: "Autumn is very beautiful.",
    note: {
      ru: "Осенью любят смотреть на 红叶 — красные листья, а в середине осени празднуют 中秋节 — в честь самой круглой луны года.",
      en: "In autumn people admire 红叶, red leaves, and celebrate 中秋节, the mid-autumn festival, for the roundest moon of the year.",
      terms: {
        "红叶": { pinyin: "hóng yè", ru: "красные листья", en: "red leaves" },
        "中秋节": { pinyin: "Zhōng qiū jié", ru: "праздник середины осени", en: "Mid-Autumn Festival" },
      },
    },
  },
  {
    id: "dong-tian-leng",
    when: { season: ["winter"] },
    words: ["冬天", "很", "冷", "，", "不过", "熊猫", "不", "睡觉", "！"],
    ru: "Зимой холодно, но панды не спят!",
    en: "Winter is cold, but pandas don't sleep through it!",
    pinyin: { 不过: "bú guò", 不: "bú" },
    note: {
      ru: "Панды, в отличие от многих медведей, не впадают в спячку: бамбук мало питателен, жира на всю зиму не накопить. Поэтому зимой они просто спускаются пониже в горы и едят дальше.",
      en: "Unlike many bears, pandas don't hibernate: bamboo isn't nourishing enough to store fat for the whole winter. So in winter they just move lower down the mountains and keep eating.",
    },
  },
  {
    id: "yin-tian",
    words: ["今天", "是", "阴天", "。"],
    ru: "Сегодня пасмурно.",
    en: "It's overcast today.",
    note: {
      ru: "阴 — «тень, тёмная сторона». 阴天 — пасмурное небо, а тот же иероглиф есть в 阴阳 — «инь и ян»: 阴 тёмное и мягкое, 阳 светлое и твёрдое.",
      en: "阴 means “shade”. 阴天 is an overcast sky, and the same character is in 阴阳 — “yin and yang”: 阴 is dark and soft, 阳 is bright and hard.",
      terms: {
        "阴阳": { pinyin: "yīn yáng", ru: "инь и ян", en: "yin and yang" },
        "阳": { pinyin: "yáng", ru: "ян, солнечная сторона", en: "yang, sunny side" },
      },
    },
  },
  {
    id: "xing-xing",
    when: { time: ["night"] },
    words: ["晚上", "有", "很", "多", "星星", "。"],
    ru: "Вечером видно много звёзд.",
    en: "There are many stars at night.",
    note: {
      ru: "星星 — «звёзды»: повтор слова делает его ласковым. Есть знаменитая детская песенка про мерцающие звёздочки: 一闪一闪亮晶晶.",
      en: "星星 means “stars”: doubling a word makes it cosy. There's a famous children's song about twinkling stars: 一闪一闪亮晶晶.",
      terms: {
        "一闪一闪亮晶晶": { pinyin: "yì shǎn yì shǎn liàng jīng jīng", ru: "мерцай, мерцай, звёздочка", en: "twinkle, twinkle, little star" },
      },
    },
  },
  {
    id: "wei-shenme-xue",
    words: ["你", "为什么", "学", "汉语", "？"],
    ru: "Почему ты учишь китайский?",
    en: "Why are you learning Chinese?",
    replies: [
      {
        id: "culture",
        words: ["我", "喜欢", "中国", "文化", "。"],
        ru: "Мне нравится китайская культура.",
        en: "I like Chinese culture.",
        reaction: {
          words: ["文化", "很", "有意思", "！"],
          ru: "Культура — это очень интересно!",
          en: "Culture is so interesting!",
        },
      },
      {
        id: "travel",
        words: ["我", "想", "去", "中国", "。"],
        ru: "Я хочу поехать в Китай.",
        en: "I want to go to China.",
        reaction: {
          words: ["太", "好", "了", "！", "我们", "一起", "去", "！"],
          ru: "Отлично! Поедем вместе!",
          en: "Great! Let's go together!",
          pinyin: { 一起: "yì qǐ" },
        },
      },
      {
        id: "interesting",
        words: ["汉语", "很", "有意思", "。"],
        ru: "Китайский очень интересный.",
        en: "Chinese is very interesting.",
        reaction: {
          words: ["说", "得", "对", "！"],
          ru: "Верно сказано!",
          en: "Well said!",
        },
      },
    ],
  },
  {
    id: "remember-culture",
    requires: { phraseId: "wei-shenme-xue", replyId: "culture" },
    words: ["你", "喜欢", "中国", "文化", "？", "我", "最", "喜欢", "中国", "菜", "！"],
    ru: "Тебе нравится китайская культура? А я больше всего люблю китайскую кухню!",
    en: "You like Chinese culture? I like Chinese food most of all!",
    note: {
      ru: "中国菜 — «китайские блюда», то есть кухня. 菜 — «блюдо» (а ещё «овощ»): 点菜 — заказывать еду в ресторане, 菜单 — меню.",
      en: "中国菜 is “Chinese dishes”, i.e. cuisine. 菜 means “dish” (and “vegetable”): 点菜 is to order food, 菜单 is a menu.",
      terms: {
        "中国菜": { pinyin: "Zhōng guó cài", ru: "китайская кухня", en: "Chinese food" },
        "点菜": { pinyin: "diǎn cài", ru: "заказывать блюда", en: "to order food" },
      },
    },
  },
  {
    id: "pa-re-pa-leng",
    words: ["你", "怕", "热", "还是", "怕", "冷", "？"],
    ru: "Ты боишься жары или холода?",
    en: "Do you fear heat or cold?",
    replies: [
      {
        id: "hot",
        words: ["我", "怕", "热", "。"],
        ru: "Боюсь жары.",
        en: "I fear heat.",
        reaction: {
          words: ["夏天", "我们", "在", "家", "吃", "西瓜", "！"],
          ru: "Летом будем сидеть дома и есть арбуз!",
          en: "In summer we'll stay home and eat watermelon!",
        },
      },
      {
        id: "cold",
        words: ["我", "怕", "冷", "。"],
        ru: "Боюсь холода.",
        en: "I fear cold.",
        reaction: {
          words: ["冬天", "多", "穿", "衣服", "！"],
          ru: "Зимой одевайся теплее!",
          en: "Dress warmly in winter!",
        },
      },
      {
        id: "both",
        words: ["我", "都", "怕", "。"],
        ru: "И того и другого.",
        en: "Both.",
        reaction: {
          words: ["熊猫", "只", "怕", "热", "！"],
          ru: "А панды боятся только жары!",
          en: "Pandas only fear the heat!",
        },
      },
    ],
  },
  {
    id: "remember-hot",
    requires: { phraseId: "pa-re-pa-leng", replyId: "hot" },
    words: ["你", "怕", "热", "？", "夏天", "我们", "在", "家", "吃", "西瓜", "，", "喝", "茶", "！"],
    ru: "Боишься жары? Летом будем сидеть дома: есть арбуз и пить чай!",
    en: "You fear heat? In summer we'll stay home: watermelon and tea!",
    note: {
      ru: "西瓜 — «западная дыня»: 西 — запад, 瓜 — дыня. Арбуз пришёл в Китай с запада — вот и «западная дыня». А настоящая дыня — например, 哈密瓜, «дыня из Хами».",
      en: "西瓜 is “western melon”: 西 is west, 瓜 is melon. Watermelon came to China from the west — hence “western melon”. A true melon is, for example, 哈密瓜, “melon from Hami”.",
      terms: {
        "瓜": { pinyin: "guā", ru: "дыня, тыква", en: "melon, gourd" },
        "哈密瓜": { pinyin: "hā mì guā", ru: "дыня хами", en: "Hami melon" },
      },
    },
  },
  {
    id: "hai-hai-shi-shan",
    words: ["你", "喜欢", "海", "还是", "山", "？"],
    ru: "Ты любишь море или горы?",
    en: "Do you like the sea or the mountains?",
    replies: [
      {
        id: "sea",
        words: ["我", "喜欢", "海", "。"],
        ru: "Люблю море.",
        en: "I like the sea.",
        reaction: {
          words: ["海", "很", "大", "！", "我", "想", "去", "看", "海", "！"],
          ru: "Море такое большое! Хочу на него посмотреть!",
          en: "The sea is so big! I want to see it!",
        },
      },
      {
        id: "mountain",
        words: ["我", "喜欢", "山", "。"],
        ru: "Люблю горы.",
        en: "I like mountains.",
        reaction: {
          words: ["山", "很", "高", "！", "我", "也", "喜欢", "山", "！"],
          ru: "Горы такие высокие! Я тоже люблю горы!",
          en: "Mountains are so tall! I love mountains too!",
        },
      },
      {
        id: "both-nature",
        words: ["我", "都", "喜欢", "。"],
        ru: "И то и другое.",
        en: "Both.",
        reaction: {
          words: ["你", "很", "喜欢", "漂亮", "的", "东西", "！"],
          ru: "Ты любишь всё красивое!",
          en: "You love all things beautiful!",
        },
      },
    ],
  },
  {
    id: "zao-shang-chi-shenme",
    words: ["你", "早上", "吃", "什么", "？"],
    ru: "Что ты ешь по утрам?",
    en: "What do you eat in the morning?",
    replies: [
      {
        id: "baozi",
        words: ["我", "吃", "包子", "。"],
        ru: "Я ем баоцзы.",
        en: "I eat baozi.",
        reaction: {
          words: ["包子", "很", "好吃", "！"],
          ru: "Баоцзы такие вкусные!",
          en: "Baozi are so tasty!",
        },
      },
      {
        id: "bread",
        words: ["我", "吃", "面包", "。"],
        ru: "Я ем хлеб.",
        en: "I eat bread.",
        reaction: {
          words: ["面包", "？", "我", "想", "吃", "蛋糕", "！"],
          ru: "Хлеб? А я бы съела тортик!",
          en: "Bread? I'd rather have cake!",
        },
      },
      {
        id: "nothing",
        words: ["我", "不", "吃", "早饭", "。"],
        ru: "Я не завтракаю.",
        en: "I skip breakfast.",
        reaction: {
          words: ["那", "我们", "一起", "吃", "早饭", "吧", "！"],
          ru: "Тогда давай позавтракаем вместе!",
          en: "Then let's have breakfast together!",
        },
      },
    ],
  },
  {
    id: "re-shui-hai-shi-liang",
    words: ["你", "喜欢", "喝", "热", "水", "还是", "凉", "水", "？"],
    ru: "Ты любишь горячую или прохладную воду?",
    en: "Do you like hot or cool water?",
    replies: [
      {
        id: "hot-water",
        words: ["我", "喜欢", "热", "水", "。"],
        ru: "Люблю горячую.",
        en: "I like it hot.",
        reaction: {
          words: ["很", "好", "！", "多", "喝", "热", "水", "！"],
          ru: "Отлично! Пей больше горячей воды!",
          en: "Great! Drink more hot water!",
        },
      },
      {
        id: "cold-water",
        words: ["我", "喜欢", "凉", "水", "。"],
        ru: "Люблю прохладную.",
        en: "I like it cool.",
        reaction: {
          mood: "surprised",
          words: ["凉", "水", "？", "我", "的", "中国", "朋友", "会", "说", "：", "多", "喝", "热", "水", "！"],
          ru: "Прохладную? Мой китайский друг сказал бы: пей больше горячей воды!",
          en: "Cool? My Chinese friend would say: drink more hot water!",
        },
      },
    ],
  },
  {
    id: "jin-tian-zenme-yang",
    words: ["今天", "你", "怎么样", "？"],
    ru: "Как ты сегодня?",
    en: "How are you today?",
    note: {
      ru: "怎么样 — «как». Универсальный вопрос: 这个怎么样? — «как тебе это?», 汉语怎么样? — «как успехи с китайским?», 天气怎么样? — «какая погода?»",
      en: "怎么样 means “how”. A universal question word: 这个怎么样? “how about this?”, 汉语怎么样? “how's your Chinese?”, 天气怎么样? “how's the weather?”",
      terms: {
        "这个怎么样": { pinyin: "zhè ge zěn me yàng", ru: "как тебе это?", en: "how about this?" },
        "汉语怎么样": { pinyin: "Hàn yǔ zěn me yàng", ru: "как успехи с китайским?", en: "how's your Chinese?" },
        "天气怎么样": { pinyin: "tiān qì zěn me yàng", ru: "какая погода?", en: "how's the weather?" },
      },
    },
    replies: [
      {
        id: "good-today",
        words: ["很", "好", "！"],
        ru: "Отлично!",
        en: "Very good!",
        reaction: {
          words: ["太", "好", "了", "！"],
          ru: "Это замечательно!",
          en: "That's wonderful!",
        },
      },
      {
        id: "so-so-today",
        words: ["还", "可以", "。"],
        ru: "Нормально.",
        en: "Okay.",
        reaction: {
          words: ["还", "可以", "也", "不错", "！"],
          ru: "«Нормально» — тоже неплохо!",
          en: "“Okay” is not bad at all!",
        },
      },
      {
        id: "bad-today",
        words: ["不", "太", "好", "……"],
        ru: "Не очень……",
        en: "Not so good...",
        pinyin: { 不: "bú" },
        reaction: {
          words: ["怎么", "了", "？", "吃", "点", "好", "吃", "的", "吧", "！"],
          ru: "Что случилось? Съешь чего-нибудь вкусненького!",
          en: "What happened? Have something tasty!",
        },
      },
    ],
  },
  {
    id: "remember-cat",
    requires: { phraseId: "cat-or-dog", replyId: "cat" },
    words: ["你", "也", "喜欢", "猫", "？", "猫", "是", "猫", "，", "熊猫", "不", "是", "猫", "，", "是", "熊", "！"],
    ru: "Ты тоже любишь кошек? Кошка — это кошка, а панда — не кошка, а медведь!",
    en: "You like cats too? A cat is a cat, but a panda is not a cat — it's a bear!",
    pinyin: { 不: "bú" },
    note: {
      ru: "熊猫 дословно «медведь-кошка», но по науке панда — медведь: 熊. А ещё панда — единственный медведь, который ест почти только бамбук.",
      en: "熊猫 is literally “bear-cat”, but scientifically the panda is a bear: 熊. It's also the only bear that eats almost nothing but bamboo.",
    },
  },
  {
    id: "bao-zi",
    words: ["我", "很", "喜欢", "包子", "！"],
    ru: "Очень люблю баоцзы!",
    en: "I love baozi!",
    note: {
      ru: "包子 — булочки с начинкой на пару. От 饺子 их отличают складки: пельмени защипывают по краю, а 包子 собирают «защипками» сверху, как мешочек.",
      en: "包子 are steamed stuffed buns. What sets them apart from 饺子 dumplings is the fold: dumplings are pinched at the edge, baozi are pleated on top like a little pouch.",
    },
  },
  {
    id: "tang",
    words: ["冬天", "喝", "热", "汤", "最", "好", "了", "！"],
    ru: "Зимой лучше всего горячий суп!",
    en: "Hot soup is the best thing in winter!",
    note: {
      ru: "汤 — суп, бульон. В китайском обеде часто есть 汤: считается, что он помогает пищеварению. А ещё 汤 — это не только про еду: 米汤 — рисовый отвар!",
      en: "汤 means soup or broth. A Chinese meal often includes 汤 — it's believed to help digestion. And 汤 isn't just food: 米汤 is rice water!",
      terms: {
        "米汤": { pinyin: "mǐ tāng", ru: "рисовый отвар", en: "rice water" },
      },
    },
  },
  {
    id: "zao-fan",
    words: ["早饭", "很", "重要", "。"],
    ru: "Завтрак важен.",
    en: "Breakfast is important.",
    note: {
      ru: "早饭 — «утренняя еда»: 早 — утро, 饭 — еда, рис. Обед — 午饭, ужин — 晚饭: все три оканчиваются на 饭. Поэтому «ты поел?» — 你吃饭了吗?",
      en: "早饭 is “morning meal”: 早 morning, 饭 meal, rice. Lunch is 午饭, dinner is 晚饭 — all three end with 饭. That's why “have you eaten?” is 你吃饭了吗?",
      terms: {
        "你吃饭了吗": { pinyin: "nǐ chī fàn le ma", ru: "ты поел(а)?", en: "have you eaten?" },
      },
    },
  },
  {
    id: "nai-cha",
    words: ["我", "喜欢", "绿茶", "，", "不过", "奶茶", "也", "很", "好", "。"],
    ru: "Я люблю зелёный чай, но и молочный чай тоже хорош.",
    en: "I like green tea, but milk tea is nice too.",
    pinyin: { 不过: "bú guò" },
    note: {
      ru: "奶茶 — чай с молоком: 奶 — молоко, 茶 — чай. Сейчас популярен 珍珠奶茶 — «чай с жемчугом»: жемчужины из тапиоки на дне стакана. Встряхни перед тем, как пить!",
      en: "奶茶 is milk tea: 奶 milk, 茶 tea. These days 珍珠奶茶, “pearl milk tea”, is popular: tapioca pearls at the bottom of the cup. Shake before drinking!",
      terms: {
        "奶": { pinyin: "nǎi", ru: "молоко", en: "milk" },
        "珍珠奶茶": { pinyin: "zhēn zhū nǎi chá", ru: "чай с тапиокой", en: "bubble tea" },
      },
    },
  },
  {
    id: "mi-fan-bi-mian-tiao",
    words: ["我", "觉得", "米饭", "比", "面条", "好吃", "。"],
    ru: "Я считаю, рис вкуснее лапши.",
    en: "I think rice is tastier than noodles.",
    note: {
      ru: "比 — сравнение: А 比 B + прилагательное — «А более …, чем B». 我觉得 — «я считаю/мне кажется»: 觉得 — чувствовать, полагать. Мягкий способ высказать мнение!",
      en: "比 is comparison: A 比 B + adjective — “A is more … than B”. 我觉得 is “I think”: 觉 to feel, 得 a particle. A soft way to give an opinion!",
      terms: {
        "我觉得": { pinyin: "wǒ jué de", ru: "мне кажется", en: "I think" },
      },
    },
  },
  {
    id: "xi-hong-shi",
    words: ["西红柿", "鸡蛋", "很", "好吃", "！"],
    ru: "Обожаю жареные помидоры с яйцом!",
    en: "I love stir-fried tomatoes and eggs!",
    note: {
      ru: "西红柿 — помидор, дословно «западная красная хурма»: 柿 — хурма, а помидоры привезли с запада. Блюдо 西红柿炒鸡蛋 — помидоры, обжаренные с яйцом: самое домашнее китайское блюдо, его готовят почти в каждой семье.",
      en: "西红柿 is tomato, literally “western red persimmon”: 柿 is persimmon, and tomatoes came from the west. 西红柿炒鸡蛋, tomatoes stir-fried with egg, is the most homely Chinese dish, cooked in almost every family.",
      terms: {
        "柿": { pinyin: "shì", ru: "хурма", en: "persimmon" },
        "西红柿炒鸡蛋": { pinyin: "xī hóng shì chǎo jī dàn", ru: "помидоры, жаренные с яйцом", en: "tomato and egg stir-fry" },
      },
    },
  },
  {
    id: "hong-bao",
    when: { season: ["winter"] },
    words: ["新年", "好", "！", "红包", "拿", "来", "！"],
    ru: "С Новым годом! Давай красный конверт!",
    en: "Happy New Year! Hand over the red envelope!",
    note: {
      ru: "红包 — красный конверт с деньгами: 红 — красный, 包 — пакетик. Старшие дарят его детям и молодым — красный отгоняет неудачу, а деньги приносят удачу.",
      en: "红包 is a red envelope with money: 红 red, 包 packet. Elders give it to children and young people — red wards off bad luck, money brings good luck.",
      terms: {
        "红": { pinyin: "hóng", ru: "красный", en: "red" },
      },
    },
  },
  {
    id: "zhao-qian",
    words: ["在", "商店", "，", "你", "可以", "说", "：", "请", "找", "钱", "。"],
    ru: "В магазине можно сказать: «Сдачу, пожалуйста».",
    en: "In a shop you can say: “My change, please.”",
    note: {
      ru: "找 — «искать», но 找钱 — «давать сдачу». Ещё есть 找零 — сдача мелочью. А в остальном 找 — обычное «искать»: 找朋友 — искать друга, 找工作 — искать работу.",
      en: "找 means “to look for”, but 找钱 is “to give change”. Also 找零 — change in small money. Otherwise 找 is just “to look for”: 找朋友 look for a friend, 找工作 look for a job.",
      terms: {
        "找钱": { pinyin: "zhǎo qián", ru: "давать сдачу", en: "to give change" },
        "找零": { pinyin: "zhǎo líng", ru: "сдача", en: "change (money)" },
        "找朋友": { pinyin: "zhǎo péng you", ru: "искать друга", en: "to look for a friend" },
        "找工作": { pinyin: "zhǎo gōng zuò", ru: "искать работу", en: "to look for a job" },
      },
    },
  },
  {
    id: "kuai-he-mao",
    words: ["一", "块", "钱", "是", "十", "毛", "钱", "。"],
    ru: "Один юань — десять мао.",
    en: "One yuan is ten jiao.",
    pinyin: { 一: "yí" },
    note: {
      ru: "Разговорные деньги: 块 — юань (официально 元), 毛 — десять центов (официально 角), 分 — цент. Цены читают по-простому: 三块五 — «три пять», то есть 3,5 юаня.",
      en: "Colloquial money: 块 is yuan (officially 元), 毛 is ten cents (officially 角), 分 is a cent. Prices are read simply: 三块五 — “three five”, i.e. 3.5 yuan.",
      terms: {
        "三块五": { pinyin: "sān kuài wǔ", ru: "три с половиной юаня", en: "3.5 yuan" },
      },
    },
  },
  {
    id: "duo-shao-qian",
    words: ["在", "商店", "要", "问", "：", "这", "个", "多少", "钱", "？"],
    ru: "В магазине спрашивают: «Сколько это стоит?»",
    en: "In a shop you ask: “How much is this?”",
    pinyin: { 个: "ge" },
    note: {
      ru: "多少钱 — «сколько денег»: 多少 — сколько, 钱 — деньги. Короче тот же вопрос — 这个几块? «Сколько это юаней?» — на слух в магазине услышишь именно так.",
      en: "多少钱 is “how much money”: 多少 how much, 钱 money. A shorter version: 这个几块? “How many yuan is this?” — that's what you'll hear in shops.",
      terms: {
        "多少钱": { pinyin: "duō shao qián", ru: "сколько стоит?", en: "how much is it?" },
        "这个几块": { pinyin: "zhè ge jǐ kuài", ru: "сколько юаней это стоит?", en: "how many yuan is this?" },
      },
    },
  },
  {
    id: "tai-gui-le",
    words: ["我", "去", "买", "东西", "，", "可是", "太", "贵", "了", "！"],
    ru: "Я пошла за покупками, но всё слишком дорого!",
    en: "I went shopping, but it's all too expensive!",
    pinyin: { 东西: "dōng xi" },
    note: {
      ru: "贵 — дорогой, 便宜 — дёшевый. На рынках торгуются фразой 便宜一点吧 — «подешевле, а?». А в магазинах с фиксированными ценами торг не принят — только 太贵了 и вздох.",
      en: "贵 is expensive, 便宜 is cheap. At markets people haggle with 便宜一点吧 — “a bit cheaper?”. Fixed-price shops don't haggle — just 太贵了 and a sigh.",
      terms: {
        "太贵了": { pinyin: "tài guì le", ru: "слишком дорого", en: "too expensive" },
        "便宜一点吧": { pinyin: "pián yi yì diǎn ba", ru: "подешевле, а?", en: "a bit cheaper, please?" },
      },
    },
  },
  {
    id: "mian-fei",
    words: ["商店", "里", "的", "水果", "是", "免费", "的", "！", "太", "好", "了", "！"],
    ru: "В магазине фрукты дают попробовать бесплатно! Здорово!",
    en: "The shop lets you try fruit for free! Great!",
    note: {
      ru: "免费 — «освобождён от платы»: 免 — освобождать, 费 — плата. В Китае часто есть 免费试吃 — бесплатные пробники еды в магазинах. Панда одобряет!",
      en: "免费 is “exempt from fees”: 免 exempt, 费 fee. Free food samples 免费试吃 are common in Chinese shops. The panda approves!",
      terms: {
        "免": { pinyin: "miǎn", ru: "освобождать", en: "to exempt" },
        "免费试吃": { pinyin: "miǎn fèi shì chī", ru: "бесплатная дегустация", en: "free tasting" },
      },
    },
  },
  {
    id: "xiang-xing-zi",
    words: ["山", "字", "像", "一", "座", "山", "！"],
    ru: "Иероглиф 山 похож на гору!",
    en: "The character 山 looks like a mountain!",
    pinyin: { 一: "yí" },
    note: {
      ru: "象形字 — иероглифы-картинки: 山 похож на три вершины, 水 — на реку, 日 — на солнце с точкой, 月 — на полумесяц, 木 — на дерево. Смотри на иероглиф — и видишь вещь!",
      en: "象形字 are pictographs: 山 looks like three peaks, 水 like a river, 日 like the sun, 月 like a crescent, 木 like a tree. Look at the character — and see the thing!",
      terms: {
        "象形字": { pinyin: "xiàng xíng zì", ru: "иероглиф-рисунок", en: "pictogram" },
        "木": { pinyin: "mù", ru: "дерево", en: "tree, wood" },
      },
    },
  },
  {
    id: "di-tie",
    words: ["地铁", "很", "方便", "。"],
    ru: "Метро очень удобное.",
    en: "The subway is very convenient.",
    note: {
      ru: "地铁 — «подземная дорога»: 地 — земля, 铁 — железо. Метро есть во всех крупных городах Китая, а билет часто — просто QR-код в телефоне.",
      en: "地铁 is “underground road”: 地 earth, 铁 iron. Every big Chinese city has a subway, and the ticket is often just a QR code in your phone.",
      terms: {
        "铁": { pinyin: "tiě", ru: "железо", en: "iron" },
      },
    },
  },
  {
    id: "gao-tie",
    words: ["中国", "的", "高铁", "很", "快", "。"],
    ru: "Китайские скоростные поезда очень быстрые.",
    en: "China's high-speed trains are very fast.",
    note: {
      ru: "高铁 — «высокоскоростное железо»: 高 — высокий, 铁 — железная дорога. Поезда идут до 350 км/ч: Пекин—Шанхай — около четырёх с половиной часов, как самолёт с учётом аэропорта!",
      en: "高铁 is “high-speed rail”: 高 high, 铁 iron. Trains run up to 350 km/h: Beijing—Shanghai in about four and a half hours — like a plane, counting the airport!",
      terms: {
        "铁": { pinyin: "tiě", ru: "железо", en: "iron" },
      },
    },
  },
  {
    id: "lu-you",
    words: ["我", "喜欢", "旅游", "。"],
    ru: "Люблю путешествовать!",
    en: "I love travelling!",
    note: {
      ru: "旅游 — «путешествие»: 旅 — странствие, 游 — гулять. Близкое слово 旅行 — тоже путешествие. 游客 — турист, 导游 — гид, 旅馆 — гостиница. Целая семья слов из двух иероглифов!",
      en: "旅游 means “travel”: 旅 journey, 游 to roam. A close word is 旅行, also “trip”. 游客 tourist, 导游 guide, 旅馆 inn — a whole family from two characters!",
      terms: {
        "旅": { pinyin: "lǚ", ru: "странствие", en: "travel" },
      },
    },
  },
  {
    id: "zhao-xiang",
    words: ["我", "喜欢", "照相", "。"],
    ru: "Люблю фотографировать.",
    en: "I like taking photos.",
    note: {
      ru: "照相 — «фотографироваться»: 照 — сиять, снимать, 相 — лицо, вид. Фотоаппарат — 照相机, а селфи — 自拍.",
      en: "照相 is “to take a photo”: 照 to shine, shoot, 相 face, view. A camera is 照相机, and a selfie is 自拍.",
      terms: {
        "相": { pinyin: "xiàng", ru: "облик, вид", en: "appearance" },
        "照相机": { pinyin: "zhào xiàng jī", ru: "фотоаппарат", en: "camera" },
        "自拍": { pinyin: "zì pāi", ru: "селфи", en: "selfie" },
      },
    },
  },
  {
    id: "qing-wen",
    words: ["问", "路", "的", "时候", "，", "先", "说", "：", "请问", "。"],
    ru: "Когда спрашиваешь дорогу, сначала скажи: «请问».",
    en: "When asking the way, first say: “请问”.",
    note: {
      ru: "请问 — «разрешаете спросить»: 请 — просить, 问 — спрашивать. Вежливое начало вопроса незнакомому человеку. Без него вопрос звучит резковато!",
      en: "请问 is “may I ask”: 请 to ask politely, 问 to ask. A polite opener for questions to strangers. Without it a question sounds blunt!",
    },
  },
  {
    id: "bu-hao-yi-si",
    words: ["中国", "人", "常常", "说", "：", "不好意思", "。"],
    ru: "Китайцы очень часто говорят «不好意思».",
    en: "Chinese people say “不好意思” all the time.",
    note: {
      ru: "不好意思 — «мне неловко»: 意思 — смысл, интерес. Универсальное слово: извинение, «спасибо» и неловкость одновременно. Не знаешь, что сказать, — скажи 不好意思!",
      en: "不好意思 is “I feel awkward”: 意思 meaning, interest. A universal word: apology, “thanks” and embarrassment in one. Not sure what to say — say 不好意思!",
    },
  },
  {
    id: "bao-qian",
    words: ["抱歉", "比", "对不起", "更", "正式", "。"],
    ru: "抱歉 звучит официальнее, чем 对不起.",
    en: "抱歉 sounds more formal than 对不起.",
    note: {
      ru: "抱歉 — «сожалею»: 抱 — обнимать, 歉 — извинение. Чуть формальнее 对不起. 迟到 — «опоздать»: 迟 — поздно, 到 — прибыть. А 早到 — прийти рано!",
      en: "抱歉 means “I regret”: 抱 to hold, 歉 apology. A bit more formal than 对不起. 迟到 is “to be late”: 迟 late, 到 arrive. And 早到 is to arrive early!",
      terms: {
        "歉": { pinyin: "qiàn", ru: "сожаление, извинение", en: "apology" },
        "早到": { pinyin: "zǎo dào", ru: "прийти рано", en: "to arrive early" },
      },
    },
  },
  {
    id: "gan-xie",
    words: ["谢谢", "你", "和", "我", "一起", "学习", "汉语", "！"],
    ru: "Спасибо, что учишь китайский вместе со мной!",
    en: "Thank you for learning Chinese with me!",
    pinyin: { 一起: "yì qǐ" },
    note: {
      ru: "谢 — «благодарить», но у этого иероглифа и другие лица: 花谢了 — «цветы увяли», 谢绝 — «отклонить (вежливо)». А на спасибо отвечают 不客气 или 不用谢.",
      en: "谢 is “to thank”, but the character has other faces: 花谢了 — “the flowers have wilted”, 谢绝 — “to decline politely”. And replies to thanks are 不客气 or 不用谢.",
      terms: {
        "谢": { pinyin: "xiè", ru: "благодарить; увядать", en: "to thank; to wither" },
        "花谢了": { pinyin: "huā xiè le", ru: "цветы увяли", en: "the flowers have withered" },
        "谢绝": { pinyin: "xiè jué", ru: "вежливо отказать", en: "to politely decline" },
        "不用谢": { pinyin: "bú yòng xiè", ru: "не за что", en: "you're welcome" },
      },
    },
  },
  {
    id: "shi-fu",
    words: ["坐", "出租车", "的", "时候", "，", "可以", "叫", "司机", "：", "师傅", "！"],
    ru: "В такси водителя можно позвать: «Шифу!»",
    en: "In a taxi you can call the driver “师傅!”",
    note: {
      ru: "师傅 — «мастер, учитель»: 师 — учитель, 傅 — наставник. Так вежливо обращаются к водителям такси и автобусов. Так же в фильмах о кунг-фу ученики зовут своего учителя.",
      en: "师傅 is “master, teacher”: 师 teacher, 傅 tutor. It's how you politely address taxi and bus drivers. In kung-fu films, students call their teacher that too.",
      terms: {
        "师": { pinyin: "shī", ru: "учитель, мастер", en: "teacher, master" },
        "傅": { pinyin: "fù", ru: "наставник", en: "tutor" },
      },
    },
  },
  {
    id: "tong-xue",
    words: ["我们", "一起", "学习", "，", "我们", "是", "同学", "！"],
    ru: "Мы учимся вместе — значит, мы 同学!",
    en: "We study together, so we're 同学!",
    pinyin: { 一起: "yì qǐ" },
    note: {
      ru: "同学 — «одноклассник, сокурсник»: 同 — вместе, 学 — учиться. Студенты в Китае так здороваются между собой. Панда может звать тебя 同学 — мы ведь учимся вместе!",
      en: "同学 is “classmate, fellow student”: 同 together, 学 study. Students in China greet each other this way. The panda can call you 同学 — we're studying together!",
      terms: {
        "同": { pinyin: "tóng", ru: "вместе, одинаковый", en: "together, same" },
      },
    },
  },
  {
    id: "shui-jiao-qi-chuang",
    words: ["中国", "人", "说", "：", "早", "睡", "早", "起", "身体", "好", "。"],
    ru: "Китайцы говорят: рано ложиться и рано вставать — для здоровья.",
    en: "Chinese people say: early to bed, early to rise, good for your health.",
    note: {
      ru: "起床 — «вставать с постели»: 起 — подниматься, 床 — кровать. Поговорка: 早睡早起身体好 — «рано спать и вставать — будешь здоров». Слово в слово: «тело хорошее».",
      en: "起床 is “to get up”: 起 rise, 床 bed. The saying: 早睡早起身体好 — “sleep and rise early and you'll be healthy”. Literally: “body good”.",
      terms: {
        "早睡早起身体好": { pinyin: "zǎo shuì zǎo qǐ shēn tǐ hǎo", ru: "рано ложиться и рано вставать — для здоровья", en: "early to bed and early to rise makes you healthy" },
      },
    },
  },
  {
    id: "duan-lian",
    words: ["早上", "很", "多", "中国", "人", "在", "公园", "锻炼", "身体", "。"],
    ru: "По утрам многие китайцы занимаются в парке.",
    en: "In the mornings many Chinese people exercise in the park.",
    note: {
      ru: "锻炼 — «закалять»: 锻 — ковать, 炼 — плавить. Молот и огонь куют тело! 锻炼身体 — укреплять здоровье, а 晨练 — утренняя зарядка.",
      en: "锻炼 is “to temper”: 锻 to forge, 炼 to smelt. Hammer and fire forge the body! 锻炼身体 means to exercise, and 晨练 is morning exercise.",
      terms: {
        "锻": { pinyin: "duàn", ru: "ковать", en: "to forge" },
        "炼": { pinyin: "liàn", ru: "плавить, закалять", en: "to smelt, to temper" },
        "锻炼身体": { pinyin: "duàn liàn shēn tǐ", ru: "укреплять здоровье", en: "to exercise" },
        "晨练": { pinyin: "chén liàn", ru: "утренняя зарядка", en: "morning exercise" },
      },
    },
  },
  {
    id: "da-sao",
    words: ["我们", "一起", "打扫", "房间", "吧", "！"],
    ru: "Давай вместе уберёмся!",
    en: "Let's clean the room together!",
    pinyin: { 一起: "yì qǐ" },
    note: {
      ru: "打扫 — «подметать и подчищать»: 打 — трогать, 扫 — мести. 扫地 — мести пол, 扫把 — метла, 垃圾 — мусор. Чистая комната — чистые мысли!",
      en: "打扫 is “to clean”: 打 to touch, 扫 to sweep. 扫地 sweep the floor, 扫把 broom, 垃圾 rubbish. A clean room — clean thoughts!",
      terms: {
        "扫地": { pinyin: "sǎo dì", ru: "подметать пол", en: "to sweep the floor" },
        "扫把": { pinyin: "sào ba", ru: "метла", en: "broom" },
      },
    },
  },
  {
    id: "zuo-fan",
    words: ["我", "会", "做饭", "！"],
    ru: "Я умею готовить!",
    en: "I can cook!",
    note: {
      ru: "做饭 — «делать еду»: 做 — делать, 饭 — еда. 做饭 и 做菜 — готовить обед. А на юге Китая готовят 竹筒饭 — рис, запечённый прямо в стволе бамбука!",
      en: "做饭 is “to make food”: 做 to make, 饭 food. 做饭 and 做菜 both mean to cook. And in southern China there's 竹筒饭 — rice baked right inside a bamboo stem!",
      terms: {
        "做菜": { pinyin: "zuò cài", ru: "готовить блюда", en: "to cook dishes" },
        "竹筒饭": { pinyin: "zhú tǒng fàn", ru: "рис в стволе бамбука", en: "rice cooked in bamboo" },
      },
    },
  },
  {
    id: "xi-zao",
    words: ["熊猫", "也", "喜欢", "洗澡", "！"],
    ru: "Панды тоже любят купаться!",
    en: "Pandas love a bath too!",
    note: {
      ru: "洗澡 — «мыться»: 洗 — мыть, 澡 — купание. В Китае чаще моются вечером, а не утром. 热水澡 — горячая ванна после долгого дня: вот это счастье!",
      en: "洗澡 is “to wash”: 洗 to wash, 澡 bathing. In China people wash more often in the evening than the morning. 热水澡 — a hot bath after a long day: that's happiness!",
      terms: {
        "澡": { pinyin: "zǎo", ru: "купание", en: "bath" },
        "热水澡": { pinyin: "rè shuǐ zǎo", ru: "горячая ванна", en: "hot bath" },
      },
    },
  },
  {
    id: "shang-wang",
    words: ["我", "喜欢", "上网", "。"],
    ru: "Люблю сидеть в интернете.",
    en: "I like being online.",
    note: {
      ru: "上网 — «выходить в сеть»: 上 — подниматься на, 网 — сеть. 网友 — друзья по сети, 网红 — «звезда сети», блогер. А «офлайн» — просто 没网!",
      en: "上网 is “to go online”: 上 to get on, 网 net. 网友 online friends, 网红 “internet star”, blogger. And “offline” is simply 没网!",
      terms: {
        "网": { pinyin: "wǎng", ru: "сеть", en: "net" },
        "网红": { pinyin: "wǎng hóng", ru: "звезда интернета, блогер", en: "internet celebrity" },
        "没网": { pinyin: "méi wǎng", ru: "нет интернета", en: "no internet" },
      },
    },
  },
  {
    id: "peng-you",
    words: ["我们", "是", "好", "朋友", "！"],
    ru: "Мы — хорошие друзья!",
    en: "We are good friends!",
    note: {
      ru: "朋友 — «друг»: 朋 — товарищ, 友 — друг. В древности 朋 рисовали как две связки ракушек-денег рядом — двое, которые всегда вместе.",
      en: "朋友 is “friend”: 朋 companion, 友 friend. In ancient times 朋 was drawn as two strings of shell money side by side — two that always go together.",
      terms: {
        "朋": { pinyin: "péng", ru: "товарищ", en: "companion" },
        "友": { pinyin: "yǒu", ru: "друг", en: "friend" },
      },
    },
  },
  {
    id: "bie-dan-xin",
    words: ["别", "担心", "，", "错", "了", "也", "没关系", "！"],
    ru: "Не волнуйся: ошибаться — это нормально!",
    en: "Don't worry, mistakes are fine!",
    note: {
      ru: "担心 — «тревожиться»: 担 — нести на плечах, 心 — сердце. Тревога — как груз на сердце! На это отвечают 放心 — «будь спокоен»: 放 — отпустить, 心 — сердце.",
      en: "担心 is “to worry”: 担 to carry on the shoulders, 心 heart. Worry is a weight on the heart! The reply is 放心 — “rest easy”: 放 to release, 心 heart.",
      terms: {
        "担": { pinyin: "dān", ru: "нести на плечах", en: "to carry on the shoulders" },
      },
    },
  },
  {
    id: "kan-yi-kan",
    words: ["我", "想", "看", "看", "你", "写", "的", "汉字", "！"],
    ru: "Хочу посмотреть, как ты пишешь иероглифы!",
    en: "I want to see the characters you write!",
    pinyin: { 看: "kàn" },
    note: {
      ru: "Глагол, повторённый, — «чуть-чуть, разок»: 看看 — глянуть, 试试 — примерить, 想想 — подумать. Продавцу можно сказать 我看看 — «я просто смотрю», без обязательств.",
      en: "A repeated verb means “a bit”: 看看 take a look, 试试 try on, 想想 think it over. You can tell a seller 我看看 — “I'm just looking”, no strings attached.",
      terms: {
        "我看看": { pinyin: "wǒ kàn kan", ru: "я посмотрю", en: "let me have a look" },
        "看看": { pinyin: "kàn kan", ru: "глянуть", en: "to take a look" },
        "试试": { pinyin: "shì shi", ru: "попробовать", en: "to give it a try" },
        "想想": { pinyin: "xiǎng xiang", ru: "подумать", en: "to think it over" },
      },
    },
  },
  {
    id: "cong-ming",
    words: ["聪明", "的", "人", "会", "听", "也", "会", "看", "。"],
    ru: "Умный человек умеет и слушать, и смотреть.",
    en: "A clever person knows how to listen and to look.",
    note: {
      ru: "聪明 — «умный»: 聪 — хороший слух, 明 — яркий, зрячий. Умный — тот, кто хорошо слышит и видит: сначала слушай и смотри, потом думай. Как при изучении языка!",
      en: "聪明 is “smart”: 聪 good hearing, 明 bright, clear-sighted. The smart one hears and sees well: listen and look first, then think. Just like learning a language!",
      terms: {
        "聪": { pinyin: "cōng", ru: "острый слух", en: "sharp hearing" },
        "明": { pinyin: "míng", ru: "светлый, ясный", en: "bright, clear" },
      },
    },
  },
  {
    id: "kuai-le",
    words: ["学习", "汉语", "很", "快乐", "！"],
    ru: "Учить китайский — радость!",
    en: "Learning Chinese is joyful!",
    note: {
      ru: "快乐 — «радость»: 快 — быстрый, весёлый, 乐 — музыка, веселье. А «счастье» — длиннее: 幸福. 祝你快乐 — «желаю радости»!",
      en: "快乐 is “joy”: 快 fast, cheerful, 乐 music, fun. And “happiness” is the longer one: 幸福. 祝你快乐 — “wish you joy”!",
      terms: {
        "乐": { pinyin: "lè", ru: "радость, веселье", en: "joy" },
        "祝你快乐": { pinyin: "zhù nǐ kuài lè", ru: "желаю радости", en: "wishing you joy" },
      },
    },
  },
  {
    id: "man-man-lai",
    words: ["学", "汉字", "要", "慢", "慢", "来", "。"],
    ru: "Иероглифы учат потихоньку.",
    en: "Characters are learned little by little.",
    note: {
      ru: "慢慢来 — «давай потихоньку»: 慢慢 — медленно, 来 — здесь «делать». Утешение новичку: не торопись! И знакомое нам 慢走 — из той же семьи заботливых слов.",
      en: "慢慢来 is “take it slowly”: 慢慢 slowly, 来 here means “to do”. Comfort for a beginner: no rush! And our familiar 慢走 is from the same family of caring words.",
      terms: {
        "慢慢来": { pinyin: "màn màn lái", ru: "не спеши, потихоньку", en: "take it slowly" },
        "慢慢": { pinyin: "màn màn", ru: "медленно, потихоньку", en: "slowly" },
        "慢走": { pinyin: "màn zǒu", ru: "счастливо, иди осторожно", en: "take care (when leaving)" },
      },
    },
  },
  {
    id: "zuo-de-hao",
    words: ["熊猫", "走", "得", "很", "慢", "。"],
    ru: "Панды ходят очень медленно.",
    en: "Pandas walk very slowly.",
    pinyin: { 得: "de" },
    note: {
      ru: "得 стоит после глагола и показывает, как выполнено действие: 做得好 — сделано хорошо, 说得对 — сказано верно, 跑得快 — бегает быстро. Три разных 的/地/得 — смотри по месту!",
      en: "得 stands after a verb and shows how the action is done: 做得好 done well, 说得对 said right, 跑得快 runs fast. Three different de's — each in its own place!",
      terms: {
        "做得好": { pinyin: "zuò de hǎo", ru: "хорошо сделано", en: "well done" },
        "说得对": { pinyin: "shuō de duì", ru: "верно сказано", en: "well said" },
        "跑得快": { pinyin: "pǎo de kuài", ru: "быстро бегает", en: "runs fast" },
      },
    },
  },
  {
    id: "zi-ji",
    words: ["我", "喜欢", "自己", "做", "饭", "。"],
    ru: "Люблю готовить сама.",
    en: "I like cooking for myself.",
    note: {
      ru: "自己 — «сам»: 自 — сам, 己 — себя. 我自己 — я сам, 你自己 — ты сам. Китайские родители учат детей: 自己的事情自己做 — «свои дела делай сам».",
      en: "自己 means “oneself”: 自 self, 己 oneself. 我自己 I myself, 你自己 you yourself. Chinese parents teach kids: 自己的事情自己做 — “do your own things yourself”.",
      terms: {
        "己": { pinyin: "jǐ", ru: "себя", en: "oneself" },
        "我自己": { pinyin: "wǒ zì jǐ", ru: "я сам(а)", en: "I myself" },
        "你自己": { pinyin: "nǐ zì jǐ", ru: "ты сам(а)", en: "you yourself" },
        "自己的事情自己做": { pinyin: "zì jǐ de shì qing zì jǐ zuò", ru: "свои дела делай сам", en: "do your own things yourself" },
      },
    },
  },
  {
    id: "zuo-meng",
    words: ["我", "做", "了", "一", "个", "梦", "，", "梦", "里", "有", "很", "多", "仙人掌", "！"],
    ru: "Мне приснился сон, а в нём было много кактусов!",
    en: "I had a dream, and it was full of cacti!",
    pinyin: { 一: "yí", 个: "ge" },
    note: {
      ru: "做梦 — «видеть сон»: 做 — делать, 梦 — сон. Сон как будто тоже надо «делать»! 美梦 — сладкий сон, 白日梦 — мечта наяву.",
      en: "做梦 is “to dream”: 做 to make, 梦 a dream. As if a dream had to be “made” too! 美梦 a sweet dream, 白日梦 a daydream.",
      terms: {
        "美梦": { pinyin: "měi mèng", ru: "сладкий сон", en: "sweet dream" },
        "白日梦": { pinyin: "bái rì mèng", ru: "мечты наяву", en: "daydream" },
      },
    },
  },
  {
    id: "kaoshi",
    words: ["你", "考试", "的", "时候", "，", "我", "会", "说", "：", "加油", "！"],
    ru: "Когда у тебя будет экзамен, я скажу: «加油!»",
    en: "When you have an exam, I'll say: “加油!”",
    note: {
      ru: "考试 — «экзамен»: 考 — проверять, 试 — пробовать. Самый важный экзамен в Китае — 高考, поступление в университет: результаты меняют всю жизнь. Панда держит за тебя лапы!",
      en: "考试 is “exam”: 考 to test, 试 to try. China's most important exam is 高考, university entrance: the result changes a whole life. The panda is rooting for you!",
    },
  },
  {
    id: "ting-li",
    words: ["听力", "很", "难", "，", "不过", "我", "喜欢", "。"],
    ru: "Аудирование трудное, но мне нравится.",
    en: "Listening is hard, but I like it.",
    pinyin: { 不过: "bú guò" },
    note: {
      ru: "听力 — «слух, аудирование»: 听 — слушать, 力 — сила. Тоны на слух различаются трудно: 买 mǎi «покупать» и 卖 mài «продавать» отличаются только тоном!",
      en: "听力 is “listening”: 听 to listen, 力 power. Tones are hard to tell by ear: 买 mǎi “buy” and 卖 mài “sell” differ only in tone!",
      terms: {
        "力": { pinyin: "lì", ru: "сила", en: "strength" },
      },
    },
  },
  {
    id: "fu-xi",
    words: ["复习", "很", "重要", "，", "预习", "也", "很", "重要", "。"],
    ru: "Повторение важно, и подготовка к уроку тоже.",
    en: "Review is important, and preview is too.",
    note: {
      ru: "复习 — «повторять»: 复 — снова, 习 — учиться. 预习 — «изучать заранее»: 预 — заранее. Сначала 预习, потом урок, потом 复习 — китайская школьная система в трёх словах.",
      en: "复习 is “to review”: 复 again, 习 to study. 预习 is “to preview”: 预 in advance. First 预习, then the lesson, then 复习 — the Chinese school system in three words.",
      terms: {
        "复": { pinyin: "fù", ru: "снова, повторно", en: "again" },
        "习": { pinyin: "xí", ru: "упражняться, учиться", en: "to practise" },
        "预": { pinyin: "yù", ru: "заранее", en: "in advance" },
      },
    },
  },
  {
    id: "yu-fa",
    words: ["汉语", "的", "语法", "不", "难", "。"],
    ru: "Грамматика китайского несложная.",
    en: "Chinese grammar is not hard.",
    note: {
      ru: "语法 — «грамматика»: 语 — язык, 法 — правило. Нет спряжений и склонений — зато есть счётные слова, частица 了 и строгий порядок слов: кто — когда — как — что делает.",
      en: "语法 is “grammar”: 语 language, 法 rule. No conjugations or cases — but there are measure words, the particle 了, and strict word order: who — when — how — does what.",
      terms: {
        "语": { pinyin: "yǔ", ru: "язык, речь", en: "language" },
      },
    },
  },
  {
    id: "hanzi-tai-duo",
    words: ["汉字", "太", "多", "了", "！"],
    ru: "Иероглифов слишком много!",
    en: "There are too many characters!",
    note: {
      ru: "Чтобы читать газету, нужно около 3000 иероглифов, а всего их десятки тысяч. Не пугайся: первая тысяча самых частых иероглифов покрывает около 90% любого текста.",
      en: "You need about 3000 characters to read a newspaper, and there are tens of thousands in total. Don't panic: the thousand most frequent characters cover about 90% of any text.",
    },
  },
  {
    id: "wu-liao",
    words: ["你", "无聊", "的", "时候", "做", "什么", "？"],
    ru: "Что ты делаешь, когда скучно?",
    en: "What do you do when you're bored?",
    note: {
      kind: "word",
      ru: "无聊 — «скучно»: 无 — нет, 聊 — болтать. Дословно «не с кем поболтать».",
      en: "无聊 means “bored”: 无 is no, 聊 is to chat. Literally “nobody to chat with”.",
      terms: {
        "无": { pinyin: "wú", ru: "нет, без", en: "no, without" },
        "聊": { pinyin: "liáo", ru: "болтать", en: "to chat" },
      },
    },
    replies: [
      {
        id: "read",
        words: ["我", "看", "书", "。"],
        ru: "Читаю.",
        en: "I read.",
        reaction: {
          words: ["看", "书", "很", "好", "！"],
          ru: "Читать — это здорово!",
          en: "Reading is great!",
        },
      },
      {
        id: "phone",
        words: ["我", "玩", "手机", "。"],
        ru: "Сижу в телефоне.",
        en: "I play on my phone.",
        reaction: {
          words: ["那", "我们", "一起", "学", "汉语", "吧", "！"],
          ru: "Тогда давай вместе учить китайский!",
          en: "Then let's study Chinese together!",
          pinyin: { 一起: "yì qǐ" },
        },
      },
      {
        id: "chinese",
        words: ["我", "学", "汉语", "！"],
        ru: "Учу китайский!",
        en: "I study Chinese!",
        reaction: {
          words: ["太", "好", "了", "！"],
          ru: "Отлично!",
          en: "Great!",
        },
      },
    ],
  },
  {
    id: "lei-le",
    words: ["你", "累", "的", "时候", "做", "什么", "？"],
    ru: "Что ты делаешь, когда устаёшь?",
    en: "What do you do when you're tired?",
    note: {
      kind: "why",
      ru: "Тому, кто устал после трудного дня, в Китае говорят 辛苦了 — «спасибо за труды». А «умираю от усталости» — 累死了: 死 — умереть, просто для преувеличения.",
      en: "In China you tell someone tired after a hard day 辛苦了 — “thanks for your hard work”. “Dead tired” is 累死了: 死 is to die, just for exaggeration.",
      terms: {
        "辛苦了": { pinyin: "xīn kǔ le", ru: "спасибо за труды", en: "thanks for your hard work" },
        "累死了": { pinyin: "lèi sǐ le", ru: "умираю от усталости", en: "dead tired" },
        "死": { pinyin: "sǐ", ru: "умереть", en: "to die" },
      },
    },
    replies: [
      {
        id: "sleep",
        words: ["我", "睡觉", "。"],
        ru: "Сплю.",
        en: "I sleep.",
        reaction: {
          words: ["睡觉", "最", "好", "了", "！"],
          ru: "Сон — лучше всего!",
          en: "Sleep is the best!",
        },
      },
      {
        id: "tea",
        words: ["我", "喝", "茶", "。"],
        ru: "Пью чай.",
        en: "I drink tea.",
        reaction: {
          words: ["我", "也", "是", "！", "我", "喜欢", "绿茶", "。"],
          ru: "Я тоже! Я люблю зелёный чай.",
          en: "Me too! I like green tea.",
        },
      },
      {
        id: "music",
        words: ["我", "听", "音乐", "。"],
        ru: "Слушаю музыку.",
        en: "I listen to music.",
        reaction: {
          words: ["音乐", "很", "好", "！"],
          ru: "Музыка — это хорошо!",
          en: "Music is good!",
        },
      },
    ],
  },
];

/**
 * ФРАЗЫ О КОМНАТЕ — отдельный набор: панда говорит одну из них (облачком), когда
 * в комнате появился новый предмет или поменялся старый (utils/panda/thoughts,
 * createThoughtIfDue). Не фраза дня: в дневной лимит не входят, в «Фразы дня» не
 * попадают и могут повторяться (только не та же, что в прошлый раз). Формат — как у
 * фраз дня; слова тоже должны быть начаты.
 */
export const roomPhrases: PandaPhrase[] = [
  {
    id: "room-like",
    words: ["我", "很", "喜欢", "我们", "的", "房间", "。"],
    ru: "Мне очень нравится наша комната.",
    en: "I really like our room.",
  },
  {
    id: "room-new",
    words: ["新", "的", "东西", "！", "真", "漂亮", "！"],
    ru: "Что-то новенькое! Как красиво!",
    en: "Something new! So pretty!",
    pinyin: { 东西: "dōng xi" },
  },
  {
    id: "room-thanks",
    words: ["房间", "真", "好看", "，", "谢谢", "你", "！"],
    ru: "Комната такая красивая, спасибо тебе!",
    en: "The room looks so nice, thank you!",
  },
  {
    id: "room-clean",
    words: ["房间", "真", "干净", "，", "谢谢", "你", "！"],
    ru: "Комната такая чистая, спасибо тебе!",
    en: "The room is so clean, thank you!",
    note: {
      ru: "干净 — «чистый»: 干 — сухой, 净 — чистый.",
      en: "干净 means “clean”: 干 dry, 净 clean.",
      terms: {
        "净": { pinyin: "jìng", ru: "чистый", en: "clean" },
      },
    },
  },
];

const byId = new Map(
  [...pandaPhrases, ...roomPhrases].map((phrase) => [phrase.id, phrase]),
);

export function findPandaPhrase(id: string): PandaPhrase | undefined {
  return byId.get(id);
}
