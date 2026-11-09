import { defineMessages } from "./define";

/** Namespace "trips". pt-BR é a fonte; en e es com as mesmas chaves. */
export default defineMessages(
  {
    page: {
      metadataTitle: "Viagens",
      eyebrow: "Patrimônio",
      title: "Viagens",
      description:
        "Cada viagem é uma tag nos lançamentos (ex.: #uruguai-2026). O custo reúne todas as contas e moedas, já em {base}.",
      emptyTitle: "Nenhuma viagem marcada ainda",
      emptyBefore: "Ao criar ou editar um lançamento, adicione uma tag como",
      emptyExampleTag: "uruguai-2026",
      emptyAfter:
        "Ela aparece aqui com o custo total, IOF pago e moedas usadas.",
    },
    card: {
      transactions: { one: "{count} lançamento", other: "{count} lançamentos" },
      fxFees: "IOF {amount}",
    },
    newTrip: {
      button: "Nova viagem",
      title: "Nova viagem",
      description:
        "A tag liga os lançamentos à viagem. Use a mesma tag ao lançar ou importar.",
      name: "Nome",
      namePlaceholder: "Uruguai 2026",
      tag: "Tag",
      tagHint: "Vazio = gerada a partir do nome",
      tagPlaceholder: "uruguai-2026",
      startsOn: "Início",
      endsOn: "Fim",
      countries: "Países",
      countriesHint: "Códigos ISO separados por vírgula. Ex.: UY, AR",
      countriesPlaceholder: "UY",
    },
  },
  {
    en: {
      page: {
        metadataTitle: "Trips",
        eyebrow: "Net worth",
        title: "Trips",
        description:
          "Each trip is a tag on your transactions (e.g. #uruguay-2026). The cost combines every account and currency, already in {base}.",
        emptyTitle: "No trips tagged yet",
        emptyBefore: "When you create or edit a transaction, add a tag such as",
        emptyExampleTag: "uruguay-2026",
        emptyAfter:
          "It shows up here with the total cost, foreign transaction fees paid and currencies used.",
      },
      card: {
        transactions: {
          one: "{count} transaction",
          other: "{count} transactions",
        },
        fxFees: "FX fees {amount}",
      },
      newTrip: {
        button: "New trip",
        title: "New trip",
        description:
          "The tag links transactions to the trip. Use the same tag when adding or importing transactions.",
        name: "Name",
        namePlaceholder: "Uruguay 2026",
        tag: "Tag",
        tagHint: "Leave empty to generate it from the name",
        tagPlaceholder: "uruguay-2026",
        startsOn: "Start",
        endsOn: "End",
        countries: "Countries",
        countriesHint: "Comma-separated ISO codes. E.g. UY, AR",
        countriesPlaceholder: "UY",
      },
    },
    es: {
      page: {
        metadataTitle: "Viajes",
        eyebrow: "Patrimonio",
        title: "Viajes",
        description:
          "Cada viaje es una etiqueta en los movimientos (ej.: #uruguay-2026). El costo reúne todas las cuentas y monedas, ya en {base}.",
        emptyTitle: "Todavía no hay viajes etiquetados",
        emptyBefore:
          "Al crear o editar un movimiento, agrega una etiqueta como",
        emptyExampleTag: "uruguay-2026",
        emptyAfter:
          "Aparecerá aquí con el costo total, las comisiones por cambio pagadas y las monedas usadas.",
      },
      card: {
        transactions: {
          one: "{count} movimiento",
          other: "{count} movimientos",
        },
        fxFees: "Comisiones por cambio {amount}",
      },
      newTrip: {
        button: "Nuevo viaje",
        title: "Nuevo viaje",
        description:
          "La etiqueta vincula los movimientos con el viaje. Usa la misma etiqueta al registrar o importar.",
        name: "Nombre",
        namePlaceholder: "Uruguay 2026",
        tag: "Etiqueta",
        tagHint: "Si la dejas vacía, se genera a partir del nombre",
        tagPlaceholder: "uruguay-2026",
        startsOn: "Inicio",
        endsOn: "Fin",
        countries: "Países",
        countriesHint: "Códigos ISO separados por comas. Ej.: UY, AR",
        countriesPlaceholder: "UY",
      },
    },
  },
);
