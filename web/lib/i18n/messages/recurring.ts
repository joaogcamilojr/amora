import { defineMessages } from "./define";

/** Namespace "recurring": receitas e despesas recorrentes e parcelamentos em aberto. */
export default defineMessages(
  {
    page: {
      description:
        "Entradas e compromissos fixos. Anuais e semestrais entram pelo equivalente mensal.",
      income: "Receitas",
      expenses: "Despesas",
    },
    kpi: {
      fixedIncome: "Receitas fixas",
      fixedExpenses: "Despesas fixas",
      perMonthActive: "por mês, só as ativas",
      commitment: "Comprometimento da renda fixa",
      leftover: "sobra {amount} / mês antes dos gastos variáveis",
    },
    installments: {
      title: "Parcelamentos em aberto",
      context: {
        one: "{count} compra · {amount} ainda a pagar nas próximas faturas",
        other: "{count} compras · {amount} ainda a pagar nas próximas faturas",
      },
      none: "Nenhuma compra parcelada com parcelas futuras.",
      purchase: "Compra",
      purchaseDate: "Data da compra",
      installment: "Parcela",
      installmentAmount: "Valor da parcela",
      remaining: "Falta pagar",
      card: "Cartão",
      remainingCount: "({count}x)",
    },
    table: {
      empty: "Nada cadastrado.",
      frequency: "Frequência",
      when: "Quando",
      next: "Próxima",
      perMonth: "Por mês ({currency})",
      noAccount: "Sem conta",
      active: "Ativa",
      paused: "Pausada",
    },
    form: {
      open: "Nova recorrente",
      title: "Nova receita ou despesa recorrente",
      descriptionPlaceholder: "Ex.: Escola",
      invalidAmount: "Valor inválido.",
      dayOfMonth: "Dia do mês",
      referenceMonth: "Mês de referência",
      referenceMonthHint: "Para anual, semestral, trimestral e bimestral",
    },
    when: {
      variable: "Variável",
      toBeDefined: "A definir",
      monthly: "Todo dia {day}",
      day: "Dia {day}",
      yearly: "{day}/{month}",
      periodic: "{day} de {months}",
    },
  },
  {
    en: {
      page: {
        description:
          "Fixed income and commitments. Yearly and semiannual items count by their monthly equivalent.",
        income: "Income",
        expenses: "Expenses",
      },
      kpi: {
        fixedIncome: "Fixed income",
        fixedExpenses: "Fixed expenses",
        perMonthActive: "per month, active only",
        commitment: "Share of fixed income committed",
        leftover: "{amount} left / month before variable spending",
      },
      installments: {
        title: "Open installment plans",
        context: {
          one: "{count} purchase · {amount} still to pay on upcoming statements",
          other:
            "{count} purchases · {amount} still to pay on upcoming statements",
        },
        none: "No installment purchases with future installments.",
        purchase: "Purchase",
        purchaseDate: "Purchase date",
        installment: "Installment",
        installmentAmount: "Installment amount",
        remaining: "Remaining",
        card: "Card",
        remainingCount: "({count}x)",
      },
      table: {
        empty: "Nothing added yet.",
        frequency: "Frequency",
        when: "When",
        next: "Next",
        perMonth: "Per month ({currency})",
        noAccount: "No account",
        active: "Active",
        paused: "Paused",
      },
      form: {
        open: "New recurring item",
        title: "New recurring income or expense",
        descriptionPlaceholder: "E.g. School",
        invalidAmount: "Invalid amount.",
        dayOfMonth: "Day of month",
        referenceMonth: "Reference month",
        referenceMonthHint:
          "For yearly, semiannual, quarterly and bimonthly items",
      },
      when: {
        variable: "Varies",
        toBeDefined: "Not set",
        monthly: "Every month on day {day}",
        day: "Day {day}",
        yearly: "{month} {day}",
        periodic: "Day {day} of {months}",
      },
    },
    es: {
      page: {
        description:
          "Ingresos y compromisos fijos. Los anuales y semestrales entran por su equivalente mensual.",
        income: "Ingresos",
        expenses: "Gastos",
      },
      kpi: {
        fixedIncome: "Ingresos fijos",
        fixedExpenses: "Gastos fijos",
        perMonthActive: "por mes, solo los activos",
        commitment: "Compromiso del ingreso fijo",
        leftover: "quedan {amount} / mes antes de los gastos variables",
      },
      installments: {
        title: "Compras en cuotas pendientes",
        context: {
          one: "{count} compra · {amount} por pagar en los próximos resúmenes",
          other:
            "{count} compras · {amount} por pagar en los próximos resúmenes",
        },
        none: "No hay compras en cuotas con cuotas futuras.",
        purchase: "Compra",
        purchaseDate: "Fecha de compra",
        installment: "Cuota",
        installmentAmount: "Valor de la cuota",
        remaining: "Falta pagar",
        card: "Tarjeta",
        remainingCount: "({count}x)",
      },
      table: {
        empty: "No hay nada registrado.",
        frequency: "Frecuencia",
        when: "Cuándo",
        next: "Próxima",
        perMonth: "Por mes ({currency})",
        noAccount: "Sin cuenta",
        active: "Activa",
        paused: "Pausada",
      },
      form: {
        open: "Nueva recurrente",
        title: "Nuevo ingreso o gasto recurrente",
        descriptionPlaceholder: "P. ej.: Escuela",
        invalidAmount: "Monto inválido.",
        dayOfMonth: "Día del mes",
        referenceMonth: "Mes de referencia",
        referenceMonthHint: "Para anual, semestral, trimestral y bimestral",
      },
      when: {
        variable: "Variable",
        toBeDefined: "Por definir",
        monthly: "Todos los días {day}",
        day: "Día {day}",
        yearly: "{day}/{month}",
        periodic: "{day} de {months}",
      },
    },
  },
);
