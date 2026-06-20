export type AsciiSlug = string & { readonly __brand: 'AsciiSlug' };
export type Sha256Hex = string & { readonly __brand: 'Sha256Hex' };
export type Base64Url = string & { readonly __brand: 'Base64Url' };
export type IsoTimestamp = string & { readonly __brand: 'IsoTimestamp' };

export function asAsciiSlug(value: string): AsciiSlug {
  return value as AsciiSlug;
}

export function asSha256Hex(value: string): Sha256Hex {
  return value as Sha256Hex;
}

export function asBase64Url(value: string): Base64Url {
  return value as Base64Url;
}

export function asIsoTimestamp(value: string): IsoTimestamp {
  return value as IsoTimestamp;
}
