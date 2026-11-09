import { defineMessages } from "./define";

/** Rótulos dos enums do Prisma. Use `t(\`enums.transactionType.${type}\`)`. */
export default defineMessages(
  {
    transactionType: {
      OPENING_BALANCE: "Saldo inicial",
      INCOME: "Receita",
      EXPENSE: "Despesa",
      TRANSFER: "Transferência",
      EXCHANGE: "Câmbio",
      REFUND: "Estorno",
      ADJUSTMENT: "Ajuste",
      FEE: "Tarifa",
      INTEREST_INCOME: "Rendimento",
      CARD_PAYMENT: "Pagamento de fatura",
      INVESTMENT: "Investimento",
    },
    transactionStatus: {
      POSTED: "Postado",
      PENDING: "Pendente",
      ESTIMATED: "Estimado",
    },
    categoryKind: { INCOME: "Receita", EXPENSE: "Despesa" },
    frequency: {
      MONTHLY: "Mensal",
      BIMONTHLY: "Bimestral",
      QUARTERLY: "Trimestral",
      SEMIANNUAL: "Semestral",
      YEARLY: "Anual",
    },
    holdingClass: {
      REAL_ESTATE: "Imóvel",
      VEHICLE: "Veículo",
      FIXED_INCOME: "Renda fixa",
      EQUITY: "Renda variável",
      INTERNATIONAL: "Internacional",
      CRYPTO: "Cripto",
      PENSION: "Previdência",
      OTHER: "Outro",
    },
    cardType: {
      CREDIT: "Crédito",
      DEBIT: "Débito",
      PREPAID: "Pré-pago",
      BENEFIT: "Benefício",
      GIFT: "Gift card",
      VIRTUAL: "Virtual",
    },
    householdRole: {
      ADMIN: "Admin — gerencia o grupo",
      MEMBER: "Membro — consulta e lança",
      VIEWER: "Leitor — consulta",
    },
    memberRole: {
      OWNER: "Titular",
      VIEWER: "Leitor — consulta",
      TRANSACTION_MANAGER: "Gestor — lançamentos",
    },
    statementStatus: {
      paid: "Paga",
      closed: "Fechada · a pagar",
      overdue: "Em atraso",
      open: "Aberta",
      future: "Futura",
    },
    accountType: {
      CASH_WALLET: {
        label: "Carteira de dinheiro",
        description: "Dinheiro físico ou saldo simples em uma moeda.",
      },
      BANK_ACCOUNT: {
        label: "Conta bancária",
        description: "Conta bancária tradicional em uma moeda fiduciária.",
      },
      INTERNATIONAL_ACCOUNT: {
        label: "Conta internacional",
        description:
          "Conta local ou internacional com uma ou mais moedas fiduciárias.",
      },
      MULTI_CURRENCY_ACCOUNT: {
        label: "Conta multimoeda",
        description: "Vários saldos fiduciários separados por moeda.",
      },
      BENEFIT_ACCOUNT: {
        label: "Conta ou saldo de benefício",
        description: "Vale, benefício corporativo ou saldo de mobilidade.",
      },
      GIFT_CARD: {
        label: "Gift card",
        description: "Cartão-presente ou crédito de loja.",
      },
      DIGITAL_BALANCE: {
        label: "Saldo digital",
        description: "Saldo mantido em aplicativo, plataforma ou serviço.",
      },
      CRYPTO_WALLET: {
        label: "Carteira de criptoativos",
        description:
          "Um ou mais criptoativos. Nunca informe chave privada ou seed phrase.",
      },
      CREDIT_CARD: {
        label: "Cartão de crédito",
        description: "Limite e fatura em uma moeda fiduciária.",
      },
      PREPAID_CARD: {
        label: "Cartão pré-pago",
        description: "Cartão pré-pago físico ou virtual.",
      },
      OTHER: {
        label: "Outro",
        description:
          "Tipo personalizado. Revise os indicadores de patrimônio e saldo disponível.",
      },
    },
  },
  {
    en: {
      transactionType: {
        OPENING_BALANCE: "Opening balance",
        INCOME: "Income",
        EXPENSE: "Expense",
        TRANSFER: "Transfer",
        EXCHANGE: "Currency exchange",
        REFUND: "Refund",
        ADJUSTMENT: "Adjustment",
        FEE: "Fee",
        INTEREST_INCOME: "Interest",
        CARD_PAYMENT: "Card payment",
        INVESTMENT: "Investment",
      },
      transactionStatus: {
        POSTED: "Posted",
        PENDING: "Pending",
        ESTIMATED: "Estimated",
      },
      categoryKind: { INCOME: "Income", EXPENSE: "Expense" },
      frequency: {
        MONTHLY: "Monthly",
        BIMONTHLY: "Every 2 months",
        QUARTERLY: "Quarterly",
        SEMIANNUAL: "Every 6 months",
        YEARLY: "Yearly",
      },
      holdingClass: {
        REAL_ESTATE: "Real estate",
        VEHICLE: "Vehicle",
        FIXED_INCOME: "Fixed income",
        EQUITY: "Equities",
        INTERNATIONAL: "International",
        CRYPTO: "Crypto",
        PENSION: "Pension",
        OTHER: "Other",
      },
      cardType: {
        CREDIT: "Credit",
        DEBIT: "Debit",
        PREPAID: "Prepaid",
        BENEFIT: "Benefit",
        GIFT: "Gift card",
        VIRTUAL: "Virtual",
      },
      householdRole: {
        ADMIN: "Admin — manages the household",
        MEMBER: "Member — views and posts",
        VIEWER: "Viewer — view only",
      },
      memberRole: {
        OWNER: "Owner",
        VIEWER: "Viewer — read only",
        TRANSACTION_MANAGER: "Manager — transactions",
      },
      statementStatus: {
        paid: "Paid",
        closed: "Closed · due",
        overdue: "Overdue",
        open: "Open",
        future: "Upcoming",
      },
      accountType: {
        CASH_WALLET: {
          label: "Cash wallet",
          description: "Physical cash or a simple balance in one currency.",
        },
        BANK_ACCOUNT: {
          label: "Bank account",
          description: "Traditional bank account in one fiat currency.",
        },
        INTERNATIONAL_ACCOUNT: {
          label: "International account",
          description:
            "Local or international account with one or more fiat currencies.",
        },
        MULTI_CURRENCY_ACCOUNT: {
          label: "Multi-currency account",
          description: "Several fiat balances kept separately by currency.",
        },
        BENEFIT_ACCOUNT: {
          label: "Benefit account or balance",
          description:
            "Meal/food vouchers, corporate benefits or mobility balance.",
        },
        GIFT_CARD: {
          label: "Gift card",
          description: "Gift card or store credit.",
        },
        DIGITAL_BALANCE: {
          label: "Digital balance",
          description: "Balance held in an app, platform or service.",
        },
        CRYPTO_WALLET: {
          label: "Crypto wallet",
          description:
            "One or more crypto assets. Never enter a private key or seed phrase.",
        },
        CREDIT_CARD: {
          label: "Credit card",
          description: "Credit limit and statement in one fiat currency.",
        },
        PREPAID_CARD: {
          label: "Prepaid card",
          description: "Physical or virtual prepaid card.",
        },
        OTHER: {
          label: "Other",
          description:
            "Custom type. Review the net worth and available balance settings.",
        },
      },
    },
    es: {
      transactionType: {
        OPENING_BALANCE: "Saldo inicial",
        INCOME: "Ingreso",
        EXPENSE: "Gasto",
        TRANSFER: "Transferencia",
        EXCHANGE: "Cambio de divisas",
        REFUND: "Reembolso",
        ADJUSTMENT: "Ajuste",
        FEE: "Comisión",
        INTEREST_INCOME: "Rendimiento",
        CARD_PAYMENT: "Pago de tarjeta",
        INVESTMENT: "Inversión",
      },
      transactionStatus: {
        POSTED: "Registrado",
        PENDING: "Pendiente",
        ESTIMATED: "Estimado",
      },
      categoryKind: { INCOME: "Ingreso", EXPENSE: "Gasto" },
      frequency: {
        MONTHLY: "Mensual",
        BIMONTHLY: "Bimestral",
        QUARTERLY: "Trimestral",
        SEMIANNUAL: "Semestral",
        YEARLY: "Anual",
      },
      holdingClass: {
        REAL_ESTATE: "Inmueble",
        VEHICLE: "Vehículo",
        FIXED_INCOME: "Renta fija",
        EQUITY: "Renta variable",
        INTERNATIONAL: "Internacional",
        CRYPTO: "Cripto",
        PENSION: "Jubilación",
        OTHER: "Otro",
      },
      cardType: {
        CREDIT: "Crédito",
        DEBIT: "Débito",
        PREPAID: "Prepaga",
        BENEFIT: "Beneficio",
        GIFT: "Tarjeta de regalo",
        VIRTUAL: "Virtual",
      },
      householdRole: {
        ADMIN: "Admin — gestiona el grupo",
        MEMBER: "Miembro — consulta y registra",
        VIEWER: "Lector — solo consulta",
      },
      memberRole: {
        OWNER: "Titular",
        VIEWER: "Lector — consulta",
        TRANSACTION_MANAGER: "Gestor — movimientos",
      },
      statementStatus: {
        paid: "Pagado",
        closed: "Cerrado · a pagar",
        overdue: "Vencido",
        open: "Abierto",
        future: "Próximo",
      },
      accountType: {
        CASH_WALLET: {
          label: "Billetera de efectivo",
          description: "Efectivo o saldo simple en una moneda.",
        },
        BANK_ACCOUNT: {
          label: "Cuenta bancaria",
          description: "Cuenta bancaria tradicional en una moneda fiduciaria.",
        },
        INTERNATIONAL_ACCOUNT: {
          label: "Cuenta internacional",
          description:
            "Cuenta local o internacional con una o más monedas fiduciarias.",
        },
        MULTI_CURRENCY_ACCOUNT: {
          label: "Cuenta multimoneda",
          description: "Varios saldos fiduciarios separados por moneda.",
        },
        BENEFIT_ACCOUNT: {
          label: "Cuenta o saldo de beneficio",
          description: "Vales, beneficio corporativo o saldo de movilidad.",
        },
        GIFT_CARD: {
          label: "Tarjeta de regalo",
          description: "Tarjeta de regalo o crédito de tienda.",
        },
        DIGITAL_BALANCE: {
          label: "Saldo digital",
          description: "Saldo en una app, plataforma o servicio.",
        },
        CRYPTO_WALLET: {
          label: "Billetera cripto",
          description:
            "Uno o más criptoactivos. Nunca ingreses una clave privada ni la seed phrase.",
        },
        CREDIT_CARD: {
          label: "Tarjeta de crédito",
          description: "Límite y resumen en una moneda fiduciaria.",
        },
        PREPAID_CARD: {
          label: "Tarjeta prepaga",
          description: "Tarjeta prepaga física o virtual.",
        },
        OTHER: {
          label: "Otro",
          description:
            "Tipo personalizado. Revisa los indicadores de patrimonio y saldo disponible.",
        },
      },
    },
  },
);
