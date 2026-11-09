import { defineMessages } from "./define";

/** Planos e cobrança (Stripe): painel em Preferências e aviso de plano no topo do app. */
export default defineMessages(
  {
    title: "Plano e cobrança",
    subtitle:
      "Teste grátis de 14 dias do Premium, sem cartão. Depois escolha um plano para continuar lançando.",
    plans: {
      START: {
        name: "Start",
        tagline: "Para organizar uma conta só, na sua moeda.",
      },
      PREMIUM: {
        name: "Premium",
        tagline: "Vida financeira em várias moedas.",
      },
      FAMILY: { name: "Família", tagline: "Premium para a casa toda." },
    },
    features: {
      START: {
        accounts: "Até {count} contas ativas",
        currency: "Uma moeda (a moeda-base)",
        manualRate: "Cotação manual",
      },
      PREMIUM: {
        accounts: "Contas ilimitadas",
        currencies: "Várias moedas",
        autoFx: "Câmbio automático",
      },
      FAMILY: {
        premium: "Tudo do Premium",
        household: "Grupo familiar com até {count} membros",
        members: "Os membros usam o app sem assinatura própria",
      },
    },
    interval: {
      MONTH: "mês",
      YEAR: "ano",
      monthly: "Mensal",
      yearly: "Anual",
      save: "2 meses grátis",
      price: "{price}/{interval}",
    },
    state: {
      TRIAL: {
        one: "Teste grátis: {count} dia restante (Premium)",
        other: "Teste grátis: {count} dias restantes (Premium)",
      },
      ACTIVE: "Assinatura ativa: {plan}",
      PAST_DUE:
        "Pagamento pendente. Atualize a forma de pagamento para não perder o acesso.",
      GRACE: "Assinatura cancelada. Você usa o {plan} até {date}.",
      EXPIRED:
        "Somente leitura: seus dados estão salvos. Escolha um plano para voltar a lançar.",
      inherited:
        "Você tem os benefícios do plano Família pelo seu grupo familiar.",
      renews: "Renova em {date}.",
      cancels: "Cancela em {date}.",
    },
    actions: {
      subscribe: "Assinar {plan}",
      current: "Plano atual",
      manage: "Gerenciar assinatura",
      redirecting: "Redirecionando…",
      failed: "Não foi possível abrir o pagamento",
    },
    unavailable: "Cobrança indisponível neste ambiente.",
    devDisabled:
      "Modo de desenvolvimento: cobrança desativada (BILLING_DISABLED). Todos os recursos estão liberados.",
    result: {
      success: "Pagamento recebido. Seu plano será atualizado em instantes.",
      canceled: "Assinatura não concluída.",
    },
    banner: {
      trial: {
        one: "Teste grátis: {count} dia restante.",
        other: "Teste grátis: {count} dias restantes.",
      },
      expired: "Somente leitura. Escolha um plano para voltar a lançar.",
      pastDue: "Pagamento pendente. Atualize a forma de pagamento.",
      link: "Ver planos",
    },
  },
  {
    en: {
      title: "Plan and billing",
      subtitle:
        "14-day free Premium trial, no card. Then pick a plan to keep adding data.",
      plans: {
        START: {
          name: "Start",
          tagline: "To organize a single account in your currency.",
        },
        PREMIUM: {
          name: "Premium",
          tagline: "A financial life in several currencies.",
        },
        FAMILY: { name: "Family", tagline: "Premium for the whole household." },
      },
      features: {
        START: {
          accounts: "Up to {count} active accounts",
          currency: "One currency (the base currency)",
          manualRate: "Manual exchange rates",
        },
        PREMIUM: {
          accounts: "Unlimited accounts",
          currencies: "Multiple currencies",
          autoFx: "Automatic exchange rates",
        },
        FAMILY: {
          premium: "Everything in Premium",
          household: "Household with up to {count} members",
          members: "Members use the app without their own subscription",
        },
      },
      interval: {
        MONTH: "month",
        YEAR: "year",
        monthly: "Monthly",
        yearly: "Yearly",
        save: "2 months free",
        price: "{price}/{interval}",
      },
      state: {
        TRIAL: {
          one: "Free trial: {count} day left (Premium)",
          other: "Free trial: {count} days left (Premium)",
        },
        ACTIVE: "Active subscription: {plan}",
        PAST_DUE: "Payment pending. Update your payment method to keep access.",
        GRACE: "Subscription canceled. You have {plan} until {date}.",
        EXPIRED: "Read-only: your data is safe. Pick a plan to add data again.",
        inherited: "You get Family plan benefits through your household.",
        renews: "Renews on {date}.",
        cancels: "Cancels on {date}.",
      },
      actions: {
        subscribe: "Subscribe to {plan}",
        current: "Current plan",
        manage: "Manage subscription",
        redirecting: "Redirecting…",
        failed: "Couldn't open the payment page",
      },
      unavailable: "Billing is unavailable in this environment.",
      devDisabled:
        "Development mode: billing is disabled (BILLING_DISABLED). All features are unlocked.",
      result: {
        success: "Payment received. Your plan will update shortly.",
        canceled: "Subscription not completed.",
      },
      banner: {
        trial: {
          one: "Free trial: {count} day left.",
          other: "Free trial: {count} days left.",
        },
        expired: "Read-only. Pick a plan to add data again.",
        pastDue: "Payment pending. Update your payment method.",
        link: "View plans",
      },
    },
    es: {
      title: "Plan y facturación",
      subtitle:
        "Prueba gratis de 14 días del Premium, sin tarjeta. Después elige un plan para seguir registrando.",
      plans: {
        START: {
          name: "Start",
          tagline: "Para ordenar una sola cuenta, en tu moneda.",
        },
        PREMIUM: {
          name: "Premium",
          tagline: "Vida financiera en varias monedas.",
        },
        FAMILY: { name: "Familia", tagline: "Premium para toda la casa." },
      },
      features: {
        START: {
          accounts: "Hasta {count} cuentas activas",
          currency: "Una moneda (la moneda base)",
          manualRate: "Cotización manual",
        },
        PREMIUM: {
          accounts: "Cuentas ilimitadas",
          currencies: "Varias monedas",
          autoFx: "Cambio automático",
        },
        FAMILY: {
          premium: "Todo lo del Premium",
          household: "Grupo familiar de hasta {count} miembros",
          members: "Los miembros usan la app sin suscripción propia",
        },
      },
      interval: {
        MONTH: "mes",
        YEAR: "año",
        monthly: "Mensual",
        yearly: "Anual",
        save: "2 meses gratis",
        price: "{price}/{interval}",
      },
      state: {
        TRIAL: {
          one: "Prueba gratis: {count} día restante (Premium)",
          other: "Prueba gratis: {count} días restantes (Premium)",
        },
        ACTIVE: "Suscripción activa: {plan}",
        PAST_DUE:
          "Pago pendiente. Actualiza el medio de pago para no perder el acceso.",
        GRACE: "Suscripción cancelada. Usas el {plan} hasta el {date}.",
        EXPIRED:
          "Solo lectura: tus datos están guardados. Elige un plan para volver a registrar.",
        inherited:
          "Tienes los beneficios del plan Familia por tu grupo familiar.",
        renews: "Se renueva el {date}.",
        cancels: "Se cancela el {date}.",
      },
      actions: {
        subscribe: "Suscribirme a {plan}",
        current: "Plan actual",
        manage: "Gestionar suscripción",
        redirecting: "Redirigiendo…",
        failed: "No se pudo abrir el pago",
      },
      unavailable: "La facturación no está disponible en este entorno.",
      devDisabled:
        "Modo de desarrollo: facturación desactivada (BILLING_DISABLED). Todas las funciones están habilitadas.",
      result: {
        success: "Pago recibido. Tu plan se actualizará en instantes.",
        canceled: "Suscripción no completada.",
      },
      banner: {
        trial: {
          one: "Prueba gratis: {count} día restante.",
          other: "Prueba gratis: {count} días restantes.",
        },
        expired: "Solo lectura. Elige un plan para volver a registrar.",
        pastDue: "Pago pendiente. Actualiza el medio de pago.",
        link: "Ver planes",
      },
    },
  },
);
