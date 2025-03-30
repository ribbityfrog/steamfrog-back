import Language from '#models/catalogues/language'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    await Language.updateOrCreateMany('id', [
      {
        id: 0,
        lang: 'english',
        code: 'en',
      },
      {
        id: 1,
        lang: 'german',
        code: 'de',
      },
      {
        id: 2,
        lang: 'french',
        code: 'fr',
      },
      {
        id: 3,
        lang: 'italian',
        code: 'it',
      },
      {
        id: 4,
        lang: 'korean',
        code: 'ko',
      },
      {
        id: 5,
        lang: 'spanish',
        code: 'es',
      },
      {
        id: 6,
        lang: 'chinese - simplified',
        code: 'zh-CN',
      },
      {
        id: 7,
        lang: 'chinese - traditional',
        code: 'zh-TW',
      },
      {
        id: 8,
        lang: 'russian',
        code: 'ru',
      },
      {
        id: 9,
        lang: 'thai',
        code: 'th',
      },
      {
        id: 10,
        lang: 'japanese',
        code: 'ja',
      },
      {
        id: 11,
        lang: 'portuguese',
        code: 'pt',
      },
      {
        id: 12,
        lang: 'polish',
        code: 'pl',
      },
      {
        id: 13,
        lang: 'danish',
        code: 'da',
      },
      {
        id: 14,
        lang: 'dutch',
        code: 'nl',
      },
      {
        id: 15,
        lang: 'finnish',
        code: 'fi',
      },
      {
        id: 16,
        lang: 'norwegian',
        code: 'no',
      },
      {
        id: 17,
        lang: 'sweedish',
        code: 'sv',
      },
      {
        id: 18,
        lang: 'hungarian',
        code: 'hu',
      },
      {
        id: 19,
        lang: 'czech',
        code: 'cs',
      },
      {
        id: 20,
        lang: 'romanian',
        code: 'ro',
      },
      {
        id: 21,
        lang: 'turkish',
        code: 'tr',
      },
      {
        id: 22,
        lang: 'portuguese - brazil',
        code: 'pt-BR',
      },
      {
        id: 23,
        lang: 'bulgarian',
        code: 'bg',
      },
      {
        id: 24,
        lang: 'greek',
        code: 'el',
      },
      {
        id: 25,
        lang: 'arabic',
        code: 'ar',
      },
      {
        id: 26,
        lang: 'ukrainian',
        code: 'uk',
      },
      {
        id: 28,
        lang: 'vietnamese',
        code: 'vi',
      },
      {
        id: 29,
        lang: 'spanish - latin america',
        code: 'es-419',
      },
      {
        id: 30,
        lang: 'indonesian',
        code: 'id',
      },
      {
        id: 1000,
        lang: 'afrikaans',
      },
      {
        id: 1001,
        lang: 'albanian',
      },
      {
        id: 1002,
        lang: 'amharic',
      },
      {
        id: 1003,
        lang: 'armenian',
      },
      {
        id: 1004,
        lang: 'assamese',
      },
      {
        id: 1005,
        lang: 'azerbaijani',
      },
      {
        id: 1006,
        lang: 'bangla',
      },
      {
        id: 1007,
        lang: 'basque',
      },
      {
        id: 1008,
        lang: 'belarusian',
      },
      {
        id: 1009,
        lang: 'bosnian',
      },
      {
        id: 1010,
        lang: 'catalan',
      },
      {
        id: 1011,
        lang: 'cherokee',
      },
      {
        id: 1012,
        lang: 'croatian',
      },
      {
        id: 1013,
        lang: 'dari',
      },
      {
        id: 1014,
        lang: 'estonian',
      },
      {
        id: 1015,
        lang: 'filipino',
      },
      {
        id: 1016,
        lang: 'galician',
      },
      {
        id: 1017,
        lang: 'georgian',
      },
      {
        id: 1018,
        lang: 'gujarati',
      },
      {
        id: 1019,
        lang: 'punjabi (gurmukhi)',
      },
      {
        id: 1020,
        lang: 'hausa',
      },
      {
        id: 1021,
        lang: 'hebrew',
      },
      {
        id: 1022,
        lang: 'hindi',
      },
      {
        id: 1023,
        lang: 'icelandic',
      },
      {
        id: 1024,
        lang: 'igbo',
      },
      {
        id: 1026,
        lang: 'irish',
      },
      {
        id: 1027,
        lang: 'kannada',
      },
      {
        id: 1028,
        lang: 'kazakh',
      },
      {
        id: 1029,
        lang: 'khmer',
      },
      {
        id: 1030,
        lang: "k'iche'",
      },
      {
        id: 1031,
        lang: 'kinyarwanda',
      },
      {
        id: 1032,
        lang: 'konkani',
      },
      {
        id: 1033,
        lang: 'kyrgyz',
      },
      {
        id: 1034,
        lang: 'latvian',
      },
      {
        id: 1035,
        lang: 'lithuanian',
      },
      {
        id: 1036,
        lang: 'luxembourgish',
      },
      {
        id: 1037,
        lang: 'macedonian',
      },
      {
        id: 1038,
        lang: 'malay',
      },
      {
        id: 1039,
        lang: 'malayalam',
      },
      {
        id: 1040,
        lang: 'maltese',
      },
      {
        id: 1041,
        lang: 'maori',
      },
      {
        id: 1042,
        lang: 'marathi',
      },
      {
        id: 1043,
        lang: 'mongolian',
      },
      {
        id: 1044,
        lang: 'nepali',
      },
      {
        id: 1045,
        lang: 'odia',
      },
      {
        id: 1046,
        lang: 'persian',
      },
      {
        id: 1047,
        lang: 'quechua',
      },
      {
        id: 1048,
        lang: 'scots',
      },
      {
        id: 1049,
        lang: 'serbian',
      },
      {
        id: 1050,
        lang: 'punjabi (shahmukhi)',
      },
      {
        id: 1051,
        lang: 'sindhi',
      },
      {
        id: 1052,
        lang: 'sinhala',
      },
      {
        id: 1053,
        lang: 'slovak',
      },
      {
        id: 1054,
        lang: 'slovenian',
      },
      {
        id: 1055,
        lang: 'sorani',
      },
      {
        id: 1056,
        lang: 'sotho',
      },
      {
        id: 1057,
        lang: 'swahili',
      },
      {
        id: 1058,
        lang: 'tajik',
      },
      {
        id: 1059,
        lang: 'tamil',
      },
      {
        id: 1060,
        lang: 'tatar',
      },
      {
        id: 1061,
        lang: 'telugu',
      },
      {
        id: 1062,
        lang: 'tigrinya',
      },
      {
        id: 1063,
        lang: 'tswana',
      },
      {
        id: 1064,
        lang: 'turkmen',
      },
      {
        id: 1065,
        lang: 'urdu',
      },
      {
        id: 1066,
        lang: 'uyghur',
      },
      {
        id: 1067,
        lang: 'uzbek',
      },
      {
        id: 1068,
        lang: 'valencian',
      },
      {
        id: 1069,
        lang: 'welsh',
      },
      {
        id: 1070,
        lang: 'wolof',
      },
      {
        id: 1071,
        lang: 'xhosa',
      },
      {
        id: 1072,
        lang: 'yoruba',
      },
      {
        id: 1073,
        lang: 'zulu',
      },
    ])
  }
}
