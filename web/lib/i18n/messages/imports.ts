import { defineMessages } from "./define";

/** Namespace "imports": importação de extratos (CSV/OFX/XLSX) com revisão antes de gravar. */
export default defineMessages(
  {
    page: {
      description:
        "O arquivo é lido, classificado pelas regras e só é gravado depois da sua revisão. Duplicados já vêm desmarcados.",
    },
    formats: {
      title: "Formatos",
      context: "O que funciona hoje",
      ofx: "OFX / QFX",
      csv: "CSV com cabeçalho",
      xlsx: "XLSX (primeira aba legível)",
      pdf: "PDF e prints",
      automatic: "Automático",
      viaClaude: "Via Claude",
      note: "Transferências entre suas contas e aplicações/resgates entram como Transferência ou Investimento — não contam como receita nem despesa. Quando as duas pontas vierem de extratos diferentes, una-as pela API (POST /api/v1/transfers/link) ou peça ao Claude.",
    },
    importer: {
      fileStep: {
        title: "1. Arquivo",
        context:
          "CSV, OFX ou XLSX exportado do banco. PDFs e prints: envie para o Claude.",
        account: "Conta do extrato",
        file: "Arquivo",
        reading: "Lendo…",
        analyze: "Analisar",
        chooseFile: "Escolha um arquivo CSV, OFX ou XLSX.",
        xlsxLegacy:
          "Arquivos .xls (formato antigo) não são lidos. Salve como XLSX ou CSV e tente de novo.",
        xlsxUnreadable:
          "Não consegui ler esta planilha XLSX. Confira se tem cabeçalho com data e valor (ou crédito e débito), ou salve como CSV.",
        tooLarge: "Arquivo muito grande (máx. 5 MB).",
        saved: {
          one: "{count} lançamento importado em {account}.",
          other: "{count} lançamentos importados em {account}.",
        },
        viewTransactions: "Ver lançamentos",
      },
      reviewStep: {
        title: "2. Revisar antes de gravar",
        rowsRead: { one: "{count} linha lida", other: "{count} linhas lidas" },
        duplicates: { one: "{count} já existia", other: "{count} já existiam" },
        valuesIn: "valores em {currency}",
        import: "Importar {count}",
        include: "Incluir",
        includeRow: "Incluir {description}",
        alreadyImported: "Já importado",
      },
    },
  },
  {
    en: {
      page: {
        description:
          "The file is read, categorized by your rules and only saved after you review it. Duplicates come unchecked.",
      },
      formats: {
        title: "Formats",
        context: "What works today",
        ofx: "OFX / QFX",
        csv: "CSV with header",
        xlsx: "XLSX (first readable sheet)",
        pdf: "PDFs and screenshots",
        automatic: "Automatic",
        viaClaude: "Via Claude",
        note: "Transfers between your accounts and investments/withdrawals come in as Transfer or Investment — they don't count as income or expense. When both sides come from different statements, link them through the API (POST /api/v1/transfers/link) or ask Claude.",
      },
      importer: {
        fileStep: {
          title: "1. File",
          context:
            "CSV, OFX or XLSX exported from your bank. PDFs and screenshots: send them to Claude.",
          account: "Statement account",
          file: "File",
          reading: "Reading…",
          analyze: "Analyze",
          chooseFile: "Choose a CSV, OFX or XLSX file.",
          xlsxLegacy:
            "Old .xls files can't be read. Save as XLSX or CSV and try again.",
          xlsxUnreadable:
            "Couldn't read this XLSX spreadsheet. Check that it has a header with date and amount (or credit and debit), or save it as CSV.",
          tooLarge: "File too large (max. 5 MB).",
          saved: {
            one: "{count} transaction imported into {account}.",
            other: "{count} transactions imported into {account}.",
          },
          viewTransactions: "View transactions",
        },
        reviewStep: {
          title: "2. Review before saving",
          rowsRead: { one: "{count} row read", other: "{count} rows read" },
          duplicates: {
            one: "{count} already existed",
            other: "{count} already existed",
          },
          valuesIn: "amounts in {currency}",
          import: "Import {count}",
          include: "Include",
          includeRow: "Include {description}",
          alreadyImported: "Already imported",
        },
      },
    },
    es: {
      page: {
        description:
          "El archivo se lee, se clasifica según las reglas y solo se guarda después de tu revisión. Los duplicados vienen desmarcados.",
      },
      formats: {
        title: "Formatos",
        context: "Lo que funciona hoy",
        ofx: "OFX / QFX",
        csv: "CSV con encabezado",
        xlsx: "XLSX (primera hoja legible)",
        pdf: "PDF y capturas",
        automatic: "Automático",
        viaClaude: "Vía Claude",
        note: "Las transferencias entre tus cuentas y las inversiones/rescates entran como Transferencia o Inversión — no cuentan como ingreso ni gasto. Cuando las dos partes vengan de extractos distintos, únelas por la API (POST /api/v1/transfers/link) o pídeselo a Claude.",
      },
      importer: {
        fileStep: {
          title: "1. Archivo",
          context:
            "CSV, OFX o XLSX exportado del banco. PDF y capturas: envíalos a Claude.",
          account: "Cuenta del extracto",
          file: "Archivo",
          reading: "Leyendo…",
          analyze: "Analizar",
          chooseFile: "Elige un archivo CSV, OFX o XLSX.",
          xlsxLegacy:
            "No se leen archivos .xls (formato antiguo). Guarda como XLSX o CSV e inténtalo de nuevo.",
          xlsxUnreadable:
            "No pude leer esta hoja XLSX. Revisa que tenga encabezado con fecha y monto (o crédito y débito), o guárdala como CSV.",
          tooLarge: "Archivo demasiado grande (máx. 5 MB).",
          saved: {
            one: "{count} movimiento importado en {account}.",
            other: "{count} movimientos importados en {account}.",
          },
          viewTransactions: "Ver movimientos",
        },
        reviewStep: {
          title: "2. Revisar antes de guardar",
          rowsRead: {
            one: "{count} línea leída",
            other: "{count} líneas leídas",
          },
          duplicates: {
            one: "{count} ya existía",
            other: "{count} ya existían",
          },
          valuesIn: "valores en {currency}",
          import: "Importar {count}",
          include: "Incluir",
          includeRow: "Incluir {description}",
          alreadyImported: "Ya importado",
        },
      },
    },
  },
);
