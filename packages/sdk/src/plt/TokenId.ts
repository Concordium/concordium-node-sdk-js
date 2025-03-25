/**
 * Protocol level token (PLT) ID JSON representation.
 */
export type JSON = string;

/**
 * Protocol level token (PLT) ID.
 */
class TokenId {
  /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
  private readonly __type = 'PLT.Id';
  constructor(public readonly value: string) {}

  /**
   * Get a string representation of the token ID.
   * @returns {string} The string representation.
   */
  public toString(): string {
    return this.value;
  }

  /**
   * Get a JSON-serializable representation of the token ID. This is called implicitly when serialized with JSON.stringify.
   * @returns {HexString} The JSON representation.
   */
  public toJSON(): JSON {
    return this.value;
  }
}

/**
 * Protocol level token (PLT) ID.
 */
export type Type = TokenId;

/**
 * Create a protocol level token ID from a string value.
 * @param {string} value - The string to create the token ID from.
 * @returns {TokenId} A new token ID instance.
 */
export function fromString(value: string): TokenId {
  // TODO: invariants check
  return new TokenId(value);
}

/**
 * Type predicate for {@linkcode Type}
 *
 * @param value value to check.
 * @returns whether `value` is of type {@linkcode Type}
 */
export function instanceOf(value: unknown): value is TokenId {
  return value instanceof TokenId;
}

/**
 * Converts {@linkcode JSON} to a token amount.
 * @param {string} json The JSON representation of the CCD amount.
 * @returns {CcdAmount} The CCD amount.
 */
export function fromJSON(json: JSON): TokenId {
  return fromString(json);
}
