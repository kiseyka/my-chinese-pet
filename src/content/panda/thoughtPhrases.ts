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

// Тестовые фразы — замени своими
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
];

const byId = new Map(
  [...pandaPhrases, ...roomPhrases].map((phrase) => [phrase.id, phrase]),
);

export function findPandaPhrase(id: string): PandaPhrase | undefined {
  return byId.get(id);
}
