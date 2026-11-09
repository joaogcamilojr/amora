import { defineMessages } from "./define";

/** Landing page pública (app/page.tsx). */
export default defineMessages(
  {
    meta: {
      description:
        "Amora — finanças pessoais e familiares em várias moedas: contas, cartões, viagens e patrimônio em um só lugar. Um produto Apgees.",
    },
    nav: {
      product: "Produto",
      travelers: "Para viajantes",
      rates: "Cotações",
      security: "Segurança",
      signIn: "Entrar",
      earlyAccess: "Quero acesso antecipado",
    },
    hero: {
      eyebrow: "Finanças para quem vive entre moedas",
      titleLine1: "Seu dinheiro não",
      titleLine2: "tem",
      titleEmphasis: "fronteiras.",
      titleLine3: "Seu controle também não.",
      lead: "Organize contas, viagens e patrimônio em múltiplas moedas — do real ao dólar, do peso ao Bitcoin — em uma única visão simples.",
      joinWaitlist: "Entrar na lista de espera",
      howItWorks: "Ver como funciona",
      note: "Sem cartão de crédito · Acesso antecipado gratuito",
    },
    scene: {
      label: "Prévia do painel financeiro",
      fxNow: "Cotação agora",
      fxPair: "USD 1 = {value}",
      today: "{value} hoje",
      netWorth: "Patrimônio global",
      thisMonth: "↗ {value} este mês",
      myCurrencies: "Minhas moedas",
      seeAll: "Ver todas",
      trip: "Viagem · {place}",
      tripPlace: "Montevidéu",
      budgetUsed: "{value} do orçamento",
    },
    problem: {
      kicker: "O problema",
      titleLine1: "Você viaja pelo mundo.",
      titleLine2: "Suas finanças ficam para trás.",
      lead: "Aplicativos tradicionais entendem uma conta, uma moeda, um país. Sua vida já não funciona assim.",
      receiptCard: "Cartão internacional",
      receiptCardNote: "Qual foi a cotação mesmo?",
      receiptSheet: "Planilha viagem.xlsx",
      receiptSheetNote: "última edição há 12 dias",
      receiptExchange: "Exchange",
      receiptExchangeNote: "fora do seu patrimônio",
      solutionTitle: "Uma visão. Todas as moedas.",
      solutionText:
        "O Amora converte, organiza e contextualiza seu dinheiro sem esconder a moeda original.",
    },
    features: {
      kicker: "Feito para uma vida global",
      titleLine1: "Controle financeiro que",
      titleLine2: "fala a língua da sua jornada.",
      perDay: "{value} / dia",
      currencies: { one: "{count} moeda", other: "{count} moedas" },
      items: {
        language: {
          title: "Tudo no seu idioma financeiro",
          text: "Veja cada compra na moeda original e o impacto real na sua moeda-base. Sem planilhas paralelas.",
        },
        trips: {
          title: "Viagens sem sustos",
          text: "Crie uma viagem, defina o orçamento e acompanhe quanto ainda pode gastar por dia e por categoria.",
        },
        bitcoin: {
          title: "Bitcoin faz parte do patrimônio",
          text: "Acompanhe BTC junto de contas e moedas tradicionais, com posição e variação claramente separadas.",
        },
        countries: {
          title: "Uma visão para cada país",
          text: "Dólar, euro, real, peso uruguaio e chileno reunidos em uma carteira global.",
        },
      },
    },
    converter: {
      kicker: "Câmbio sem adivinhação",
      titleLine1: "Antes de comprar,",
      titleLine2: "saiba quanto custa.",
      lead: "Converta moedas com uma referência clara. No produto, cada lançamento preserva o valor e a moeda originais.",
      demo: "Demonstração com valores ilustrativos",
      realtime: "Integração de dados em tempo real prevista para o produto.",
      youHave: "Você tem",
      swap: "Inverter moedas",
      youGet: "Você terá aproximadamente",
    },
    security: {
      kicker: "Seu dinheiro é assunto sério",
      titleLine1: "Clareza no produto.",
      titleLine2: "Responsabilidade nos dados.",
      items: {
        control: {
          title: "Você mantém o controle",
          text: "Seus dados financeiros são seus. Projetaremos exportação e exclusão sem aprisionamento.",
        },
        privacy: {
          title: "Menos dados, mais privacidade",
          text: "Coletar somente o necessário, com consentimento claro e proteção desde a arquitetura.",
        },
        custody: {
          title: "Informação, não custódia",
          text: "O produto organiza e acompanha. Não guarda seu dinheiro nem suas chaves de Bitcoin.",
        },
      },
    },
    faq: {
      kicker: "Perguntas reais",
      titleLine1: "O que você",
      titleLine2: "precisa saber.",
      items: {
        bankAccount: {
          question: "O Amora será uma conta bancária?",
          answer:
            "Não. A proposta inicial é ser um sistema de organização e inteligência financeira pessoal, sem custodiar dinheiro.",
        },
        noBank: {
          question: "Posso usar sem conectar meu banco?",
          answer:
            "Sim. O lançamento manual e a importação fazem parte da visão. Conexões bancárias serão avaliadas por país e parceiro.",
        },
        bitcoin: {
          question: "Bitcoin fica misturado com saldo disponível?",
          answer:
            "Não. Criptoativos aparecem no patrimônio, mas separados de caixa e contas correntes.",
        },
        currencies: {
          question: "Quais moedas estarão disponíveis?",
          answer:
            "O foco inicial inclui BRL, USD, EUR, UYU, CLP e BTC, com arquitetura preparada para ampliar a cobertura.",
        },
      },
    },
    cta: {
      titleLine1: "Seu dinheiro já é global.",
      titleLine2: "Agora seu controle também será.",
      lead: "Entre na lista para acompanhar o desenvolvimento e participar dos primeiros testes.",
      name: "Seu nome",
      emailPlaceholder: "seu@email.com",
      emailLabel: "Seu e-mail",
      submit: "Quero participar",
      success: "Cadastro criado. Confira seu e-mail para confirmar o acesso.",
      note: "Produto em fase de descoberta. Sem spam.",
    },
    footer: {
      tagline: "Uma nova forma de entender seu dinheiro no mundo.",
      origin: "Produto Apgees · Três Corações + Montevidéu",
      privacy: "Privacidade",
      terms: "Termos",
    },
  },
  {
    en: {
      meta: {
        description:
          "Amora — personal and family finances in multiple currencies: accounts, cards, trips and net worth in one place. An Apgees product.",
      },
      nav: {
        product: "Product",
        travelers: "For travelers",
        rates: "Exchange rates",
        security: "Security",
        signIn: "Sign in",
        earlyAccess: "Get early access",
      },
      hero: {
        eyebrow: "Finances for people who live across currencies",
        titleLine1: "Your money knows",
        titleLine2: "no",
        titleEmphasis: "borders.",
        titleLine3: "Neither does your control.",
        lead: "Organize accounts, trips and net worth in multiple currencies — from reais to dollars, from pesos to Bitcoin — in one simple view.",
        joinWaitlist: "Join the waitlist",
        howItWorks: "See how it works",
        note: "No credit card · Free early access",
      },
      scene: {
        label: "Financial dashboard preview",
        fxNow: "Rate now",
        fxPair: "USD 1 = {value}",
        today: "{value} today",
        netWorth: "Global net worth",
        thisMonth: "↗ {value} this month",
        myCurrencies: "My currencies",
        seeAll: "See all",
        trip: "Trip · {place}",
        tripPlace: "Montevideo",
        budgetUsed: "{value} of budget",
      },
      problem: {
        kicker: "The problem",
        titleLine1: "You travel the world.",
        titleLine2: "Your finances get left behind.",
        lead: "Traditional apps understand one account, one currency, one country. Your life doesn't work that way anymore.",
        receiptCard: "International card",
        receiptCardNote: "What was the rate again?",
        receiptSheet: "Spreadsheet trip.xlsx",
        receiptSheetNote: "last edited 12 days ago",
        receiptExchange: "Exchange",
        receiptExchangeNote: "left out of your net worth",
        solutionTitle: "One view. Every currency.",
        solutionText:
          "Amora converts, organizes and puts your money in context without hiding the original currency.",
      },
      features: {
        kicker: "Built for a global life",
        titleLine1: "Financial control that",
        titleLine2: "speaks the language of your journey.",
        perDay: "{value} / day",
        currencies: { one: "{count} currency", other: "{count} currencies" },
        items: {
          language: {
            title: "Everything in your financial language",
            text: "See every purchase in its original currency and its real impact in your base currency. No side spreadsheets.",
          },
          trips: {
            title: "Trips without surprises",
            text: "Create a trip, set the budget and track how much you can still spend per day and per category.",
          },
          bitcoin: {
            title: "Bitcoin is part of your net worth",
            text: "Track BTC alongside traditional accounts and currencies, with position and change clearly separated.",
          },
          countries: {
            title: "One view for every country",
            text: "Dollar, euro, real, Uruguayan and Chilean pesos together in one global wallet.",
          },
        },
      },
      converter: {
        kicker: "Exchange without guesswork",
        titleLine1: "Before you buy,",
        titleLine2: "know what it costs.",
        lead: "Convert currencies with a clear reference. In the product, every transaction keeps its original amount and currency.",
        demo: "Demo with illustrative values",
        realtime: "Real-time data integration is planned for the product.",
        youHave: "You have",
        swap: "Swap currencies",
        youGet: "You'll get about",
      },
      security: {
        kicker: "Your money is serious business",
        titleLine1: "Clarity in the product.",
        titleLine2: "Responsibility with data.",
        items: {
          control: {
            title: "You stay in control",
            text: "Your financial data is yours. We'll design export and deletion with no lock-in.",
          },
          privacy: {
            title: "Less data, more privacy",
            text: "Collect only what's needed, with clear consent and protection built into the architecture.",
          },
          custody: {
            title: "Information, not custody",
            text: "The product organizes and tracks. It doesn't hold your money or your Bitcoin keys.",
          },
        },
      },
      faq: {
        kicker: "Real questions",
        titleLine1: "What you",
        titleLine2: "need to know.",
        items: {
          bankAccount: {
            question: "Will Amora be a bank account?",
            answer:
              "No. The initial goal is to be a personal financial organization and intelligence system, without holding money.",
          },
          noBank: {
            question: "Can I use it without connecting my bank?",
            answer:
              "Yes. Manual entry and file import are part of the plan. Bank connections will be evaluated by country and partner.",
          },
          bitcoin: {
            question: "Is Bitcoin mixed with my available balance?",
            answer:
              "No. Crypto assets show up in your net worth, but separate from cash and checking accounts.",
          },
          currencies: {
            question: "Which currencies will be available?",
            answer:
              "The initial focus includes BRL, USD, EUR, UYU, CLP and BTC, with an architecture ready to expand coverage.",
          },
        },
      },
      cta: {
        titleLine1: "Your money is already global.",
        titleLine2: "Now your control will be too.",
        lead: "Join the list to follow development and take part in the first tests.",
        name: "Your name",
        emailPlaceholder: "you@email.com",
        emailLabel: "Your email",
        submit: "I want in",
        success: "You're signed up. Check your email to confirm access.",
        note: "Product in discovery phase. No spam.",
      },
      footer: {
        tagline: "A new way to understand your money around the world.",
        origin: "An Apgees product · Três Corações + Montevideo",
        privacy: "Privacy",
        terms: "Terms",
      },
    },
    es: {
      meta: {
        description:
          "Amora — finanzas personales y familiares en varias monedas: cuentas, tarjetas, viajes y patrimonio en un solo lugar. Un producto Apgees.",
      },
      nav: {
        product: "Producto",
        travelers: "Para viajeros",
        rates: "Cotizaciones",
        security: "Seguridad",
        signIn: "Ingresar",
        earlyAccess: "Quiero acceso anticipado",
      },
      hero: {
        eyebrow: "Finanzas para quienes viven entre monedas",
        titleLine1: "Tu dinero no",
        titleLine2: "tiene",
        titleEmphasis: "fronteras.",
        titleLine3: "Tu control tampoco.",
        lead: "Organiza cuentas, viajes y patrimonio en varias monedas — del real al dólar, del peso al Bitcoin — en una sola vista simple.",
        joinWaitlist: "Unirme a la lista de espera",
        howItWorks: "Ver cómo funciona",
        note: "Sin tarjeta de crédito · Acceso anticipado gratuito",
      },
      scene: {
        label: "Vista previa del panel financiero",
        fxNow: "Cotización ahora",
        fxPair: "USD 1 = {value}",
        today: "{value} hoy",
        netWorth: "Patrimonio global",
        thisMonth: "↗ {value} este mes",
        myCurrencies: "Mis monedas",
        seeAll: "Ver todas",
        trip: "Viaje · {place}",
        tripPlace: "Montevideo",
        budgetUsed: "{value} del presupuesto",
      },
      problem: {
        kicker: "El problema",
        titleLine1: "Viajas por el mundo.",
        titleLine2: "Tus finanzas se quedan atrás.",
        lead: "Las apps tradicionales entienden una cuenta, una moneda, un país. Tu vida ya no funciona así.",
        receiptCard: "Tarjeta internacional",
        receiptCardNote: "¿Cuál era la cotización?",
        receiptSheet: "Planilla viaje.xlsx",
        receiptSheetNote: "última edición hace 12 días",
        receiptExchange: "Exchange",
        receiptExchangeNote: "fuera de tu patrimonio",
        solutionTitle: "Una vista. Todas las monedas.",
        solutionText:
          "Amora convierte, organiza y da contexto a tu dinero sin ocultar la moneda original.",
      },
      features: {
        kicker: "Hecho para una vida global",
        titleLine1: "Control financiero que",
        titleLine2: "habla el idioma de tu recorrido.",
        perDay: "{value} / día",
        currencies: { one: "{count} moneda", other: "{count} monedas" },
        items: {
          language: {
            title: "Todo en tu idioma financiero",
            text: "Ve cada compra en su moneda original y su impacto real en tu moneda base. Sin planillas paralelas.",
          },
          trips: {
            title: "Viajes sin sorpresas",
            text: "Crea un viaje, define el presupuesto y sigue cuánto puedes gastar todavía por día y por categoría.",
          },
          bitcoin: {
            title: "Bitcoin es parte del patrimonio",
            text: "Sigue BTC junto a cuentas y monedas tradicionales, con posición y variación claramente separadas.",
          },
          countries: {
            title: "Una vista para cada país",
            text: "Dólar, euro, real, peso uruguayo y chileno reunidos en una billetera global.",
          },
        },
      },
      converter: {
        kicker: "Cambio sin adivinanzas",
        titleLine1: "Antes de comprar,",
        titleLine2: "sabe cuánto cuesta.",
        lead: "Convierte monedas con una referencia clara. En el producto, cada movimiento conserva el monto y la moneda originales.",
        demo: "Demostración con valores ilustrativos",
        realtime:
          "La integración de datos en tiempo real está prevista para el producto.",
        youHave: "Tienes",
        swap: "Invertir monedas",
        youGet: "Recibirás aproximadamente",
      },
      security: {
        kicker: "Tu dinero es algo serio",
        titleLine1: "Claridad en el producto.",
        titleLine2: "Responsabilidad con los datos.",
        items: {
          control: {
            title: "Tú mantienes el control",
            text: "Tus datos financieros son tuyos. Diseñaremos la exportación y la eliminación sin ataduras.",
          },
          privacy: {
            title: "Menos datos, más privacidad",
            text: "Recolectar solo lo necesario, con consentimiento claro y protección desde la arquitectura.",
          },
          custody: {
            title: "Información, no custodia",
            text: "El producto organiza y acompaña. No guarda tu dinero ni tus claves de Bitcoin.",
          },
        },
      },
      faq: {
        kicker: "Preguntas reales",
        titleLine1: "Lo que",
        titleLine2: "necesitas saber.",
        items: {
          bankAccount: {
            question: "¿Amora será una cuenta bancaria?",
            answer:
              "No. La propuesta inicial es ser un sistema de organización e inteligencia financiera personal, sin custodiar dinero.",
          },
          noBank: {
            question: "¿Puedo usarlo sin conectar mi banco?",
            answer:
              "Sí. El registro manual y la importación son parte de la visión. Las conexiones bancarias se evaluarán por país y socio.",
          },
          bitcoin: {
            question: "¿Bitcoin se mezcla con el saldo disponible?",
            answer:
              "No. Los criptoactivos aparecen en el patrimonio, pero separados del efectivo y las cuentas corrientes.",
          },
          currencies: {
            question: "¿Qué monedas estarán disponibles?",
            answer:
              "El foco inicial incluye BRL, USD, EUR, UYU, CLP y BTC, con una arquitectura preparada para ampliar la cobertura.",
          },
        },
      },
      cta: {
        titleLine1: "Tu dinero ya es global.",
        titleLine2: "Ahora tu control también lo será.",
        lead: "Únete a la lista para seguir el desarrollo y participar en las primeras pruebas.",
        name: "Tu nombre",
        emailPlaceholder: "tu@email.com",
        emailLabel: "Tu correo electrónico",
        submit: "Quiero participar",
        success: "Registro creado. Revisa tu correo para confirmar el acceso.",
        note: "Producto en fase de descubrimiento. Sin spam.",
      },
      footer: {
        tagline: "Una nueva forma de entender tu dinero en el mundo.",
        origin: "Producto Apgees · Três Corações + Montevideo",
        privacy: "Privacidad",
        terms: "Términos",
      },
    },
  },
);
