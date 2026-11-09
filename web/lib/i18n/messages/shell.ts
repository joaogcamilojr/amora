import { defineMessages } from "./define";

/** Menu do usuário e moldura do app. */
export default defineMessages(
  {
    signOut: "Sair",
    signingOut: "Saindo…",
    signOutFailed: "Não foi possível sair",
    signOutFailedHint: "Tente novamente.",
    userMenu: "Menu do usuário",
    preferences: "Preferências",
  },
  {
    en: {
      signOut: "Sign out",
      signingOut: "Signing out…",
      signOutFailed: "Couldn't sign out",
      signOutFailedHint: "Please try again.",
      userMenu: "User menu",
      preferences: "Preferences",
    },
    es: {
      signOut: "Salir",
      signingOut: "Saliendo…",
      signOutFailed: "No se pudo cerrar sesión",
      signOutFailedHint: "Inténtalo de nuevo.",
      userMenu: "Menú de usuario",
      preferences: "Preferencias",
    },
  },
);
