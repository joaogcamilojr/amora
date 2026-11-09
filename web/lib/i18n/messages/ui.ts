import { defineMessages } from "./define";

/** Namespace "ui": componentes base (components/ui/*) e telas de erro/404. */
export default defineMessages(
  {
    appLogoLabel: "Amora — Visão geral",
    wait: "Aguarde...",
    closeMessage: "Fechar mensagem",
    errorState: {
      title: "Não foi possível carregar",
      description: "Tente novamente em instantes.",
    },
    loading: {
      content: "Carregando conteúdo",
      list: "Carregando lista",
      form: "Carregando formulário",
    },
    boundary: {
      title: "Não foi possível carregar",
      description: "Ocorreu um erro inesperado.",
      backHome: "Voltar ao início",
      goToDashboard: "Ir para dashboard",
      appTitle: "Algo deu errado",
      appDescription: "Não foi possível concluir esta página.",
      globalDescription: "O aplicativo encontrou um erro inesperado.",
    },
    notFound: {
      title: "Página não encontrada",
      description: "O endereço não existe ou não está disponível.",
    },
  },
  {
    en: {
      appLogoLabel: "Amora — Overview",
      wait: "Please wait...",
      closeMessage: "Dismiss message",
      errorState: {
        title: "Couldn't load",
        description: "Please try again in a moment.",
      },
      loading: {
        content: "Loading content",
        list: "Loading list",
        form: "Loading form",
      },
      boundary: {
        title: "Couldn't load",
        description: "An unexpected error occurred.",
        backHome: "Back to home",
        goToDashboard: "Go to dashboard",
        appTitle: "Something went wrong",
        appDescription: "We couldn't finish loading this page.",
        globalDescription: "The app ran into an unexpected error.",
      },
      notFound: {
        title: "Page not found",
        description: "This address doesn't exist or isn't available.",
      },
    },
    es: {
      appLogoLabel: "Amora — Resumen",
      wait: "Espera...",
      closeMessage: "Cerrar mensaje",
      errorState: {
        title: "No se pudo cargar",
        description: "Inténtalo de nuevo en unos instantes.",
      },
      loading: {
        content: "Cargando contenido",
        list: "Cargando lista",
        form: "Cargando formulario",
      },
      boundary: {
        title: "No se pudo cargar",
        description: "Ocurrió un error inesperado.",
        backHome: "Volver al inicio",
        goToDashboard: "Ir al panel",
        appTitle: "Algo salió mal",
        appDescription: "No se pudo completar esta página.",
        globalDescription: "La aplicación encontró un error inesperado.",
      },
      notFound: {
        title: "Página no encontrada",
        description: "La dirección no existe o no está disponible.",
      },
    },
  },
);
