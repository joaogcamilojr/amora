import { defineMessages } from "./define";

/** Namespace "auth": tela de login e assuntos dos e-mails de acesso. */
export default defineMessages(
  {
    loading: "Carregando acesso...",
    kicker: "Acesso seguro",
    title: "Suas finanças, em uma visão global.",
    codeSent: "Enviamos um código de acesso para seu e-mail.",
    intro: "Entre usando seu e-mail. Você receberá um código de acesso.",
    email: "E-mail",
    emailPlaceholder: "voce@exemplo.com",
    code: "Código de acesso",
    wait: "Aguarde...",
    signIn: "Entrar →",
    sendCode: "Enviar código →",
    footnote: "Sem senha. Código válido por {minutes} minutos.",
    errors: {
      signInFailed: "Não foi possível entrar.",
      connection: "Não foi possível conectar. Tente novamente.",
    },
    emailSubjects: {
      confirmEmail: "Confirme seu e-mail",
      accessCode: "Seu código de acesso",
    },
  },
  {
    en: {
      loading: "Loading sign-in...",
      kicker: "Secure access",
      title: "Your finances, in a global view.",
      codeSent: "We sent an access code to your email.",
      intro: "Sign in with your email. You'll receive an access code.",
      email: "Email",
      emailPlaceholder: "you@example.com",
      code: "Access code",
      wait: "Please wait...",
      signIn: "Sign in →",
      sendCode: "Send code →",
      footnote: "No password. Code valid for {minutes} minutes.",
      errors: {
        signInFailed: "Couldn't sign in.",
        connection: "Couldn't connect. Please try again.",
      },
      emailSubjects: {
        confirmEmail: "Confirm your email",
        accessCode: "Your access code",
      },
    },
    es: {
      loading: "Cargando acceso...",
      kicker: "Acceso seguro",
      title: "Tus finanzas, en una visión global.",
      codeSent: "Enviamos un código de acceso a tu correo.",
      intro:
        "Ingresa con tu correo electrónico. Recibirás un código de acceso.",
      email: "Correo electrónico",
      emailPlaceholder: "tu@ejemplo.com",
      code: "Código de acceso",
      wait: "Espera...",
      signIn: "Ingresar →",
      sendCode: "Enviar código →",
      footnote: "Sin contraseña. Código válido por {minutes} minutos.",
      errors: {
        signInFailed: "No se pudo ingresar.",
        connection: "No se pudo conectar. Inténtalo de nuevo.",
      },
      emailSubjects: {
        confirmEmail: "Confirma tu correo electrónico",
        accessCode: "Tu código de acceso",
      },
    },
  },
);
