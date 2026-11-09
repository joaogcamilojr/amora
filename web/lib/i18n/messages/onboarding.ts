import { defineMessages } from "./define";

/** Primeiro acesso: país, preferências e pacote inicial (categorias, regras e tipos de conta). */
export default defineMessages(
  {
    title: "Bem-vindo ao Amora",
    subtitle:
      "Vamos configurar o básico. Você pode mudar tudo depois em Preferências.",
    stepLabel: "Passo {current} de {total}",
    steps: {
      country: "País",
      preferences: "Preferências",
      pack: "Pacote inicial",
      accounts: "Contas",
    },
    country: {
      title: "Onde você mora?",
      description:
        'O país define o pacote inicial de categorias e regras e o que conta como "fora do país" no patrimônio.',
      label: "País de residência",
      placeholder: "Selecione um país",
      packBadge: "Pacote: {name}",
      packNames: {
        BR: "Brasil",
        UY: "Uruguai",
        US: "Estados Unidos",
        GENERIC: "Genérico",
      },
      genericHint:
        "Ainda não há pacote específico para este país. Usaremos categorias universais.",
    },
    preferences: {
      title: "Idioma, fuso e moeda-base",
      description: "Sugeridos a partir do país. Ajuste se precisar.",
      pickCurrency: "Escolha a moeda-base",
    },
    pack: {
      title: "Pacote inicial",
      description:
        "Categorias e regras de classificação sugeridas. Nada é aplicado sem a sua confirmação.",
      categories: "Categorias ({count})",
      rules: "Regras de classificação ({count})",
      rulesHint:
        "Reconhecem estabelecimentos comuns do país nos extratos importados. Você edita ou desliga depois.",
      expenses: "Despesas",
      income: "Receitas",
      ruleLine: "{pattern} → {target}",
      noCategory: "sem categoria",
      empty: "Nenhuma regra específica para este país.",
    },
    accounts: {
      title: "Contas que costumam existir aí",
      description:
        "Tipos de conta sugeridos para o seu país. Criar uma conta exige moeda e instituição, por isso você cadastra depois.",
      create: "Criar",
    },
    actions: {
      next: "Continuar",
      back: "Voltar",
      finish: "Concluir",
      skip: "Pular por enquanto",
      finishing: "Configurando...",
    },
    result: "Pronto: {categories} categorias e {rules} regras criadas.",
    saveFailed: "Não foi possível concluir",
    settings: {
      countryLabel: "País de residência",
      countryHint:
        "Usado para o pacote inicial e para o indicador de patrimônio fora do país.",
      noCountry: "Não informado",
      applyPack: "Aplicar pacote do país",
      applyPackHint:
        "Adiciona as categorias e regras do pacote que ainda não existem. Não altera as que você já tem.",
      applied:
        "Pacote aplicado: {categories} categorias e {rules} regras novas.",
      needCountry: "Salve o país antes de aplicar o pacote.",
    },
    categories: {
      uncategorized: "Sem categoria",
      groceries: "Mercado",
      restaurants: "Restaurantes e delivery",
      transport: "Transporte",
      housing: "Moradia",
      utilities: "Contas de consumo",
      health: "Saúde",
      education: "Educação",
      leisure: "Lazer",
      shopping: "Compras",
      subscriptions: "Assinaturas",
      travel: "Viagens",
      insurance: "Seguros",
      taxes: "Impostos",
      bankFees: "Tarifas e encargos",
      giftsDonations: "Presentes e doações",
      salary: "Salário",
      freelance: "Trabalho autônomo",
      investmentIncome: "Rendimentos",
      otherIncome: "Outras receitas",
      condominium: "Condomínio",
      mealVoucher: "Vale-alimentação/refeição",
      tips: "Gorjetas",
    },
  },
  {
    en: {
      title: "Welcome to Amora",
      subtitle:
        "Let's set up the basics. You can change everything later in Preferences.",
      stepLabel: "Step {current} of {total}",
      steps: {
        country: "Country",
        preferences: "Preferences",
        pack: "Starter pack",
        accounts: "Accounts",
      },
      country: {
        title: "Where do you live?",
        description:
          'Your country sets the starter pack of categories and rules and what counts as "abroad" in net worth.',
        label: "Country of residence",
        placeholder: "Select a country",
        packBadge: "Pack: {name}",
        packNames: {
          BR: "Brazil",
          UY: "Uruguay",
          US: "United States",
          GENERIC: "Generic",
        },
        genericHint:
          "There is no country-specific pack yet. We'll use universal categories.",
      },
      preferences: {
        title: "Language, time zone and base currency",
        description: "Suggested from your country. Adjust if needed.",
        pickCurrency: "Choose the base currency",
      },
      pack: {
        title: "Starter pack",
        description:
          "Suggested categories and classification rules. Nothing is applied without your confirmation.",
        categories: "Categories ({count})",
        rules: "Classification rules ({count})",
        rulesHint:
          "They recognize common merchants in your country on imported statements. You can edit or turn them off later.",
        expenses: "Expenses",
        income: "Income",
        ruleLine: "{pattern} → {target}",
        noCategory: "no category",
        empty: "No country-specific rules.",
      },
      accounts: {
        title: "Accounts people usually have there",
        description:
          "Suggested account types for your country. Creating an account needs a currency and an institution, so you add them afterwards.",
        create: "Create",
      },
      actions: {
        next: "Continue",
        back: "Back",
        finish: "Finish",
        skip: "Skip for now",
        finishing: "Setting up...",
      },
      result: "Done: {categories} categories and {rules} rules created.",
      saveFailed: "Couldn't finish",
      settings: {
        countryLabel: "Country of residence",
        countryHint:
          "Used for the starter pack and the net-worth-abroad indicator.",
        noCountry: "Not set",
        applyPack: "Apply country pack",
        applyPackHint:
          "Adds the pack's categories and rules that don't exist yet. Your existing ones are left untouched.",
        applied:
          "Pack applied: {categories} new categories and {rules} new rules.",
        needCountry: "Save your country before applying the pack.",
      },
      categories: {
        uncategorized: "Uncategorized",
        groceries: "Groceries",
        restaurants: "Restaurants and delivery",
        transport: "Transport",
        housing: "Housing",
        utilities: "Utilities",
        health: "Health",
        education: "Education",
        leisure: "Leisure",
        shopping: "Shopping",
        subscriptions: "Subscriptions",
        travel: "Travel",
        insurance: "Insurance",
        taxes: "Taxes",
        bankFees: "Bank fees and charges",
        giftsDonations: "Gifts and donations",
        salary: "Salary",
        freelance: "Freelance",
        investmentIncome: "Investment income",
        otherIncome: "Other income",
        condominium: "Condo / HOA fees",
        mealVoucher: "Meal vouchers",
        tips: "Tips",
      },
    },
    es: {
      title: "Te damos la bienvenida a Amora",
      subtitle:
        "Configuremos lo básico. Puedes cambiar todo después en Preferencias.",
      stepLabel: "Paso {current} de {total}",
      steps: {
        country: "País",
        preferences: "Preferencias",
        pack: "Paquete inicial",
        accounts: "Cuentas",
      },
      country: {
        title: "¿Dónde vives?",
        description:
          'El país define el paquete inicial de categorías y reglas y qué cuenta como "fuera del país" en el patrimonio.',
        label: "País de residencia",
        placeholder: "Selecciona un país",
        packBadge: "Paquete: {name}",
        packNames: {
          BR: "Brasil",
          UY: "Uruguay",
          US: "Estados Unidos",
          GENERIC: "Genérico",
        },
        genericHint:
          "Aún no hay un paquete específico para este país. Usaremos categorías universales.",
      },
      preferences: {
        title: "Idioma, zona horaria y moneda base",
        description: "Sugeridos según tu país. Ajusta si lo necesitas.",
        pickCurrency: "Elige la moneda base",
      },
      pack: {
        title: "Paquete inicial",
        description:
          "Categorías y reglas de clasificación sugeridas. No se aplica nada sin tu confirmación.",
        categories: "Categorías ({count})",
        rules: "Reglas de clasificación ({count})",
        rulesHint:
          "Reconocen comercios comunes del país en los extractos importados. Puedes editarlas o desactivarlas después.",
        expenses: "Gastos",
        income: "Ingresos",
        ruleLine: "{pattern} → {target}",
        noCategory: "sin categoría",
        empty: "No hay reglas específicas para este país.",
      },
      accounts: {
        title: "Cuentas que suelen existir allí",
        description:
          "Tipos de cuenta sugeridos para tu país. Crear una cuenta requiere moneda e institución, por eso las registras después.",
        create: "Crear",
      },
      actions: {
        next: "Continuar",
        back: "Volver",
        finish: "Finalizar",
        skip: "Omitir por ahora",
        finishing: "Configurando...",
      },
      result: "Listo: {categories} categorías y {rules} reglas creadas.",
      saveFailed: "No se pudo finalizar",
      settings: {
        countryLabel: "País de residencia",
        countryHint:
          "Se usa para el paquete inicial y para el indicador de patrimonio fuera del país.",
        noCountry: "Sin informar",
        applyPack: "Aplicar paquete del país",
        applyPackHint:
          "Agrega las categorías y reglas del paquete que aún no existen. No modifica las que ya tienes.",
        applied:
          "Paquete aplicado: {categories} categorías y {rules} reglas nuevas.",
        needCountry: "Guarda el país antes de aplicar el paquete.",
      },
      categories: {
        uncategorized: "Sin categoría",
        groceries: "Supermercado",
        restaurants: "Restaurantes y delivery",
        transport: "Transporte",
        housing: "Vivienda",
        utilities: "Servicios",
        health: "Salud",
        education: "Educación",
        leisure: "Ocio",
        shopping: "Compras",
        subscriptions: "Suscripciones",
        travel: "Viajes",
        insurance: "Seguros",
        taxes: "Impuestos",
        bankFees: "Comisiones y cargos",
        giftsDonations: "Regalos y donaciones",
        salary: "Sueldo",
        freelance: "Trabajo independiente",
        investmentIncome: "Rendimientos",
        otherIncome: "Otros ingresos",
        condominium: "Gastos comunes",
        mealVoucher: "Vales de comida",
        tips: "Propinas",
      },
    },
  },
);
