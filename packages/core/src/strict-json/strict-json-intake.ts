export class StrictJsonIntakeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StrictJsonIntakeError';
  }
}

export type StrictJsonIntakeOptions = {
  maxBodyBytes?: number;
  maxDepth?: number;
};

const DEFAULT_MAX_BODY_BYTES = 1_048_576;
const DEFAULT_MAX_DEPTH = 64;

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

class StrictJsonParser {
  private index = 0;

  constructor(
    private readonly source: string,
    private readonly maxDepth: number,
  ) {}

  parse(): JsonValue {
    this.skipWs();
    const value = this.parseValue(0);
    this.skipWs();
    if (this.index < this.source.length) {
      throw new StrictJsonIntakeError('Unexpected trailing content after JSON value');
    }
    return value;
  }

  private parseValue(depth: number): JsonValue {
    if (depth > this.maxDepth) {
      throw new StrictJsonIntakeError('JSON nesting exceeds maximum depth');
    }
    this.skipWs();
    const char = this.peek();
    if (char === '{') {
      return this.parseObject(depth + 1);
    }
    if (char === '[') {
      return this.parseArray(depth + 1);
    }
    if (char === '"') {
      return this.parseString();
    }
    if (char === '-' || (char >= '0' && char <= '9')) {
      return this.parseNumber();
    }
    if (this.startsWith('true')) {
      this.index += 4;
      return true;
    }
    if (this.startsWith('false')) {
      this.index += 5;
      return false;
    }
    if (this.startsWith('null')) {
      this.index += 4;
      return null;
    }
    if (this.startsWith('NaN') || this.startsWith('Infinity')) {
      throw new StrictJsonIntakeError('NaN and Infinity are not allowed');
    }
    if (char === '/') {
      throw new StrictJsonIntakeError('JSON comments are not allowed');
    }
    throw new StrictJsonIntakeError(`Unexpected token at position ${this.index}`);
  }

  private parseObject(depth: number): { [key: string]: JsonValue } {
    this.expect('{');
    this.skipWs();
    const keys = new Set<string>();
    const object: { [key: string]: JsonValue } = {};

    if (this.peek() === '}') {
      this.index += 1;
      return object;
    }

    while (true) {
      this.skipWs();
      if (this.peek() !== '"') {
        throw new StrictJsonIntakeError('Object keys must be double-quoted strings');
      }
      const key = this.parseString();
      if (keys.has(key)) {
        throw new StrictJsonIntakeError(`Duplicate object key: ${key}`);
      }
      keys.add(key);
      this.skipWs();
      this.expect(':');
      const value = this.parseValue(depth);
      object[key] = value;
      this.skipWs();
      if (this.peek() === ',') {
        this.index += 1;
        this.skipWs();
        if (this.peek() === '}') {
          throw new StrictJsonIntakeError('Trailing comma in object');
        }
        continue;
      }
      if (this.peek() === '}') {
        this.index += 1;
        return object;
      }
      throw new StrictJsonIntakeError('Expected comma or closing brace in object');
    }
  }

  private parseArray(depth: number): JsonValue[] {
    this.expect('[');
    this.skipWs();
    const array: JsonValue[] = [];

    if (this.peek() === ']') {
      this.index += 1;
      return array;
    }

    while (true) {
      array.push(this.parseValue(depth));
      this.skipWs();
      if (this.peek() === ',') {
        this.index += 1;
        this.skipWs();
        if (this.peek() === ']') {
          throw new StrictJsonIntakeError('Trailing comma in array');
        }
        continue;
      }
      if (this.peek() === ']') {
        this.index += 1;
        return array;
      }
      throw new StrictJsonIntakeError('Expected comma or closing bracket in array');
    }
  }

