import { CellType, Table } from './model'
import { makeRowStructureBuilder } from './row'
import {
  buildDeduplicateTableHeader,
  makeLevelDeduplicator,
  splitTableByHeaders,
  removeDandlingPlugCells,
} from './deduplication'

const simpleTable: Table = {
  width: 4,
  height: 3,
  rows: [
    [
      {
        height: 1,
        width: 1,
        value: 'a',
        type: CellType.Header,
      },
      {
        height: 1,
        width: 1,
        value: 'b',
        type: CellType.Header,
      },
      {
        height: 1,
        width: 2,
        value: 'c',
        type: CellType.Header,
      },
    ],
    [
      {
        height: 2,
        width: 1,
        value: 1,
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 2,
        type: CellType.Value,
      },
      {
        height: 1,
        width: 1,
        value: 'aa',
        type: CellType.Header,
      },
      {
        height: 1,
        width: 1,
        value: 'bb',
        type: CellType.Header,
      },
    ],
    [
      {
        height: 1,
        width: 1,
        value: 11,
        type: CellType.Value,
      },
      {
        height: 1,
        width: 1,
        value: 22,
        type: CellType.Value,
      },
    ],
  ],
}
const simpleTableWithIndex: Table = {
  height: 3,
  width: 5,
  rows: [
    [
      {
        value: '1',
        height: 3,
        type: CellType.Index,
        width: 1,
      },
      {
        height: 1,
        width: 1,
        value: 'a',
        type: CellType.Header,
      },
      {
        height: 1,
        width: 1,
        value: 'b',
        type: CellType.Header,
      },
      {
        height: 1,
        width: 2,
        value: 'c',
        type: CellType.Header,
      },
    ],
    [
      {
        height: 2,
        width: 1,
        value: 1,
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 2,
        type: CellType.Value,
      },
      {
        height: 1,
        width: 1,
        value: 'aa',
        type: CellType.Header,
      },
      {
        height: 1,
        width: 1,
        value: 'bb',
        type: CellType.Header,
      },
    ],
    [
      {
        height: 1,
        width: 1,
        value: 11,
        type: CellType.Value,
      },
      {
        height: 1,
        width: 1,
        value: 22,
        type: CellType.Value,
      },
    ],
  ],
}
const firstTableWithDuplication: Table = {
  width: 3,
  height: 3,
  rows: [
    [
      {
        height: 1,
        width: 2,
        value:
          'Государственные информационные системы (ГИС), установленные на АРМ сотрудника',
        type: CellType.Header,
      },
      {
        height: 1,
        width: 1,
        value: 'ФИО сотрудника учреждения',
        type: CellType.Header,
      },
    ],
    [
      {
        height: 1,
        width: 1,
        value: 'Наименование ГИС',
        type: CellType.Header,
      },
      {
        height: 1,
        width: 1,
        value: 'Ввести наименование',
        type: CellType.Header,
      },
      {
        height: 2,
        width: 1,
        value: 'Васильев Василий Васильевич',
        type: CellType.Value,
      },
    ],
    [
      {
        height: 1,
        width: 1,
        value: 'Нет в списке',
        type: CellType.Value,
      },
      {
        height: 1,
        width: 1,
        value: 'Наименование',
        type: CellType.Value,
      },
    ],
  ],
}
const secondTableWithDuplication: Table = {
  width: 2,
  height: 5,
  rows: [
    [
      {
        height: 1,
        width: 1,
        value:
          'Государственные информационные системы (ГИС), установленные на АРМ сотрудника',
        type: CellType.Header,
      },
      {
        height: 1,
        width: 1,
        value: 'ФИО сотрудника учреждения',
        type: CellType.Header,
      },
    ],
    [
      {
        height: 1,
        width: 1,
        value: 'Наименование ГИС',
        type: CellType.Header,
      },
      {
        height: 4,
        width: 1,
        value: 'Петров Пётр Петрович',
        type: CellType.Value,
      },
    ],
    [
      {
        height: 1,
        width: 1,
        value:
          'Региональная комплексная информационная система государственных услуг «Госуслуги - Республика Коми» (РКИС ГУ РК)',
        type: CellType.Value,
      },
    ],
    [
      {
        height: 1,
        width: 1,
        value: 'Наименование ГИС',
        type: CellType.Header,
      },
    ],
    [
      {
        height: 1,
        width: 1,
        value:
          'Интернет-портал Республики Коми «Активный регион. Республика Коми»',
        type: CellType.Value,
      },
    ],
  ],
}
const tableWithSplitProblem: Table = {
  width: 103,
  height: 8,
  rows: [
    [
      {
        height: 1,
        type: CellType.Header,
        value: 'Социально-демографические характеристики',
        width: 8,
      },
      {
        height: 1,
        type: CellType.Header,
        value: 'Востребованность финансовых услуг',
        width: 34,
      },
      {
        height: 1,
        type: CellType.Header,
        value:
          'Удовлетворенность финансовыми услугами и работой российских финансовых организаций, предоставляющих эти услуги',
        width: 61,
      },
    ],
    [
      {
        height: 3,
        type: CellType.Header,
        value: 'Ваше образование',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Место Вашего проживания?',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Укажите Ваш пол',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Укажите Ваш возраст',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Ваш социальный статус',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value:
          'Какое утверждение описывает материальное состояние вашей семьи?',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Есть ли у Вас ребенок?',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Как бы Вы могли оценить свой уровень финансовой грамотности?',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Какими из перечисленных финансовых продуктов (услуг) Вы пользовались за последние 12 месяцев? (выберите один вариант ответа для каждого финансового продукта)',
        width: 8,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Выберите все подходящие ответы',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Какими из перечисленных кредитных финансовых продуктов (услуг) Вы пользовались за последние 12 месяцев? (Выберите один вариант ответа для каждого финансового продукта)',
        width: 11,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Какими из платежных карт Вы пользовались за последние 12 месяцев? (выберите один вариант ответа для каждого финансового продукта)',
        width: 4,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Используете ли Вы расчетный счет без возможности получения дохода в виде процентов, отличный от счета по вкладу или счета платежной карты? (выберите один вариант ответа)',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Выполняли ли Вы следующие операции за последние 12 месяцев? (выберите один вариант ответа для каждого типа дистанционного доступа к счету)',
        width: 4,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Выберите все подходящие ответы, если Вы НЕ ПОЛЬЗОВАЛИСЬ за последние 12 месяцев ни одним из перечисленных в предыдущем вопросе типов доступа',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Какими страховыми продуктами (услугами) Вы пользовались за последние 12 месяцев? (Выберите один вариант ответа для каждого страхового продукта)',
        width: 3,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Выберите все подходящие ответы, если Вы НЕ ПОЛЬЗОВАЛИСЬ за последние 12 месяцев добровольным страхованием',
        width: 1,
      },
      {
        height: 1,
        type: CellType.Header,
        value:
          'Насколько Вы удовлетворены работой/сервисом следующих финансовых организаций?',
        width: 8,
      },
      {
        height: 1,
        type: CellType.Header,
        value: 'Насколько Вы доверяете следующим финансовым организациям?',
        width: 8,
      },
      {
        height: 1,
        type: CellType.Header,
        value:
          'Насколько Вы удовлетворены следующими продуктами/услугами финансовых организаций?',
        width: 19,
      },
      {
        height: 1,
        type: CellType.Header,
        value:
          'Если говорить о Вашем населенном пункте, насколько Вы удовлетворены следующим:',
        width: 13,
      },
      {
        height: 1,
        type: CellType.Header,
        value:
          'Оцените доступность способов обслуживания (Для оценки используйте шкалу от 1 до 5, где 1 - практически НЕ доступно, а 5 - легко доступно)',
        width: 6,
      },
      {
        height: 1,
        type: CellType.Header,
        value:
          'Какими услугами Вы можете воспользоваться быстро без траты времени на ожидание? (Для оценки используйте шкалу от 1 до 5, где 1 - на доступ трачу много времени, а 5 - могу воспользоваться быстро)',
        width: 6,
      },
      {
        height: 1,
        type: CellType.Header,
        value:
          'Какие существуют барьеры для Вашего доступа к финансовым услугам?',
        width: 1,
      },
    ],
    [
      {
        height: 3,
        type: CellType.Header,
        value: 'Банки',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Микрофинансовые организации',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Кредитные потребительские кооперативы',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Ломбарды',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value:
          'Субъекты страхового дела (страховые организации, общества взаимного страхования и страховые брокеры)',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Сельскохозяйственные кредитные потребительские кооперативы',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Негосударственные пенсионные фонды',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Брокеры',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Банки',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Микрофинансовые организации',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Кредитные потребительские кооперативы',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Ломбарды',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value:
          'Субъекты страхового дела (страховые организации, общества взаимного страхования и страховые брокеры)',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Сельскохозяйственные кредитные потребительские кооперативы',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Негосударственные пенсионные фонды',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Брокеры',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Банки',
        width: 5,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Микрофинансовые организации',
        width: 2,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Кредитные потребительские кооперативы',
        width: 2,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Ломбарды',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Субъекты страхового дела (страховые организации, общества взаимного страхования и страховые брокеры)',
        width: 4,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Сельскохозяйственные кредитные потребительские кооперативы',
        width: 2,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Негосударственные пенсионные фонды',
        width: 2,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Брокеры',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Количеством и удобством расположения банковских отделений',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Качеством дистанционного банковского обслуживания',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value:
          'Наличие выбора банков для получения необходимых Вам банковских услуг',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value:
          'Количеством и удобством расположения микрофинансовых организаций, ломбардов, кредитных потребительских кооперативов и сельскохозяйственных кредитных потребительских кооперативов',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value:
          'Наличие выбора различных микрофинансовых организаций, ломбардов, кредитных потребительских кооперативов и сельскохозяйственных кредитных потребительских кооперативов для получения необходимых Вам услуг',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Количеством и удобством расположения субъектов страхового дела',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value:
          'Наличие выбора различных субъектов страхового дела для получения необходимых Вам страховых услуг',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value:
          'Количеством и удобством расположения негосударственных пенсионных фондов',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value:
          'Наличие выбора различных негосударственных пенсионных фондов для получения необходимых Вам услуг',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Количеством и удобством расположения брокеров',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value:
          'Наличие выбора различных брокеров для получения брокерских услуг',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Качеством интернет-связи',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Качеством мобильной связи',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Касса в отделении банка',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value:
          'Банкомат или терминал (устройство без функции выдачи наличных денежных средств) в отделении банка',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value:
          'Банкомат или терминал (устройство без функции выдачи наличных денежных средств) вне отделения банка',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value:
          'Терминал для безналичной оплаты с помощью банковской карты в организациях торговли (услуг)',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value:
          'Платежный терминал для приема наличных денежных средств с целью оплаты товаров (услуг)',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Отделение почтовой связи',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Касса в отделении банка',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value:
          'Банкомат или терминал (устройство без функции выдачи наличных денежных средств) в отделении банка',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value:
          'Банкомат или терминал (устройство без функции выдачи наличных денежных средств) вне отделения банка',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value:
          'Терминал для безналичной оплаты с помощью банковской карты в организациях торговли (услуг)',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value:
          'Платежный терминал для приема наличных денежных средств с целью оплаты товаров (услуг)',
        width: 1,
      },
      {
        height: 3,
        type: CellType.Header,
        value: 'Отделение почтовой связи',
        width: 1,
      },
      {
        height: 6,
        width: 1,
        value: 'Обслуживание счета/платежной карты стоит слишком дорого',
        type: CellType.Value,
      },
    ],
    [
      {
        height: 2,
        type: CellType.Header,
        value: 'Банковский вклад',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Вклад в микрофинансовой организации',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Вклад в кредитном потребительском кооперативе',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Вклад в сельскохозяйственном кредитном потребительском кооперативе',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Индивидуальный инвестиционный счет',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Инвестиционное страхование жизни',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Брокерский счет',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Вложение средств в паевой инвестиционный фонд',
        width: 1,
      },
      {
        height: 4,
        width: 1,
        value: '',
        type: CellType.Value,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Онлайн-кредит в банке (договор заключен с использованием сети «Интернет», сумма кредита предоставлена в безналичной форме)',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Иной кредит в банке, не являющийся онлайн-кредитом',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Ипотечный кредит',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Использование кредитного лимита по кредитной карте',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Онлайн-заем в микрофинансовой организации ',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Иной заем в микрофинансовой организации, не являющийся онлайн-займом',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Онлайн-заем в кредитном потребительском кооперативе',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Иной заем в кредитном потребительском кооперативе, не являющийся онлайн-займом',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Онлайн-заем в сельскохозяйственном кредитном потребительском кооперативе',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Иной заем в сельскохозяйственном кредитном потребительском кооперативе, не являющийся онлайн-займом',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Заем в ломбарде',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Зарплатная карта ',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Расчетная (дебетовая) карта для получения пенсий и иных социальных выплат',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Другая расчетная (дебетовая) карта',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Кредитная карта',
        width: 1,
      },
      {
        height: 4,
        width: 1,
        value: 'Имеется сейчас',
        type: CellType.Value,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Денежные переводы/платежи через интернет-банк с помощью компьютера или ноутбука через веб-браузер',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Денежные переводы/платежи через интернет-банк с помощью планшета или смартфона через веб-браузер',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Денежные переводы/платежи через мобильный банк с помощью специализированного мобильного приложения (программы) для смартфона или планшета',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Денежные переводы/платежи через мобильный банк посредством сообщений с использованием мобильного телефона - с помощью отправки смс на короткий номер',
        width: 1,
      },
      {
        height: 4,
        width: 1,
        value: 'Чиво',
        type: CellType.Value,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Добровольное страхование жизни (на случай смерти, дожития до определенного возраста или срока либо наступления иного события; с условием периодических выплат (ренты, аннуитетов) и/или участием страхователя в инвестиционном доходе страховщика; пенсионное страхование)',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Другое добровольное страхование (добровольное личное страхование от несчастных случаев и болезни, медицинское страхование; добровольное имущественное страхование; добровольное страхование гражданской ответственности (например, дополнительное страхование автогражданской ответственности (ОСАГО), но не обязательное страхование автогражданской ответственности (ОСАГО); добровольное страхование финансовых рисков)',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Другое обязательное страхование, кроме обязательного медицинского страхования (обязательное личное страхование пассажиров (туристов), жизни и здоровья пациента, участвующего в клинических исследованиях лекарственного препарата для медицинского применения, государственное личное страхование работников налоговых органов, государственное страхование жизни и здоровья военнослужащих и приравненных к ним в обязательном государственном страховании лиц; ОСАГО)',
        width: 1,
      },
      {
        height: 4,
        width: 1,
        value:
          'Отделения страховых организаций (а также страховые брокеры или общества взаимного страхования) находятся слишком далеко от меня, Не вижу смысла в страховании',
        type: CellType.Value,
      },
    ],
    [
      {
        height: 3,
        width: 1,
        value: 'Высшее образование: бакалавриат',
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 'МО ГО «Сыктывкар»',
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 'Мужской',
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: '18-24',
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 'Работаю',
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value:
          'Мы можем купить основную бытовую технику и без привлечения заемных средств, но автомобиль для нас - непозволительная роскошь',
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 'Нет детей',
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value:
          'Средний - периодически веду учет собственных доходов и расходов; имею сбережения на случай непредвиденных обстоятельств и периодически их пополняю; имею общее представление о некоторых различных финансовых продуктах и услугах; имею общее представление о своих правах',
        type: CellType.Value,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Кредиты',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Вклады',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Расчетные (дебетовые) карты, включая зарплатные',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Кредитные карты',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Переводы и платежи',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Займы в микрофинансовых организациях',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Размещение средств в форме договора займа в микрофинансовых организациях',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Займы в кредитных потребительских кооперативах',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Размещение средств в форме договора займа в кредитных потребительских кооперативах',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Займы в ломбардах',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Добровольное страхование жизни',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Другое добровольное страхование',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Обязательное медицинское страхование',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Другое обязательное страхование',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Займы в сельскохозяйственных кредитных потребительских кооперативах',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value:
          'Размещение средств в форме договора займа в сельскохозяйственных кредитных потребительских кооперативах',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Обязательное пенсионное страхование',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Негосударственное пенсионное обеспечение',
        width: 1,
      },
      {
        height: 2,
        type: CellType.Header,
        value: 'Индивидуальные инвестиционные счета',
        width: 1,
      },
    ],
    [
      {
        height: 2,
        width: 1,
        value: 'Имеется сейчас',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Не имеется сейчас, но использовался за последние 12 месяцев',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Не имеется сейчас, но использовался за последние 12 месяцев',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Не использовался за последние 12 месяцев',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Не имеется сейчас, но использовался за последние 12 месяцев',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Имеется сейчас',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Не использовался за последние 12 месяцев',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Имеется сейчас',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Имеется сейчас',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Не использовался за последние 12 месяцев',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Имеется сейчас',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Не использовался за последние 12 месяцев',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Имеется сейчас',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Не имеется сейчас, но использовался за последние 12 месяцев',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Не имеется сейчас, но использовался за последние 12 месяцев',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Не использовался за последние 12 месяцев',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Не использовался за последние 12 месяцев',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Не имеется сейчас, но использовался за последние 12 месяцев',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Имеется сейчас',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Не имеется сейчас, но использовался за последние 12 месяцев',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Не имеется сейчас, но использовался за последние 12 месяцев',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Имеется сейчас',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Не использовался за последние 12 месяцев',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Да',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Нет',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Да',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Нет',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Не имеется сейчас, но использовался за последние 12 месяцев',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Имеется сейчас',
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 'Не имеется сейчас, но использовался за последние 12 месяцев',
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 2,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 4,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 0,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 1,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 1,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 3,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 2,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 3,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 3,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 3,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 2,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 1,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 3,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 3,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 2,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 3,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 1,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 2,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 3,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 2,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 2,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 1,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 3,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 4,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 0,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 4,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 2,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 2,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 2,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 1,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 3,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 4,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 2,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 4,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 2,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 3,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 3,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 5,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 4,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 2,
        type: CellType.Value,
      },
      {
        height: 3,
        width: 1,
        value: 3,
        type: CellType.Value,
      },
    ],
    [
      {
        height: 2,
        width: 1,
        value: 3,
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 4,
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 2,
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 1,
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 2,
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 1,
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 3,
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 1,
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 2,
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 0,
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 0,
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 1,
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 3,
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 3,
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 1,
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 3,
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 2,
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 3,
        type: CellType.Value,
      },
      {
        height: 2,
        width: 1,
        value: 1,
        type: CellType.Value,
      },
    ],
    [
      {
        value: '',
        height: 1,
        width: 8,
        type: CellType.Plug,
      },
      {
        value: '',
        height: 1,
        width: 34,
        type: CellType.Plug,
      },
    ],
  ],
}

