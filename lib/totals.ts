/**
 * Pure totals logic: no React, no I/O, no Intl. Formatting lives in lib/format.ts
 * so this file stays trivial to unit test and safe to run on the server.
 *
 * Money is integer cents at every boundary. Internally, a line total is multiplied
 * as an exact decimal rather than as a float, because the two disagree on money:
 * 3 x $0.335 is 1.005 exactly, which reads as $1.01. In floating point the same
 * product is 1.0049999999999999 and rounds down to $1.00 -- a cent the shop never
 * gets back, and the drift compounds across a long invoice.
 */

export interface TotalsLineInput {
  quantity: number;
  unitPrice: number;
}

export interface TotalsInput {
  lineItems: TotalsLineInput[];
  /** Fixed discount in dollars, not a percentage. */
  discount: number;
  /** Tax rate as a percentage, so 10 means 10%. */
  taxRate: number;
}

export interface Totals {
  lineTotalsCents: number[];
  subtotalCents: number;
  discountCents: number;
  taxableCents: number;
  taxCents: number;
  grandTotalCents: number;
}

/** An exact decimal: value = units / 10^scale. */
interface Decimal {
  units: bigint;
  scale: number;
}

/**
 * Reads a number as the decimal a person typed, not as its binary approximation.
 * Number#toString gives the shortest round-tripping form, so 0.335 arrives as
 * "0.335" rather than 0.33500000000000002, and that is the figure we bill from.
 */
function toDecimal(value: number): Decimal {
  if (!Number.isFinite(value)) {
    throw new RangeError(`Cannot bill a non-finite amount: ${value}`);
  }

  const text = value.toString();
  const [mantissa, exponent] = text.split(/e/i);
  const negative = mantissa.startsWith("-");
  const [whole, fraction = ""] = mantissa.replace("-", "").split(".");

  let units = BigInt(whole + fraction) * (negative ? -1n : 1n);
  let scale = fraction.length - Number(exponent ?? 0);

  // A negative scale means the value has trailing zeros the exponent moved out.
  if (scale < 0) {
    units *= 10n ** BigInt(-scale);
    scale = 0;
  }

  return { units, scale };
}

function multiply(a: Decimal, b: Decimal): Decimal {
  return { units: a.units * b.units, scale: a.scale + b.scale };
}

/** Rounds half away from zero, the way an invoice is read aloud: 1.005 -> 1.01. */
function rescale({ units, scale }: Decimal, targetScale: number): bigint {
  if (scale === targetScale) return units;
  if (scale < targetScale) return units * 10n ** BigInt(targetScale - scale);

  const divisor = 10n ** BigInt(scale - targetScale);
  const negative = units < 0n;
  const magnitude = negative ? -units : units;
  const quotient = magnitude / divisor;
  const rounded = (magnitude % divisor) * 2n >= divisor ? quotient + 1n : quotient;

  return negative ? -rounded : rounded;
}

function toCents(dollars: number): number {
  return Number(rescale(toDecimal(dollars), 2));
}

/**
 * The order of operations is fixed and deliberate: each line rounds to the cent
 * before anything is summed, the discount comes off the subtotal, and tax applies
 * to what is left rather than to the subtotal. Nothing here clamps or corrects a
 * value -- a discount larger than the subtotal returns a negative taxable amount,
 * and it is validation's job to refuse that, not this function's job to hide it.
 */
export function calculateTotals(input: TotalsInput): Totals {
  const lineTotalsCents = input.lineItems.map((item) =>
    Number(rescale(multiply(toDecimal(item.quantity), toDecimal(item.unitPrice)), 2)),
  );

  const subtotalCents = lineTotalsCents.reduce((sum, cents) => sum + cents, 0);
  const discountCents = toCents(input.discount);
  const taxableCents = subtotalCents - discountCents;

  // taxable (already whole cents) x rate / 100, rounded to the cent.
  const taxCents = Number(
    rescale(
      {
        units: BigInt(taxableCents) * toDecimal(input.taxRate).units,
        scale: toDecimal(input.taxRate).scale + 2,
      },
      0,
    ),
  );

  return {
    lineTotalsCents,
    subtotalCents,
    discountCents,
    taxableCents,
    taxCents,
    grandTotalCents: taxableCents + taxCents,
  };
}