  private parseString(): string {
    this.expect('"');
    let result = '';
    while (this.index < this.source.length) {
      const char = this.source[this.index];
      if (char === '"') {
        this.index += 1;
        return result;
      }
      if (char < '\u0020') {
        throw new StrictJsonIntakeError('Control characters are not allowed in strings');
      }
      if (char === '\\') {
        this.index += 1;
        if (this.index >= this.source.length) {
          throw new StrictJsonIntakeError('Unterminated escape sequence');
        }
        const escaped = this.source[this.index];
        switch (escaped) {
          case '"':
          case '\\':
          case '/':
            result += escaped;
            break;
          case 'b':
            result += '\b';
            break;
          case 'f':
            result += '\f';
            break;
          case 'n':
            result += '\n';
            break;
          case 'r':
            result += '\r';
            break;
          case 't':
            result += '\t';
            break;
          case 'u': {
            const hex = this.source.slice(this.index + 1, this.index + 5);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
              throw new StrictJsonIntakeError('Invalid Unicode escape');
            }
            result += String.fromCharCode(parseInt(hex, 16));
            this.index += 4;
            break;
          }
          default:
            throw new StrictJsonIntakeError('Invalid escape sequence');
        }
        this.index += 1;
        continue;
      }
      result += char;
      this.index += 1;
    }
    throw new StrictJsonIntakeError('Unterminated string');
  }

  private parseNumber(): number {
    const start = this.index;
    if (this.peek() === '-') {
      this.index += 1;
    }
    if (this.peek() === '0') {
      this.index += 1;
    } else if (this.peek() >= '1' && this.peek() <= '9') {
      while (this.peek() >= '0' && this.peek() <= '9') {
        this.index += 1;
      }
    } else {
      throw new StrictJsonIntakeError('Invalid number');
    }

    if (this.peek() === '.') {
      this.index += 1;
      if (!(this.peek() >= '0' && this.peek() <= '9')) {
        throw new StrictJsonIntakeError('Invalid fractional number');
      }
      while (this.peek() >= '0' && this.peek() <= '9') {
        this.index += 1;
      }
    }

    if (this.peek() === 'e' || this.peek() === 'E') {
      this.index += 1;
      if (this.peek() === '+' || this.peek() === '-') {
        this.index += 1;
      }
      if (!(this.peek() >= '0' && this.peek() <= '9')) {
        throw new StrictJsonIntakeError('Invalid exponent in number');
      }
      while (this.peek() >= '0' && this.peek() <= '9') {
        this.index += 1;
      }
    }

    const token = this.source.slice(start, this.index);
    if (token === 'NaN' || token === 'Infinity' || token === '-Infinity') {
      throw new StrictJsonIntakeError('NaN and Infinity are not allowed');
    }

    const value = Number(token);
    if (!Number.isFinite(value)) {
      throw new StrictJsonIntakeError('Number is not finite');
    }
    return value;
  }

  private skipWs(): void {
    while (this.index < this.source.length) {
      const char = this.source[this.index];
      if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        this.index += 1;
        continue;
      }
      if (char === '/') {
        throw new StrictJsonIntakeError('JSON comments are not allowed');
      }
      break;
    }
  }

  private peek(): string {
    return this.source[this.index] ?? '';
  }

  private expect(char: string): void {
    if (this.source[this.index] !== char) {
      throw new StrictJsonIntakeError(`Expected '${char}' at position ${this.index}`);
    }
    this.index += 1;
  }

  private startsWith(value: string): boolean {
    return this.source.startsWith(value, this.index);
  }
}

export class StrictJsonIntake {
  static parseRejectingDuplicateKeys(
    rawJson: string,
    options: StrictJsonIntakeOptions = {},
  ): unknown {
    const maxBodyBytes = options.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
    const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;

    if (typeof rawJson !== 'string') {
      throw new StrictJsonIntakeError('Input must be a string');
    }
    if (rawJson.length > maxBodyBytes) {
      throw new StrictJsonIntakeError('JSON body exceeds maximum allowed size');
    }

    const parser = new StrictJsonParser(rawJson, maxDepth);
    return parser.parse();
  }

  static parseActionProposalJson(
    rawJson: string,
    options: StrictJsonIntakeOptions = {},
  ): unknown {
    const value = this.parseRejectingDuplicateKeys(rawJson, options);
    if (Array.isArray(value)) {
      throw new StrictJsonIntakeError('Top-level JSON array is not allowed for ActionProposal');
    }
    return value;
  }
}
