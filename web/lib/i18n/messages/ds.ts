import { defineMessages } from "./define";

/** Namespace "ds" (componentes do design system). pt-BR é a fonte; en e es com as mesmas chaves. */
export default defineMessages(
  {
    monthSelect: {
      period: "Período",
    },
    holderSelect: {
      label: "Titular",
      all: "Todos",
      none: "Sem titular",
      unnamed: "Sem nome",
    },
    charts: {
      rest: "Demais",
      income: "Receitas",
      expenses: "Despesas",
      tooltipIncome: "Receitas: {amount}",
      tooltipExpenses: "Despesas: {amount}",
      tooltipResult: "Resultado: {amount}",
      monthlyCaption: "Receitas e despesas por mês",
    },
  },
  {
    en: {
      monthSelect: {
        period: "Period",
      },
      holderSelect: {
        label: "Holder",
        all: "All",
        none: "No holder",
        unnamed: "Unnamed",
      },
      charts: {
        rest: "Others",
        income: "Income",
        expenses: "Expenses",
        tooltipIncome: "Income: {amount}",
        tooltipExpenses: "Expenses: {amount}",
        tooltipResult: "Net: {amount}",
        monthlyCaption: "Income and expenses by month",
      },
    },
    es: {
      monthSelect: {
        period: "Período",
      },
      holderSelect: {
        label: "Titular",
        all: "Todos",
        none: "Sin titular",
        unnamed: "Sin nombre",
      },
      charts: {
        rest: "Otros",
        income: "Ingresos",
        expenses: "Gastos",
        tooltipIncome: "Ingresos: {amount}",
        tooltipExpenses: "Gastos: {amount}",
        tooltipResult: "Resultado: {amount}",
        monthlyCaption: "Ingresos y gastos por mes",
      },
    },
  },
);
