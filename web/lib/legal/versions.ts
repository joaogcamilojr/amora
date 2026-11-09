/**
 * Versões vigentes dos documentos legais. Ao publicar texto novo, troque a versão (AAAA-MM-DD): todos os usuários
 * passam a ver a tela de aceite de novo. O texto em si fica fora do repositório (`TERMS_URL`, `PRIVACY_URL`).
 */
export const LEGAL_VERSIONS = {
  TERMS: "2026-10-18",
  PRIVACY: "2026-10-18",
} as const;

export type LegalKind = keyof typeof LEGAL_VERSIONS;
export const LEGAL_KINDS = Object.keys(LEGAL_VERSIONS) as LegalKind[];

/** Documento da URL `/legal/<doc>`. */
export const LEGAL_DOCS = {
  terms: "TERMS",
  privacy: "PRIVACY",
} as const satisfies Record<string, LegalKind>;
export type LegalDoc = keyof typeof LEGAL_DOCS;

export function isLegalDoc(value: string): value is LegalDoc {
  return Object.hasOwn(LEGAL_DOCS, value);
}

/** Tipos cuja versão vigente ainda não foi aceita. */
export function missingConsents(
  accepted: { kind: string; version: string }[],
): LegalKind[] {
  return LEGAL_KINDS.filter(
    (kind) =>
      !accepted.some(
        (a) => a.kind === kind && a.version === LEGAL_VERSIONS[kind],
      ),
  );
}
