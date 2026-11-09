import { defineMessages } from "./define";

/** Privacidade em Preferências: exportação dos dados e solicitação de exclusão (LGPD/GDPR). */
export default defineMessages(
  {
    title: "Privacidade e dados",
    subtitle: "Leve uma cópia dos seus dados ou peça a exclusão da conta.",
    export: {
      title: "Exportar meus dados",
      description:
        "Gera um arquivo com seus dados: perfil, contas, lançamentos (inclusive os excluídos), categorias, regras, bens e viagens. Não inclui senhas, sessões nem dados de outras pessoas.",
      json: "JSON completo",
      csvTransactions: "CSV de lançamentos",
      csvAccounts: "CSV de contas e saldos",
      hint: "Valores originais por moeda são o fato; conversões para a moeda-base são estimativas.",
    },
    deletion: {
      title: "Excluir minha conta",
      description:
        "Você tem {days} dias para mudar de ideia. Depois disso, sua conta é anonimizada e você não consegue mais entrar.",
      consequences: {
        title: "O que acontece",
        anonymized:
          "Seu e-mail, nome, país, sessões e anotações livres são removidos.",
        archived:
          "Suas contas, categorias e regras ficam arquivadas, sem apagar nenhum lançamento.",
        history:
          "O histórico financeiro permanece para auditoria, sem ligação com você.",
        irreversible: "Depois da anonimização não há como recuperar o acesso.",
      },
      shared: {
        one: "{count} conta sua é compartilhada. Ela será arquivada e as outras pessoas perdem o acesso.",
        other:
          "{count} contas suas são compartilhadas. Elas serão arquivadas e as outras pessoas perdem o acesso.",
      },
      confirmLabel: "Digite {email} para confirmar",
      request: "Solicitar exclusão",
      requested: "Pedido de exclusão registrado",
      pendingTitle: "Exclusão agendada",
      pendingBody:
        "Sua conta será anonimizada em {date}. Até lá você pode cancelar.",
      cancel: "Cancelar exclusão",
      canceled: "Pedido de exclusão cancelado",
      failed: "Não foi possível concluir",
    },
    email: {
      requested: {
        subject: "Pedido de exclusão da conta Amora",
        headline: "Exclusão agendada",
        message:
          "Recebemos o seu pedido. Sua conta será anonimizada em {date}. Se foi engano, cancele antes dessa data.",
        action: "Cancelar exclusão",
      },
      canceled: {
        subject: "Exclusão da conta Amora cancelada",
        headline: "Pedido cancelado",
        message:
          "O pedido de exclusão foi cancelado. Sua conta continua ativa.",
        action: "Abrir o Amora",
      },
      completed: {
        subject: "Sua conta Amora foi excluída",
        headline: "Conta anonimizada",
        message:
          "Seus dados pessoais foram removidos e a conta foi encerrada. O histórico financeiro permanece, sem ligação com você.",
        action: "Voltar ao site",
      },
    },
  },
  {
    en: {
      title: "Privacy and data",
      subtitle: "Take a copy of your data or request account deletion.",
      export: {
        title: "Export my data",
        description:
          "Creates a file with your data: profile, accounts, transactions (including deleted ones), categories, rules, assets and trips. It doesn't include passwords, sessions or other people's data.",
        json: "Full JSON",
        csvTransactions: "Transactions CSV",
        csvAccounts: "Accounts and balances CSV",
        hint: "Original amounts per currency are the fact; conversions to the base currency are estimates.",
      },
      deletion: {
        title: "Delete my account",
        description:
          "You have {days} days to change your mind. After that, your account is anonymized and you can no longer sign in.",
        consequences: {
          title: "What happens",
          anonymized:
            "Your email, name, country, sessions and free-text notes are removed.",
          archived:
            "Your accounts, categories and rules are archived, without deleting any transaction.",
          history:
            "The financial history is kept for auditing, with no link to you.",
          irreversible: "Once anonymized, access can't be recovered.",
        },
        shared: {
          one: "{count} of your accounts is shared. It will be archived and the other people lose access.",
          other:
            "{count} of your accounts are shared. They will be archived and the other people lose access.",
        },
        confirmLabel: "Type {email} to confirm",
        request: "Request deletion",
        requested: "Deletion request registered",
        pendingTitle: "Deletion scheduled",
        pendingBody:
          "Your account will be anonymized on {date}. You can cancel until then.",
        cancel: "Cancel deletion",
        canceled: "Deletion request canceled",
        failed: "Couldn't complete",
      },
      email: {
        requested: {
          subject: "Amora account deletion request",
          headline: "Deletion scheduled",
          message:
            "We received your request. Your account will be anonymized on {date}. If this was a mistake, cancel before then.",
          action: "Cancel deletion",
        },
        canceled: {
          subject: "Amora account deletion canceled",
          headline: "Request canceled",
          message:
            "The deletion request was canceled. Your account remains active.",
          action: "Open Amora",
        },
        completed: {
          subject: "Your Amora account was deleted",
          headline: "Account anonymized",
          message:
            "Your personal data was removed and the account was closed. The financial history remains, with no link to you.",
          action: "Back to the site",
        },
      },
    },
    es: {
      title: "Privacidad y datos",
      subtitle:
        "Lleva una copia de tus datos o solicita la eliminación de la cuenta.",
      export: {
        title: "Exportar mis datos",
        description:
          "Genera un archivo con tus datos: perfil, cuentas, movimientos (incluidos los eliminados), categorías, reglas, bienes y viajes. No incluye contraseñas, sesiones ni datos de otras personas.",
        json: "JSON completo",
        csvTransactions: "CSV de movimientos",
        csvAccounts: "CSV de cuentas y saldos",
        hint: "Los montos originales por moneda son el hecho; las conversiones a la moneda base son estimaciones.",
      },
      deletion: {
        title: "Eliminar mi cuenta",
        description:
          "Tienes {days} días para cambiar de opinión. Después, tu cuenta se anonimiza y ya no podrás ingresar.",
        consequences: {
          title: "Qué ocurre",
          anonymized:
            "Se eliminan tu correo, nombre, país, sesiones y notas libres.",
          archived:
            "Tus cuentas, categorías y reglas quedan archivadas, sin borrar ningún movimiento.",
          history:
            "El historial financiero se conserva para auditoría, sin vínculo contigo.",
          irreversible:
            "Después de la anonimización no se puede recuperar el acceso.",
        },
        shared: {
          one: "{count} cuenta tuya es compartida. Se archivará y las demás personas pierden el acceso.",
          other:
            "{count} cuentas tuyas son compartidas. Se archivarán y las demás personas pierden el acceso.",
        },
        confirmLabel: "Escribe {email} para confirmar",
        request: "Solicitar eliminación",
        requested: "Solicitud de eliminación registrada",
        pendingTitle: "Eliminación programada",
        pendingBody:
          "Tu cuenta se anonimizará el {date}. Hasta entonces puedes cancelar.",
        cancel: "Cancelar eliminación",
        canceled: "Solicitud de eliminación cancelada",
        failed: "No se pudo completar",
      },
      email: {
        requested: {
          subject: "Solicitud de eliminación de la cuenta Amora",
          headline: "Eliminación programada",
          message:
            "Recibimos tu solicitud. Tu cuenta se anonimizará el {date}. Si fue un error, cancélala antes de esa fecha.",
          action: "Cancelar eliminación",
        },
        canceled: {
          subject: "Eliminación de la cuenta Amora cancelada",
          headline: "Solicitud cancelada",
          message:
            "La solicitud de eliminación fue cancelada. Tu cuenta sigue activa.",
          action: "Abrir Amora",
        },
        completed: {
          subject: "Tu cuenta Amora fue eliminada",
          headline: "Cuenta anonimizada",
          message:
            "Tus datos personales fueron eliminados y la cuenta se cerró. El historial financiero permanece, sin vínculo contigo.",
          action: "Volver al sitio",
        },
      },
    },
  },
);
