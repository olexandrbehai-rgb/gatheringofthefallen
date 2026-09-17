export type Lang = "ua" | "en" | "fr";

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "ua", label: "UA", flag: "🇺🇦" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "fr", label: "FR", flag: "🇫🇷" },
];

type Dict = Record<string, any>;

const ua: Dict = {
  nav: {
    home: "Головна",
    about: "Про гурт",
    music: "Музика",
    merch: "Мерч",
    contacts: "Контакти",
  },
  footer: {
    transmission: "TRANSMISSION ENCRYPTED",
  },
  home: {
    albumBadge: "НОВИЙ АЛЬБОМ: !3 ПОСЛАНЬ — ВЖЕ У МЕРЕЖІ",
    albumTitle: "!3 ПОСЛАНЬ",
    albumDesc:
      "!3 Послань — це музичний маніфест, що складається з трьох ключових меседжів для тих, хто вижив у руїнах старого світу. Це голос нового племені живих.",
    listenAlbum: "Слухати альбом",
    memoryAlbumBadge: "НОВИЙ АЛЬБОМ — ВЖЕ У МЕРЕЖІ",
    memoryAlbumTitle: "ЗІБРАННЯ СПОГАДІВ",
    memoryAlbumDesc:
      "Нова платівка про те, що залишається з нами після падіння: голоси, вулиці, любов і пам'ять, яку неможливо знищити.",
    listenMemoryAlbum: "Слухати альбом",
    slogan: "З попелу встаємо 🔥",
    bandDesc:
      "Gathering Of The Fallen — український gothic / cinematic industrial metal гурт. 65+ треків, нові релізи кожен місяць. Музика народжується з вогню, шрамів і незламної волі.",
    listenMusic: "Слухати музику",
    goMerch: "Перейти до мерчу",
    bandHeading: "Гурт — Новий склад 2026",
    groupAlt: "Новий склад Gathering Of The Fallen у фіолетово-синіх неонових руїнах",
    oleksandrAlt: "Олександр, засновник гурту, з гітарою на головній сцені",
    latestHeading: "Останні релізи",
    mainTrack: "Головний трек",
    releases: [
      { title: "Вогонь в руках", type: "СИНГЛ З АЛЬБОМУ !3 ПОСЛАНЬ", date: "2026" },
      { title: "!3 Послань", type: "АЛЬБОМ", date: "2026" },
      { title: "Із Попелу", type: "СИНГЛ", date: "2025" },
    ],
    merchHeading: "Наш мерч",
    merchAlt: "Мерч Gathering Of The Fallen",
  },
  about: {
    title: "ПРО ГУРТ",
    quote:
      "\"Gathering of the Fallen — це темна сила, що піднімається з попелу забутих легенд. Ми збираємо занепалих, щоб вони встали ще сильнішими. Наша музика — це поєднання важких рифів, містичних мелодій, емоцій і древніх ритуалів. Кожен звук — це історія падіння і відродження, кожен виступ — це обряд, у якому темрява стає світлом.\"",
    photoTitles: {
      group: "Новий склад Gathering of the Fallen — 2026",
      daryna: "Клавішна стихія Дарини",
    },
    members: [
      {
        name: "Олександр",
        role: "засновник гурту, електрогітарист та автор пісень",
        description:
          "Олександр — засновник Gathering of the Fallen, архітектор нашої темряви і творець пісень, що народжуються з вогню, шрамів і незламної волі. Його гітара розтинає ніч, немов блискавка над спаленим небом, а рифи ведуть гурт крізь бурю, де кожен звук стає клятвою сили. Він не просто пише музику — він викарбовує дороги для тих, хто йде крізь попіл і не боїться підняти голову до полум'яного горизонту.",
      },
      {
        name: "Тетяна",
        role: "співзасновниця гурту, бас-гітаристка",
        description:
          "Тетяна — співзасновниця Gathering of the Fallen, королева низьких частот і темного фундаменту, на якому тримається вся наша стихія. Її бас звучить як глибокий пульс землі під ногами воїнів, як древній заклик безодні, що не дозволяє музиці впасти в тишу. Вона несе холодну силу й вогняну гідність, перетворюючи кожен трек на ритуал відродження.",
      },
      {
        name: "Ярослав",
        role: "барабанщик",
        description:
          "Ярослав — барабанщик Gathering of the Fallen, шалений ритм хаосу і відродження, що змушує серце битися в унісон із полум'ям сцени. Його удар — це грім проклятого неба, його темп — це штурм, від якого здригаються руїни та оживають легенди. Він перетворює кожну композицію на похід крізь бурю, де ритм стає зброєю, а звук — незламною опорою для всіх, хто йде поруч.",
      },
      {
        name: "Дарина",
        role: "клавішниця",
        description:
          "Дарина — клавішниця Gathering of the Fallen, хранителька атмосферних мелодій і містичних шарів, що огортають нашу музику туманом і зоряним пилом. Її клавіші відкривають брами між світами, де темрява співає, а світло народжується з попелу. Вона створює простір, у якому кожна нота стає шепотом стародавнього закляття, а кожен акорд — кроком у безодню прекрасного й величного.",
      },
    ],
  },
  music: {
    title: "МУЗИКА",
    subtitle: "Офіційні треки гурту",
    newAlbumBadge: "НОВИЙ АЛЬБОМ — ВЖЕ У МЕРЕЖІ",
    albumTitle: "!3 ПОСЛАНЬ",
    albumDesc:
      "!3 Послань — це музичний маніфест, що складається з трьох ключових меседжів для тих, хто вижив у руїнах старого світу. Це голос нового племені живих.",
    mainSingleLabel: "Головний сингл альбому",
    watchClip: "Дивитися кліп",
    listenYTMusic: "Слухати в YouTube Music",
    otherTracks: "Інші треки",
    watchYouTube: "Дивитися на YouTube",
    allOnYouTube: "Всі треки на YouTube",
    featured: {
      title: "У танці з попелом",
      description:
        "Новий головний сингл гурту. Коли все згоріло — лишається танець. Пісня про те, як знаходити життя й красу серед руїн, перетворювати втрату на рух уперед і більше не боятися попелу минулого.",
    },
    tracks: [
      {
        title: "Підіймай Вогонь",
        description:
          "Заклик не згаснути. Коли світ намагається зламати — ти підіймаєш вогонь усередині й ідеш далі. Гімн незламних, що тримають полум'я духу попри все.",
      },
      {
        title: "Чуже Лице",
        description:
          "Дзеркало, в якому вже не впізнаєш себе. Пісня про відчуження на чужині, про маски, які доводиться носити, і про біль, коли власне відображення стає чужим.",
      },
      {
        title: "Нічний Снайпер",
        description:
          "Тиша перед пострілом. Історія самотнього захисника, що пильнує в темряві, поки інші сплять. Про ціну спокою і тих, хто тримає ніч на своїх плечах.",
      },
      {
        title: "Бас і Дим",
        description:
          "Ніч, бас і дим над містом. Трек про адреналін свободи, про вулиці, що оживають після темряви, і про драйв, який не дає здатися.",
      },
      {
        title: "Блукаючий Козак",
        description:
          "Козацька душа, що не знає кордонів. Пісня про вільного воїна, який блукає світом і всюди несе нескорений український дух. Дорога, степ і воля — у кожному акорді.",
      },
      {
        title: "Псалми",
        description:
          "Молитва двох сердець під дощем. Найніжніша пісня гурту — про любов, що стає вірою, і про тепло, яке рятує навіть тоді, коли світ навколо холодний.",
      },
      {
        title: "Вогонь в руках",
        description:
          "Сингл з альбому «!3 Послань». Внутрішня сила, яку ніхто не здатен відібрати. Далеко від дому, під чужим небом — ми тримаємо полум'я українського духу і не дамо йому згаснути.",
      },
      {
        title: "Through the Ashes (Із Попелу)",
        description:
          "Ми згоріли, але встали. Попіл минулого — це фундамент нового. Пісня про кожного українця, який піднявся після падіння і йде далі з вогнем у серці.",
      },
      {
        title: "Молодість",
        description:
          "Спогади про рідні вулиці, про тих, кого залишили. Молодість, яка назавжди лишилась в Україні — але живе в кожному акорді цієї пісні.",
      },
      {
        title: "Емігрант",
        description:
          "Серце тут, душа — там. Пісня про тих, хто живе між двома світами, несучи Україну всюди, куди забирає доля. Біль розлуки і незламна воля.",
      },
      {
        title: "Реквієм Народу",
        description:
          "Пам'ять про тих, хто боровся і не здався. Реквієм для народу, який пройшов через століття випробувань — і не зламався. Наш поклон кожному борцю.",
      },
      {
        title: "Пустеля Душ",
        description:
          "Дні, коли всередині — тиша і пустота. Коли рідних голосів не чути за тисячі кілометрів. Лише музика здатна повернути дощ у висохлу душу емігранта.",
      },
    ],
  },
  merch: {
    title: "МЕРЧ",
    subtitle: "Оплата карткою через Stripe | CAD",
    paid: "Замовлення оплачено!",
    paidDetails: "Дякуємо за замовлення! Деталі доставки будуть надіслані на вашу пошту.",
    close: "Закрити",
    galleryAlt: "Колекція мерчу Gathering Of The Fallen",
    size: "Розмір:",
    quantity: "Кількість:",
    redirecting: "ПЕРЕНАПРАВЛЕННЯ...",
    pay: "ОПЛАТИТИ",
    products: {
      "t-shirt": "Футболка GF",
      hoodie: "Худі Повалених",
      bomber: "Бомбер GF",
      cap: "Кепка Fallen",
    },
  },
  contacts: {
    title: "КОНТАКТИ",
    terminalHeading: "ТЕРМІНАЛ ЗВ'ЯЗКУ",
    sendHeading: "ВІДПРАВИТИ СИГНАЛ",
    labels: {
      videoArchive: "ВІДЕОАРХІВ",
      photo: "ФОТОХРОНІКИ",
      shortMsg: "КОРОТКІ ПОВІДОМЛЕННЯ",
      survivors: "МЕРЕЖА ВИЖИВШИХ",
      directLink: "ПРЯМИЙ ЗВ'ЯЗОК",
      facebookCommunity: "Facebook Спільнота",
    },
    form: {
      name: "> ІДЕНТИФІКАТОР [ІМ'Я]",
      email: "> ЧАСТОТА ЗВОРОТНОГО ЗВ'ЯЗКУ [EMAIL]",
      message: "> ПОВІДОМЛЕННЯ",
      placeholderMsg: "Введіть текст трансляції...",
      submit: "ТРАНСЛЮВАТИ",
    },
  },
  secret: {
    intercept: "TRANSMISSION INTERCEPTED",
    poem:
      "\"Ми — тіні, що танцюють у вогні\nМи — голоси, що лунають у пустці\nМи — останній подих згасаючого світу\nМи — Gathering Of The Fallen\"",
    archive: "[ ACCESS ARCHIVE ]",
    abort: "[ ESC TO ABORT ]",
  },
};