describe('Deduplication', () => {
  const buildRowStructure = makeRowStructureBuilder(false)

  describe('getDeduplicateLevel', () => {
    const getDeduplicateLevel = makeLevelDeduplicator(buildRowStructure)

    it('Should return correct deduplicate level', () => {
      const expected = 1

      const result = getDeduplicateLevel(
        [firstTableWithDuplication, secondTableWithDuplication],
        6
      )
      expect(result).toBe(expected)
    })
    it('Should return correct deduplicate level 2', () => {
      const expected = 2
      const result = getDeduplicateLevel([simpleTable, simpleTable], 4)
      expect(result).toBe(expected)
    })
  })

  describe('removeDandlingPlugCells', () => {
    it('Should remove dandling plug', () => {
      const table: Table = {
        rows: [
          [
            {
              height: 3,
              width: 1,
              value: 'Высшее образование: бакалавриат',
              type: CellType.Value,
            },
          ],
          [],
          [],
          [
            {
              value: '',
              height: 1,
              width: 1,
              type: CellType.Plug,
            },
          ],
        ],
        height: 4,
        width: 1,
      }
      const expected: Table = {
        rows: [
          [
            {
              height: 3,
              width: 1,
              value: 'Высшее образование: бакалавриат',
              type: CellType.Value,
            },
          ],
          [],
          [],
        ],
        height: 3,
        width: 1,
      }
      expect(removeDandlingPlugCells(table)).toEqual(expected)
    })
  })

  describe('splitByHeaders', () => {
    it('Should correct split table', () => {
      const expected: Table[] = [
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 1,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 2,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 1,
                width: 1,
                value: 11,
                type: CellType.Value,
              },
            ],
          ],
          height: 1,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 1,
                width: 1,
                value: 22,
                type: CellType.Value,
              },
            ],
          ],
          height: 1,
          width: 1,
        },
      ]
      const result = splitTableByHeaders(simpleTable, 2, 0)
      expect(result).toEqual(expected)
    })
    it('Should correct split table with rows', () => {
      const expected: Table[] = [
        {
          rows: [
            [
              {
                value: '1',
                height: 3,
                type: CellType.Index,
                width: 1,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 1,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 2,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 1,
                width: 1,
                value: 11,
                type: CellType.Value,
              },
            ],
          ],
          height: 1,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 1,
                width: 1,
                value: 22,
                type: CellType.Value,
              },
            ],
          ],
          height: 1,
          width: 1,
        },
      ]
      const result = splitTableByHeaders(simpleTableWithIndex, 2, 0)
      expect(result).toEqual(expected)
    })
    it('Should correct split table2', () => {
      const expected: Table[] = [
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 'Высшее образование: бакалавриат',
                type: CellType.Value,
              },
            ],
            [],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 4,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 'МО ГО «Сыктывкар»',
                type: CellType.Value,
              },
            ],
            [],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 4,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 'Мужской',
                type: CellType.Value,
              },
            ],
            [],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 4,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: '18-24',
                type: CellType.Value,
              },
            ],
            [],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 4,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 'Работаю',
                type: CellType.Value,
              },
            ],
            [],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 4,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value:
                  'Мы можем купить основную бытовую технику и без привлечения заемных средств, но автомобиль для нас - непозволительная роскошь',
                type: CellType.Value,
              },
            ],
            [],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 4,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 'Нет детей',
                type: CellType.Value,
              },
            ],
            [],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 4,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value:
                  'Средний - периодически веду учет собственных доходов и расходов; имею сбережения на случай непредвиденных обстоятельств и периодически их пополняю; имею общее представление о некоторых различных финансовых продуктах и услугах; имею общее представление о своих правах',
                type: CellType.Value,
              },
            ],
            [],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 4,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 'Имеется сейчас',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value:
                  'Не имеется сейчас, но использовался за последние 12 месяцев',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value:
                  'Не имеется сейчас, но использовался за последние 12 месяцев',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 'Не использовался за последние 12 месяцев',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value:
                  'Не имеется сейчас, но использовался за последние 12 месяцев',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 'Имеется сейчас',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 'Не использовался за последние 12 месяцев',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 'Имеется сейчас',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 4,
                width: 1,
                value: '',
                type: CellType.Value,
              },
            ],
            [],
            [],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 5,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 'Имеется сейчас',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 'Не использовался за последние 12 месяцев',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 'Имеется сейчас',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 'Не использовался за последние 12 месяцев',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 'Имеется сейчас',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value:
                  'Не имеется сейчас, но использовался за последние 12 месяцев',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value:
                  'Не имеется сейчас, но использовался за последние 12 месяцев',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 'Не использовался за последние 12 месяцев',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 'Не использовался за последние 12 месяцев',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value:
                  'Не имеется сейчас, но использовался за последние 12 месяцев',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 'Имеется сейчас',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value:
                  'Не имеется сейчас, но использовался за последние 12 месяцев',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value:
                  'Не имеется сейчас, но использовался за последние 12 месяцев',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 'Имеется сейчас',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 'Не использовался за последние 12 месяцев',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 4,
                width: 1,
                value: 'Имеется сейчас',
                type: CellType.Value,
              },
            ],
            [],
            [],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 5,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 'Да',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 'Нет',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 'Да',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 'Нет',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 4,
                width: 1,
                value: 'Чиво',
                type: CellType.Value,
              },
            ],
            [],
            [],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 5,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value:
                  'Не имеется сейчас, но использовался за последние 12 месяцев',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 'Имеется сейчас',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value:
                  'Не имеется сейчас, но использовался за последние 12 месяцев',
                type: CellType.Value,
              },
            ],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 4,
                width: 1,
                value:
                  'Отделения страховых организаций (а также страховые брокеры или общества взаимного страхования) находятся слишком далеко от меня, Не вижу смысла в страховании',
                type: CellType.Value,
              },
            ],
            [],
            [],
            [],
            [
              {
                value: '',
                height: 1,
                width: 1,
                type: CellType.Plug,
              },
            ],
          ],
          height: 5,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 2,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 4,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 0,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 1,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 1,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 3,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 2,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 3,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 3,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 3,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 2,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 1,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 3,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 3,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 2,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 3,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 3,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 4,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 2,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 1,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 2,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 1,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 3,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 1,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 2,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 0,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 0,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 1,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 3,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 3,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 1,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 3,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 2,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 3,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 2,
                width: 1,
                value: 1,
                type: CellType.Value,
              },
            ],
            [],
          ],
          height: 2,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 1,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 2,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 3,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 2,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 2,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 1,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 3,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 4,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 0,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 4,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 2,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 2,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 2,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 1,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 3,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 4,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 2,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 4,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 2,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 3,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 3,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 5,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 4,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 2,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 3,
                width: 1,
                value: 3,
                type: CellType.Value,
              },
            ],
            [],
            [],
          ],
          height: 3,
          width: 1,
        },
        {
          rows: [
            [
              {
                height: 6,
                width: 1,
                value:
                  'Обслуживание счета/платежной карты стоит слишком дорого',
                type: CellType.Value,
              },
            ],
            [],
            [],
            [],
            [],
            [],
          ],
          height: 6,
          width: 1,
        },
      ]
      const result = splitTableByHeaders(tableWithSplitProblem, 5, 0)
      expect(result).toEqual(expected)
    })
  })

  describe('buildDeduplicateTableHeader', () => {
    it('Should build correct table header', () => {
      const expected: Table = {
        width: 4,
        height: 2,
        rows: [
          [
            { type: CellType.Header, height: 2, width: 1, value: 'a' },
            { type: CellType.Header, height: 2, width: 1, value: 'b' },
            { type: CellType.Header, height: 1, width: 2, value: 'c' },
          ],
          [
            { type: CellType.Header, height: 1, width: 1, value: 'aa' },
            { type: CellType.Header, height: 1, width: 1, value: 'bb' },
          ],
        ],
      }
      const result = buildDeduplicateTableHeader(simpleTable, [0, 2])
      expect(result).toEqual(expected)
    })
    it('Should work with indexes', () => {
      const expected: Table = {
        width: 5,
        height: 2,
        rows: [
          [
            { type: CellType.Header, height: 2, width: 1, value: '№' },
            { type: CellType.Header, height: 2, width: 1, value: 'a' },
            { type: CellType.Header, height: 2, width: 1, value: 'b' },
            { type: CellType.Header, height: 1, width: 2, value: 'c' },
          ],
          [
            { type: CellType.Header, height: 1, width: 1, value: 'aa' },
            { type: CellType.Header, height: 1, width: 1, value: 'bb' },
          ],
        ],
      }
      const result = buildDeduplicateTableHeader(simpleTableWithIndex, [0, 2])
      expect(result).toEqual(expected)
    })

    it('Should able to reduce header size', () => {
      const expected: Table = {
        height: 1,
        width: 2,
        rows: [
          [
            {
              height: 1,
              width: 1,
              value:
                'Государственные информационные системы (ГИС), установленные на АРМ сотрудника',
              type: CellType.Header,
            },
            {
              height: 1,
              width: 1,
              value: 'ФИО сотрудника учреждения',
              type: CellType.Header,
            },
          ],
        ],
      }
      const result = buildDeduplicateTableHeader(
        secondTableWithDuplication,
        [0, 1]
      )
      expect(result).toEqual(expected)
    })
  })
})
