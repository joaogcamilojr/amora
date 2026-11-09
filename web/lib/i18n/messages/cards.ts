import { defineMessages } from "./define";

/** Namespace "cards": tela de cartões, configuração do cartão e total oficial da fatura. */
export default defineMessages(
  {
    page: {
      description:
        "Limite, faturas e parcelas futuras. O limite usado já considera as parcelas que ainda vão entrar.",
      emptyTitle: "Nenhum cartão ativo",
      emptyBody: "Cadastre um cartão de crédito em Contas.",
      unpaidAlert: "Fatura de {month} ({amount} em aberto, vence {due})",
    },
    limit: {
      available: "Limite disponível",
      ofTotal: "de {limit} · {percent} comprometido",
      schedule: "Fecha dia {closing} · vence dia {due}",
      lastFour: "final {digits}",
      barLabel:
        "Limite: {posted} lançado, {future} em parcelas futuras, {available} disponível",
      posted: "Já lançado",
      futureInstallments: "Parcelas futuras",
      availableShort: "Disponível",
      cashbackBadge: "Cashback {rate} · ≈ {amount} em {year}",
    },
    current: {
      title: "Fatura atual",
      dates: "{month} · fecha {closing} · vence {due}",
      partialNote:
        "Parcial: inclui o que já foi lançado e as parcelas previstas. Compras novas entram até o fechamento.",
      none: "Nenhuma fatura aberta.",
      committed: {
        one: "Já comprometido na próxima fatura:",
        other: "Já comprometido nas próximas {count} faturas:",
      },
    },
    statements: {
      title: "Faturas",
      context: "Clique para ver o detalhe",
      cashback: "cashback ≈ {amount}",
    },
    detail: {
      title: "Fatura de {month}",
      context: {
        one: "Fecha {closing} · vence {due} · {count} lançamento",
        other: "Fecha {closing} · vence {due} · {count} lançamentos",
      },
      purchases: "Compras e encargos",
      credits: "Estornos e créditos",
      issuerTotal: "Total da fatura (emissor)",
      expectedTotal: "Total previsto",
      paid: "Pago",
      expectedCashback: "Cashback previsto ({rate})",
      differenceNote:
        "A diferença entre os lançamentos ({amount}) e o total do emissor vem de saldo da fatura anterior, pagamento a mais, crédito já abatido ou itens ainda não importados (ex.: transações internacionais).",
      emptyTitle: "Sem lançamentos detalhados",
      emptyBody: "Esta fatura foi registrada só pelo total.",
      payment: "Pagamento de fatura",
      via: "via {account}",
      otherAccount: "outra conta",
      unknownSource: "· origem não identificada",
      toConfirm: "A confirmar",
      toConfirmInline: "(a confirmar)",
      projected: "Prevista",
    },
    payments: {
      title: "Pagamentos desta fatura",
      context:
        "Feitos entre o fechamento e o próximo fechamento, com a conta de origem",
      none: "Nenhum pagamento registrado neste período.",
    },
    upcoming: {
      title: "Próximas faturas",
      context: "Só o que já está comprometido em parcelas",
      none: "Nenhuma parcela futura.",
    },
    archived: {
      title: "Cartões arquivados",
      badge: "Arquivado",
    },
    settings: {
      open: "Configurar cartão",
      title: "Configurar {name}",
      description:
        "Fechamento e vencimento definem em qual fatura cada compra cai.",
      invalid: "Confira limite, dias (1 a 31) e cashback.",
      limit: "Limite total",
      cashback: "Cashback (%)",
      cashbackHint: "Sobre compras líquidas da fatura. Antecipar não reduz.",
      closingDay: "Dia do fechamento",
      dueDay: "Dia do vencimento",
      paymentAccount: "Conta que paga a fatura",
      notes: "Anotação",
      notesPlaceholder: "Ex.: antecipar não reduz cashback",
    },
    statementForm: {
      register: "Registrar total oficial",
      edit: "Editar total oficial",
      title: "Total oficial da fatura",
      description:
        "Use os valores do PDF do emissor. Eles prevalecem sobre a soma dos lançamentos.",
      closing: "Fechamento",
      due: "Vencimento",
      invalidTotal: "Total inválido.",
      totalPlaceholder: "0,00",
    },
  },
  {
    en: {
      page: {
        description:
          "Credit limit, statements and future installments. Used credit already includes installments still to come.",
        emptyTitle: "No active cards",
        emptyBody: "Add a credit card under Accounts.",
        unpaidAlert: "{month} statement ({amount} outstanding, due {due})",
      },
      limit: {
        available: "Available credit",
        ofTotal: "of {limit} · {percent} used",
        schedule: "Closes on day {closing} · due on day {due}",
        lastFour: "ending in {digits}",
        barLabel:
          "Credit limit: {posted} posted, {future} in future installments, {available} available",
        posted: "Posted",
        futureInstallments: "Future installments",
        availableShort: "Available",
        cashbackBadge: "Cashback {rate} · ≈ {amount} in {year}",
      },
      current: {
        title: "Current statement",
        dates: "{month} · closes {closing} · due {due}",
        partialNote:
          "Partial: includes what has been posted plus expected installments. New purchases count until the closing date.",
        none: "No open statement.",
        committed: {
          one: "Already committed to the next statement:",
          other: "Already committed to the next {count} statements:",
        },
      },
      statements: {
        title: "Statements",
        context: "Click to see the details",
        cashback: "cashback ≈ {amount}",
      },
      detail: {
        title: "{month} statement",
        context: {
          one: "Closes {closing} · due {due} · {count} transaction",
          other: "Closes {closing} · due {due} · {count} transactions",
        },
        purchases: "Purchases and charges",
        credits: "Refunds and credits",
        issuerTotal: "Statement total (issuer)",
        expectedTotal: "Expected total",
        paid: "Paid",
        expectedCashback: "Expected cashback ({rate})",
        differenceNote:
          "The difference between the transactions ({amount}) and the issuer's total comes from a previous statement balance, an overpayment, a credit already applied or items not yet imported (e.g. international transactions).",
        emptyTitle: "No itemized transactions",
        emptyBody: "This statement was recorded by its total only.",
        payment: "Statement payment",
        via: "via {account}",
        otherAccount: "another account",
        unknownSource: "· unknown source",
        toConfirm: "To confirm",
        toConfirmInline: "(to confirm)",
        projected: "Expected",
      },
      payments: {
        title: "Payments for this statement",
        context:
          "Made between this closing date and the next one, with the source account",
        none: "No payments recorded in this period.",
      },
      upcoming: {
        title: "Upcoming statements",
        context: "Only what is already committed in installments",
        none: "No future installments.",
      },
      archived: {
        title: "Archived cards",
        badge: "Archived",
      },
      settings: {
        open: "Card settings",
        title: "Set up {name}",
        description:
          "The closing and due dates determine which statement each purchase falls on.",
        invalid: "Check the limit, days (1 to 31) and cashback.",
        limit: "Total credit limit",
        cashback: "Cashback (%)",
        cashbackHint:
          "On the statement's net purchases. Paying early doesn't reduce it.",
        closingDay: "Closing day",
        dueDay: "Due day",
        paymentAccount: "Account that pays the statement",
        notes: "Note",
        notesPlaceholder: "E.g. paying early doesn't reduce cashback",
      },
      statementForm: {
        register: "Record official total",
        edit: "Edit official total",
        title: "Official statement total",
        description:
          "Use the figures from the issuer's PDF. They take precedence over the sum of the transactions.",
        closing: "Closing date",
        due: "Due date",
        invalidTotal: "Invalid total.",
        totalPlaceholder: "0.00",
      },
    },
    es: {
      page: {
        description:
          "Límite, resúmenes y cuotas futuras. El límite usado ya considera las cuotas que todavía van a entrar.",
        emptyTitle: "No hay tarjetas activas",
        emptyBody: "Registra una tarjeta de crédito en Cuentas.",
        unpaidAlert: "Resumen de {month} ({amount} pendiente, vence el {due})",
      },
      limit: {
        available: "Límite disponible",
        ofTotal: "de {limit} · {percent} comprometido",
        schedule: "Cierra el día {closing} · vence el día {due}",
        lastFour: "terminada en {digits}",
        barLabel:
          "Límite: {posted} registrado, {future} en cuotas futuras, {available} disponible",
        posted: "Ya registrado",
        futureInstallments: "Cuotas futuras",
        availableShort: "Disponible",
        cashbackBadge: "Cashback {rate} · ≈ {amount} en {year}",
      },
      current: {
        title: "Resumen actual",
        dates: "{month} · cierra {closing} · vence {due}",
        partialNote:
          "Parcial: incluye lo ya registrado y las cuotas previstas. Las compras nuevas entran hasta el cierre.",
        none: "No hay ningún resumen abierto.",
        committed: {
          one: "Ya comprometido en el próximo resumen:",
          other: "Ya comprometido en los próximos {count} resúmenes:",
        },
      },
      statements: {
        title: "Resúmenes",
        context: "Haz clic para ver el detalle",
        cashback: "cashback ≈ {amount}",
      },
      detail: {
        title: "Resumen de {month}",
        context: {
          one: "Cierra {closing} · vence {due} · {count} movimiento",
          other: "Cierra {closing} · vence {due} · {count} movimientos",
        },
        purchases: "Compras y cargos",
        credits: "Reembolsos y créditos",
        issuerTotal: "Total del resumen (emisor)",
        expectedTotal: "Total previsto",
        paid: "Pagado",
        expectedCashback: "Cashback previsto ({rate})",
        differenceNote:
          "La diferencia entre los movimientos ({amount}) y el total del emisor viene del saldo del resumen anterior, un pago de más, un crédito ya descontado o ítems aún no importados (p. ej., transacciones internacionales).",
        emptyTitle: "Sin movimientos detallados",
        emptyBody: "Este resumen se registró solo por el total.",
        payment: "Pago de tarjeta",
        via: "desde {account}",
        otherAccount: "otra cuenta",
        unknownSource: "· origen no identificado",
        toConfirm: "Por confirmar",
        toConfirmInline: "(por confirmar)",
        projected: "Prevista",
      },
      payments: {
        title: "Pagos de este resumen",
        context:
          "Hechos entre el cierre y el próximo cierre, con la cuenta de origen",
        none: "No hay pagos registrados en este período.",
      },
      upcoming: {
        title: "Próximos resúmenes",
        context: "Solo lo que ya está comprometido en cuotas",
        none: "No hay cuotas futuras.",
      },
      archived: {
        title: "Tarjetas archivadas",
        badge: "Archivada",
      },
      settings: {
        open: "Configurar tarjeta",
        title: "Configurar {name}",
        description:
          "El cierre y el vencimiento definen en qué resumen cae cada compra.",
        invalid: "Revisa el límite, los días (1 a 31) y el cashback.",
        limit: "Límite total",
        cashback: "Cashback (%)",
        cashbackHint:
          "Sobre las compras netas del resumen. Pagar por adelantado no lo reduce.",
        closingDay: "Día de cierre",
        dueDay: "Día de vencimiento",
        paymentAccount: "Cuenta que paga el resumen",
        notes: "Nota",
        notesPlaceholder: "P. ej.: pagar por adelantado no reduce el cashback",
      },
      statementForm: {
        register: "Registrar total oficial",
        edit: "Editar total oficial",
        title: "Total oficial del resumen",
        description:
          "Usa los valores del PDF del emisor. Prevalecen sobre la suma de los movimientos.",
        closing: "Cierre",
        due: "Vencimiento",
        invalidTotal: "Total inválido.",
        totalPlaceholder: "0,00",
      },
    },
  },
);