const en: Dict = {
  nav: {
    home: "Home",
    about: "About",
    music: "Music",
    merch: "Merch",
    contacts: "Contacts",
  },
  footer: {
    transmission: "TRANSMISSION ENCRYPTED",
  },
  home: {
    albumBadge: "NEW ALBUM: !3 MESSAGES — OUT NOW",
    albumTitle: "!3 MESSAGES",
    albumDesc:
      "!3 Messages is a musical manifesto built from three key transmissions for those who survived the ruins of the old world. It is the voice of a new tribe of the living.",
    listenAlbum: "Listen to the album",
    memoryAlbumBadge: "NEW ALBUM — OUT NOW",
    memoryAlbumTitle: "GATHERING OF MEMORIES",
    memoryAlbumDesc:
      "A new record about what remains after the fall: voices, streets, love, and memories that cannot be erased.",
    listenMemoryAlbum: "Listen to the album",
    slogan: "Rising from the ashes 🔥",
    bandDesc:
      "Gathering Of The Fallen — Ukrainian gothic / cinematic industrial metal band. 65+ tracks, new releases every month. Music born from fire, scars, and unbreakable will.",
    listenMusic: "Listen to music",
    goMerch: "Go to merch",
    bandHeading: "The Band — New Lineup 2026",
    groupAlt: "New Gathering Of The Fallen lineup amid violet-blue neon ruins",
    oleksandrAlt: "Oleksandr, founder of the band, with a guitar on the main stage",
    latestHeading: "Latest releases",
    mainTrack: "Main track",
    releases: [
      { title: "Fire in the Hands", type: "SINGLE FROM !3 MESSAGES", date: "2026" },
      { title: "!3 Messages", type: "ALBUM", date: "2026" },
      { title: "From the Ashes", type: "SINGLE", date: "2025" },
    ],
    merchHeading: "Our merch",
    merchAlt: "Gathering Of The Fallen merch",
  },
  about: {
    title: "ABOUT THE BAND",
    quote:
      "\"Gathering of the Fallen is a dark force rising from the ashes of forgotten legends. We gather the fallen so they may rise stronger. Our music is heavy riffs, mystical melodies, raw emotion and ancient ritual. Every sound is a story of falling and rebirth, every show a rite where darkness becomes light.\"",
    photoTitles: {
      group: "New Gathering of the Fallen lineup — 2026",
      daryna: "Daryna's keyboard storm",
    },
    members: [
      {
        name: "Oleksandr",
        role: "founder, electric guitarist and songwriter",
        description:
          "Oleksandr is the founder of Gathering of the Fallen, the architect of our darkness and the author of songs born from fire, scars and unbreakable will. His guitar splits the night like lightning over a burning sky, and his riffs lead the band through a storm where every sound becomes an oath of strength. He doesn't just write music — he carves roads for those who walk through the ashes and dare to lift their heads toward the burning horizon.",
      },
      {
        name: "Tetiana",
        role: "co-founder, bass guitarist",
        description:
          "Tetiana is the co-founder of Gathering of the Fallen, queen of the low frequencies and the dark foundation that holds our entire sound. Her bass pulses like the deep heartbeat of the earth beneath warriors' feet, an ancient call from the abyss that refuses to let the music fall silent. She carries cold strength and fiery dignity, turning every track into a ritual of rebirth.",
      },
      {
        name: "Yaroslav",
        role: "drummer",
        description:
          "Yaroslav is the drummer of Gathering of the Fallen — a wild rhythm of chaos and rebirth that makes the heart beat in unison with the flame of the stage. His strike is the thunder of a cursed sky; his tempo is an assault that shakes the ruins and wakes the legends. He turns every composition into a march through the storm, where rhythm becomes a weapon and sound becomes unbreakable support for all who walk beside us.",
      },
      {
        name: "Daryna",
        role: "keyboardist",
        description:
          "Daryna is the keyboardist of Gathering of the Fallen, keeper of atmospheric melodies and mystical layers that wrap our music in fog and stardust. Her keys open gates between worlds, where darkness sings and light is born from ashes. She builds spaces where every note becomes the whisper of an ancient spell, and every chord a step into a beautiful, towering abyss.",
      },
    ],
  },
  music: {
    title: "MUSIC",
    subtitle: "Official band tracks",
    newAlbumBadge: "NEW ALBUM — OUT NOW",
    albumTitle: "!3 MESSAGES",
    albumDesc:
      "!3 Messages is a musical manifesto built from three key transmissions for those who survived the ruins of the old world. It is the voice of a new tribe of the living.",
    mainSingleLabel: "Lead single from the album",
    watchClip: "Watch the clip",
    listenYTMusic: "Listen on YouTube Music",
    otherTracks: "Other tracks",
    watchYouTube: "Watch on YouTube",
    allOnYouTube: "All tracks on YouTube",
    featured: {
      title: "A Dance with the Ashes",
      description:
        "The band's new lead single. When everything has burned, the dance remains. A song about finding life and beauty among the ruins, turning loss into motion forward, and no longer fearing the ashes of the past.",
    },
    tracks: [
      {
        title: "Raise the Fire",
        description:
          "A call to never go out. When the world tries to break you, you raise the fire within and keep going. An anthem for the unbreakable who carry the flame of the spirit through everything.",
      },
      {
        title: "Stranger's Face",
        description:
          "A mirror in which you no longer recognize yourself. A song about estrangement in a foreign land, about the masks we are forced to wear, and the ache when your own reflection becomes a stranger.",
      },
      {
        title: "Night Sniper",
        description:
          "The silence before the shot. The story of a lone defender keeping watch in the dark while others sleep. About the price of peace and those who carry the night on their shoulders.",
      },
      {
        title: "Bass and Smoke",
        description:
          "Night, bass and smoke over the city. A track about the adrenaline of freedom, streets that come alive after dark, and the drive that won't let you give up.",
      },
      {
        title: "Wandering Cossack",
        description:
          "A Cossack soul that knows no borders. A song about a free warrior roaming the world, carrying the unconquered Ukrainian spirit everywhere. The road, the steppe and freedom — in every chord.",
      },
      {
        title: "Psalms",
        description:
          "A prayer of two hearts in the rain. The band's most tender song — about love that becomes faith, and the warmth that saves even when the world around is cold.",
      },
      {
        title: "Fire in the Hands",
        description:
          "A single from the album «!3 Messages». An inner strength no one can take away. Far from home, under foreign skies — we hold the flame of the Ukrainian spirit and will not let it die.",
      },
      {
        title: "Through the Ashes",
        description:
          "We burned, but we rose. The ashes of the past are the foundation of the new. A song for every Ukrainian who got back up after falling and walks on with fire in the heart.",
      },
      {
        title: "Youth",
        description:
          "Memories of the streets we knew, of those we left behind. The youth that stayed in Ukraine forever — yet lives on in every chord of this song.",
      },
      {
        title: "Emigrant",
        description:
          "Heart here, soul there. A song for those who live between two worlds, carrying Ukraine wherever fate takes them. The pain of separation and unbreakable will.",
      },
      {
        title: "Requiem of the People",
        description:
          "Memory of those who fought and never surrendered. A requiem for a people that has weathered centuries of trials — and has not broken. Our bow to every fighter.",
      },
      {
        title: "Desert of Souls",
        description:
          "Days when there is only silence and emptiness inside. When the voices of loved ones cannot be heard across thousands of kilometers. Only music can return rain to the parched soul of an emigrant.",
      },
    ],
  },
  merch: {
    title: "MERCH",
    subtitle: "Card payment via Stripe | CAD",
    paid: "Order paid!",
    paidDetails: "Thank you for your order! Shipping details will be sent to your email.",
    close: "Close",
    galleryAlt: "Gathering Of The Fallen merch collection",
    size: "Size:",
    quantity: "Quantity:",
    redirecting: "REDIRECTING...",
    pay: "PAY",
    products: {
      "t-shirt": "GF T-Shirt",
      hoodie: "Fallen Hoodie",
      bomber: "GF Bomber",
      cap: "Fallen Cap",
    },
  },
  contacts: {
    title: "CONTACTS",
    terminalHeading: "COMMS TERMINAL",
    sendHeading: "SEND A SIGNAL",
    labels: {
      videoArchive: "VIDEO ARCHIVE",
      photo: "PHOTO CHRONICLES",
      shortMsg: "SHORT MESSAGES",
      survivors: "NETWORK OF SURVIVORS",
      directLink: "DIRECT LINK",
      facebookCommunity: "Facebook Community",
    },
    form: {
      name: "> IDENTIFIER [NAME]",
      email: "> RETURN FREQUENCY [EMAIL]",
      message: "> MESSAGE",
      placeholderMsg: "Enter the broadcast text...",
      submit: "BROADCAST",
    },
  },
  secret: {
    intercept: "TRANSMISSION INTERCEPTED",
    poem:
      "\"We are the shadows that dance in the fire\nWe are the voices that echo in the void\nWe are the last breath of a fading world\nWe are Gathering Of The Fallen\"",
    archive: "[ ACCESS ARCHIVE ]",
    abort: "[ ESC TO ABORT ]",
  },
};

