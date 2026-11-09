/**
 * O banco e o Prisma usam snake_case; a API JSON continua em camelCase.
 * `camelize` converte chaves de objetos simples (recursivo). Datas e Decimal são preservados
 * e serializados pelo `toJSON` deles (ISO 8601 e string decimal).
 */
export function camelKey(key: string) {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

export function snakeKey(key: string) {
  return key.replace(/(?<=[a-z0-9])([A-Z])/g, "_$1").toLowerCase();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function camelize<T = unknown>(value: T): unknown {
  if (Array.isArray(value)) return value.map((item) => camelize(item));
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [camelKey(k), camelize(v)]));
}
