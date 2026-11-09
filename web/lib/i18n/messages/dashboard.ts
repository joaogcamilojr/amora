import { defineMessages } from "./define";

/** Namespace "dashboard" (Visão geral). pt-BR é a fonte; en e es com as mesmas chaves. */
export default defineMessages(
  {
    metaTitle: "Visão geral",
    hero: {
      eyebrow: "Central de comando",
      title: "Visão geral",
      description:
        "Receitas e despesas reais. Transferências entre contas, câmbio, pagamento de fatura e investimentos ficam de fora.",
      importStatement: "Importar extrato",
      newTransaction: "Novo lançamento",
    },
    kpi: {
      income: "Receitas",
      expenses: "Despesas",
      result: "Resultado do mês",
      netWorth: "Patrimônio líquido",
      vsMonth: "vs. {month}",
      shareOfIncome: "{percent} da receita",
      netWorthContext: "contas + bens − dívidas, em {currency}",
    },
    incomeVsExpenses: {
      title: "Receitas x despesas",
      context: {
        one: "Último mês até {month}",
        other: "Últimos {count} meses até {month}",
      },
      empty: "Sem lançamentos ainda",
    },
    byCategory: {
      title: "Despesas por categoria",
      seeAll: "Ver todas",
      empty: "Nenhuma despesa no período",
    },
    attention: {
      title: "Atenção necessária",
      context: "O que pede ação agora",
      uncategorized: {
        one: "{count} lançamento sem categoria em {month}",
        other: "{count} lançamentos sem categoria em {month}",
      },
      uncategorizedOk: "Todos os lançamentos do mês estão categorizados",
      pending: {
        one: "{count} lançamento pendente de confirmação",
        other: "{count} lançamentos pendentes de confirmação",
      },
      pendingOk: "Nenhum lançamento pendente",
      stale: {
        one: "{count} conta sem movimento há mais de {days} dias",
        other: "{count} contas sem movimento há mais de {days} dias",
      },
      staleOk: "Todas as contas estão atualizadas",
      missingRates: "Sem cotação para {codes}",
      missingRatesOk: "Cotações cadastradas para todas as moedas",
      review: "Revisar",
      ok: "OK",
    },
    pace: {
      title: "Ritmo financeiro",
      context: "Média dos últimos 3 meses",
      avgIncome: "Receita média",
      avgExpenses: "Despesa média",
      fixedIncome: "Receitas fixas / mês",
      fixedExpenses: "Despesas fixas / mês",
      overspending:
        "Nos últimos 3 meses você gastou {amount} por mês a mais do que recebeu.",
    },
    balances: {
      title: "Saldos por moeda",
      context: "Contas e bens na moeda original",
      accountsLink: "Contas",
      countries: "Países:",
    },
    recent: {
      title: "Lançamentos recentes",
      open: "Abrir lançamentos",
    },
  },
  {
    en: {
      metaTitle: "Overview",
      hero: {
        eyebrow: "Command center",
        title: "Overview",
        description:
          "Actual income and expenses. Transfers between accounts, currency exchange, statement payments and investments are left out.",
        importStatement: "Import statement",
        newTransaction: "New transaction",
      },
      kpi: {
        income: "Income",
        expenses: "Expenses",
        result: "Net for the month",
        netWorth: "Net worth",
        vsMonth: "vs. {month}",
        shareOfIncome: "{percent} of income",
        netWorthContext: "accounts + assets − debts, in {currency}",
      },
      incomeVsExpenses: {
        title: "Income vs. expenses",
        context: {
          one: "Last month through {month}",
          other: "Last {count} months through {month}",
        },
        empty: "No transactions yet",
      },
      byCategory: {
        title: "Expenses by category",
        seeAll: "See all",
        empty: "No expenses in this period",
      },
      attention: {
        title: "Needs attention",
        context: "What needs action now",
        uncategorized: {
          one: "{count} uncategorized transaction in {month}",
          other: "{count} uncategorized transactions in {month}",
        },
        uncategorizedOk: "All transactions this month are categorized",
        pending: {
          one: "{count} transaction pending confirmation",
          other: "{count} transactions pending confirmation",
        },
        pendingOk: "No pending transactions",
        stale: {
          one: "{count} account with no activity in over {days} days",
          other: "{count} accounts with no activity in over {days} days",
        },
        staleOk: "All accounts are up to date",
        missingRates: "No exchange rate for {codes}",
        missingRatesOk: "Exchange rates set for every currency",
        review: "Review",
        ok: "OK",
      },
      pace: {
        title: "Financial pace",
        context: "Average of the last 3 months",
        avgIncome: "Average income",
        avgExpenses: "Average expenses",
        fixedIncome: "Fixed income / month",
        fixedExpenses: "Fixed expenses / month",
        overspending:
          "Over the last 3 months you spent {amount} more per month than you earned.",
      },
      balances: {
        title: "Balances by currency",
        context: "Accounts and assets in their original currency",
        accountsLink: "Accounts",
        countries: "Countries:",
      },
      recent: {
        title: "Recent transactions",
        open: "Open transactions",
      },
    },
    es: {
      metaTitle: "Resumen",
      hero: {
        eyebrow: "Centro de mando",
        title: "Resumen",
        description:
          "Ingresos y gastos reales. Las transferencias entre cuentas, el cambio de divisas, el pago de tarjetas y las inversiones quedan fuera.",
        importStatement: "Importar extracto",
        newTransaction: "Nuevo movimiento",
      },
      kpi: {
        income: "Ingresos",
        expenses: "Gastos",
        result: "Resultado del mes",
        netWorth: "Patrimonio neto",
        vsMonth: "vs. {month}",
        shareOfIncome: "{percent} de los ingresos",
        netWorthContext: "cuentas + bienes − deudas, en {currency}",
      },
      incomeVsExpenses: {
        title: "Ingresos vs. gastos",
        context: {
          one: "Último mes hasta {month}",
          other: "Últimos {count} meses hasta {month}",
        },
        empty: "Todavía no hay movimientos",
      },
      byCategory: {
        title: "Gastos por categoría",
        seeAll: "Ver todos",
        empty: "No hay gastos en el período",
      },
      attention: {
        title: "Requiere atención",
        context: "Lo que necesita acción ahora",
        uncategorized: {
          one: "{count} movimiento sin categoría en {month}",
          other: "{count} movimientos sin categoría en {month}",
        },
        uncategorizedOk: "Todos los movimientos del mes están categorizados",
        pending: {
          one: "{count} movimiento pendiente de confirmación",
          other: "{count} movimientos pendientes de confirmación",
        },
        pendingOk: "No hay movimientos pendientes",
        stale: {
          one: "{count} cuenta sin actividad hace más de {days} días",
          other: "{count} cuentas sin actividad hace más de {days} días",
        },
        staleOk: "Todas las cuentas están al día",
        missingRates: "Sin cotización para {codes}",
        missingRatesOk: "Cotizaciones registradas para todas las monedas",
        review: "Revisar",
        ok: "OK",
      },
      pace: {
        title: "Ritmo financiero",
        context: "Promedio de los últimos 3 meses",
        avgIncome: "Ingreso promedio",
        avgExpenses: "Gasto promedio",
        fixedIncome: "Ingresos fijos / mes",
        fixedExpenses: "Gastos fijos / mes",
        overspending:
          "En los últimos 3 meses gastaste {amount} por mes más de lo que recibiste.",
      },
      balances: {
        title: "Saldos por moneda",
        context: "Cuentas y bienes en su moneda original",
        accountsLink: "Cuentas",
        countries: "Países:",
      },
      recent: {
        title: "Movimientos recientes",
        open: "Abrir movimientos",
      },
    },
  },
);