const fr: Dict = {
  nav: {
    home: "Accueil",
    about: "Le groupe",
    music: "Musique",
    merch: "Merch",
    contacts: "Contacts",
  },
  footer: {
    transmission: "TRANSMISSION CHIFFRÉE",
  },
  home: {
    albumBadge: "NOUVEL ALBUM : !3 MESSAGES — DISPONIBLE",
    albumTitle: "!3 MESSAGES",
    albumDesc:
      "!3 Messages est un manifeste musical composé de trois messages clés pour ceux qui ont survécu aux ruines de l'ancien monde. C'est la voix d'une nouvelle tribu des vivants.",
    listenAlbum: "Écouter l'album",
    memoryAlbumBadge: "NOUVEL ALBUM — DISPONIBLE",
    memoryAlbumTitle: "RÉUNION DES SOUVENIRS",
    memoryAlbumDesc:
      "Un nouvel album sur ce qui reste après la chute : les voix, les rues, l'amour et les souvenirs impossibles à effacer.",
    listenMemoryAlbum: "Écouter l'album",
    slogan: "On se relève des cendres 🔥",
    bandDesc:
      "Gathering Of The Fallen — groupe ukrainien de gothic / cinematic industrial metal. 65+ titres, nouvelles sorties chaque mois. Musique née du feu, des cicatrices et d'une volonté inébranlable.",
    listenMusic: "Écouter la musique",
    goMerch: "Voir le merch",
    bandHeading: "Le groupe — Nouvelle formation 2026",
    groupAlt: "La nouvelle formation de Gathering Of The Fallen dans des ruines néon violet-bleu",
    oleksandrAlt: "Oleksandr, fondateur du groupe, avec une guitare sur la scène principale",
    latestHeading: "Dernières sorties",
    mainTrack: "Titre phare",
    releases: [
      { title: "Le feu dans les mains", type: "SINGLE DE !3 MESSAGES", date: "2026" },
      { title: "!3 Messages", type: "ALBUM", date: "2026" },
      { title: "Des cendres", type: "SINGLE", date: "2025" },
    ],
    merchHeading: "Notre merch",
    merchAlt: "Merch Gathering Of The Fallen",
  },
  about: {
    title: "LE GROUPE",
    quote:
      "« Gathering of the Fallen, c'est une force sombre qui s'élève des cendres de légendes oubliées. Nous rassemblons les déchus pour qu'ils se relèvent plus forts. Notre musique : des riffs lourds, des mélodies mystiques, de l'émotion brute et d'anciens rituels. Chaque son raconte une chute et une renaissance, chaque concert est un rite où l'obscurité devient lumière. »",
    photoTitles: {
      group: "Nouvelle formation de Gathering of the Fallen — 2026",
      daryna: "La tempête de claviers de Daryna",
    },
    members: [
      {
        name: "Oleksandr",
        role: "fondateur du groupe, guitariste électrique et auteur-compositeur",
        description:
          "Oleksandr est le fondateur de Gathering of the Fallen, l'architecte de notre obscurité et l'auteur de chansons nées du feu, des cicatrices et d'une volonté inébranlable. Sa guitare déchire la nuit comme la foudre sur un ciel en flammes, et ses riffs guident le groupe à travers la tempête, où chaque son devient un serment de force. Il n'écrit pas seulement de la musique — il taille des routes pour ceux qui marchent dans les cendres et osent lever la tête vers l'horizon en feu.",
      },
      {
        name: "Tetiana",
        role: "co-fondatrice, bassiste",
        description:
          "Tetiana est la co-fondatrice de Gathering of the Fallen, reine des basses fréquences et fondation sombre qui soutient tout notre univers sonore. Sa basse bat comme le pouls profond de la terre sous les pieds des guerriers, un appel ancien de l'abîme qui empêche la musique de retomber dans le silence. Elle porte une force froide et une dignité ardente, transformant chaque morceau en rituel de renaissance.",
      },
      {
        name: "Yaroslav",
        role: "batteur",
        description:
          "Yaroslav est le batteur de Gathering of the Fallen — un rythme sauvage de chaos et de renaissance qui fait battre le cœur à l'unisson avec la flamme de la scène. Sa frappe est le tonnerre d'un ciel maudit ; son tempo, un assaut qui ébranle les ruines et réveille les légendes. Il transforme chaque composition en une marche à travers la tempête, où le rythme devient une arme et le son un appui inébranlable pour tous ceux qui marchent à nos côtés.",
      },
      {
        name: "Daryna",
        role: "claviériste",
        description:
          "Daryna est la claviériste de Gathering of the Fallen, gardienne des mélodies atmosphériques et des couches mystiques qui enveloppent notre musique de brume et de poussière d'étoiles. Ses claviers ouvrent des portes entre les mondes, où l'obscurité chante et la lumière naît des cendres. Elle bâtit des espaces où chaque note devient le murmure d'un sortilège ancien, et chaque accord, un pas dans un abîme magnifique et imposant.",
      },
    ],
  },
  music: {
    title: "MUSIQUE",
    subtitle: "Titres officiels du groupe",
    newAlbumBadge: "NOUVEL ALBUM — DISPONIBLE",
    albumTitle: "!3 MESSAGES",
    albumDesc:
      "!3 Messages est un manifeste musical composé de trois messages clés pour ceux qui ont survécu aux ruines de l'ancien monde. C'est la voix d'une nouvelle tribu des vivants.",
    mainSingleLabel: "Single phare de l'album",
    watchClip: "Voir le clip",
    listenYTMusic: "Écouter sur YouTube Music",
    otherTracks: "Autres titres",
    watchYouTube: "Voir sur YouTube",
    allOnYouTube: "Tous les titres sur YouTube",
    featured: {
      title: "Une danse avec les cendres",
      description:
        "Le nouveau single phare du groupe. Quand tout a brûlé, il reste la danse. Une chanson sur la façon de trouver la vie et la beauté parmi les ruines, de transformer la perte en élan vers l'avant, et de ne plus craindre les cendres du passé.",
    },
    tracks: [
      {
        title: "Lève le feu",
        description:
          "Un appel à ne jamais s'éteindre. Quand le monde veut te briser, tu ranimes le feu en toi et tu avances. Un hymne pour les indomptables qui portent la flamme de l'esprit malgré tout.",
      },
      {
        title: "Visage étranger",
        description:
          "Un miroir où tu ne te reconnais plus. Une chanson sur l'éloignement en terre étrangère, sur les masques que l'on doit porter, et la douleur quand ton propre reflet devient un inconnu.",
      },
      {
        title: "Le sniper de nuit",
        description:
          "Le silence avant le tir. L'histoire d'un défenseur solitaire qui veille dans l'obscurité pendant que les autres dorment. Sur le prix de la paix et ceux qui portent la nuit sur leurs épaules.",
      },
      {
        title: "Basse et fumée",
        description:
          "La nuit, la basse et la fumée sur la ville. Un titre sur l'adrénaline de la liberté, les rues qui s'animent après la tombée du jour, et l'énergie qui empêche d'abandonner.",
      },
      {
        title: "Le Cosaque errant",
        description:
          "Une âme cosaque qui ne connaît pas de frontières. Une chanson sur un guerrier libre qui parcourt le monde, portant partout l'esprit ukrainien invaincu. La route, la steppe et la liberté — dans chaque accord.",
      },
      {
        title: "Psaumes",
        description:
          "La prière de deux cœurs sous la pluie. La chanson la plus tendre du groupe — sur l'amour qui devient foi, et la chaleur qui sauve même quand le monde alentour est froid.",
      },
      {
        title: "Le feu dans les mains",
        description:
          "Un single de l'album « !3 Messages ». Une force intérieure que personne ne peut nous prendre. Loin de chez nous, sous des cieux étrangers — nous gardons la flamme de l'esprit ukrainien et ne la laisserons pas s'éteindre.",
      },
      {
        title: "Des cendres",
        description:
          "Nous avons brûlé, mais nous nous sommes relevés. Les cendres du passé sont les fondations du nouveau. Une chanson pour chaque Ukrainien qui s'est relevé après la chute et avance avec le feu au cœur.",
      },
      {
        title: "Jeunesse",
        description:
          "Souvenirs des rues familières, de ceux que l'on a laissés. Une jeunesse restée à jamais en Ukraine — mais vivante dans chaque accord de cette chanson.",
      },
      {
        title: "Émigrant",
        description:
          "Le cœur ici, l'âme là-bas. Une chanson pour ceux qui vivent entre deux mondes, portant l'Ukraine partout où le destin les emmène. Douleur de la séparation et volonté inébranlable.",
      },
      {
        title: "Requiem du peuple",
        description:
          "Mémoire de ceux qui ont combattu et ne se sont pas rendus. Un requiem pour un peuple qui a traversé des siècles d'épreuves — sans se briser. Notre hommage à chaque combattant.",
      },
      {
        title: "Désert des âmes",
        description:
          "Ces jours où il n'y a que silence et vide à l'intérieur. Quand les voix des proches ne s'entendent plus à des milliers de kilomètres. Seule la musique peut faire revenir la pluie dans l'âme desséchée d'un émigrant.",
      },
    ],
  },
  merch: {
    title: "MERCH",
    subtitle: "Paiement par carte via Stripe | CAD",
    paid: "Commande payée !",
    paidDetails:
      "Merci pour votre commande ! Les détails de livraison vous seront envoyés par e-mail.",
    close: "Fermer",
    galleryAlt: "Collection merch Gathering Of The Fallen",
    size: "Taille :",
    quantity: "Quantité :",
    redirecting: "REDIRECTION...",
    pay: "PAYER",
    products: {
      "t-shirt": "T-shirt GF",
      hoodie: "Sweat Fallen",
      bomber: "Bomber GF",
      cap: "Casquette Fallen",
    },
  },
  contacts: {
    title: "CONTACTS",
    terminalHeading: "TERMINAL DE COMMUNICATION",
    sendHeading: "ENVOYER UN SIGNAL",
    labels: {
      videoArchive: "ARCHIVES VIDÉO",
      photo: "CHRONIQUES PHOTO",
      shortMsg: "MESSAGES COURTS",
      survivors: "RÉSEAU DES SURVIVANTS",
      directLink: "LIEN DIRECT",
      facebookCommunity: "Communauté Facebook",
    },
    form: {
      name: "> IDENTIFIANT [NOM]",
      email: "> FRÉQUENCE DE RETOUR [E-MAIL]",
      message: "> MESSAGE",
      placeholderMsg: "Saisissez le texte de la transmission...",
      submit: "DIFFUSER",
    },
  },
  secret: {
    intercept: "TRANSMISSION INTERCEPTÉE",
    poem:
      "« Nous sommes les ombres qui dansent dans le feu\nNous sommes les voix qui résonnent dans le vide\nNous sommes le dernier souffle d'un monde qui s'éteint\nNous sommes Gathering Of The Fallen »",
    archive: "[ ACCÉDER AUX ARCHIVES ]",
    abort: "[ ESC POUR ABANDONNER ]",
  },
};

export const TRANSLATIONS: Record<Lang, Dict> = { ua, en, fr };

export function lookup(dict: Dict, path: string): unknown {
  return path.split(".").reduce<any>((acc, key) => (acc == null ? acc : acc[key]), dict);
}
