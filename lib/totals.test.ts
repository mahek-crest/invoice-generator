import { describe, expect, it } from "vitest";

import { formatCents } from "./format";
import { calculateTotals } from "./totals";

describe("calculateTotals", () => {
  it("matches the worked example: 2 x $50.00, $10 discount, 10% tax", () => {
    const totals = calculateTotals({
      lineItems: [{ quantity: 2, unitPrice: 50 }],
      discount: 10,
      taxRate: 10,
    });

    expect(totals.subtotalCents).toBe(10_000);
    expect(totals.discountCents).toBe(1_000);
    expect(totals.taxableCents).toBe(9_000);
    expect(totals.taxCents).toBe(900);
    expect(totals.grandTotalCents).toBe(9_900);
    expect(formatCents(totals.grandTotalCents)).toBe("$99.00");
  });

  it("rounds a half-cent line total up, not down", () => {
    // 3 x 0.335 is 1.005 exactly. Float multiplication gives 1.0049999999999999,
    // so a naive implementation bills $1.00 here.
    const totals = calculateTotals({
      lineItems: [{ quantity: 3, unitPrice: 0.335 }],
      discount: 0,
      taxRate: 0,
    });

    expect(totals.lineTotalsCents).toEqual([101]);
    expect(formatCents(totals.subtotalCents)).toBe("$1.01");
  });

  it("does not drift on quantities that have no exact binary form", () => {
    // 1.1 * 3 is 3.3000000000000003 in floating point.
    const totals = calculateTotals({
      lineItems: [{ quantity: 1.1, unitPrice: 3 }],
      discount: 0,
      taxRate: 0,
    });

    expect(totals.lineTotalsCents).toEqual([330]);
  });

  it("handles zero discount and 0% tax", () => {
    const totals = calculateTotals({
      lineItems: [{ quantity: 1, unitPrice: 19.99 }],
      discount: 0,
      taxRate: 0,
    });

    expect(totals.taxCents).toBe(0);
    expect(formatCents(totals.grandTotalCents)).toBe("$19.99");
  });

  it("rounds each line before summing, so the subtotal is the sum of what is printed", () => {
    const totals = calculateTotals({
      lineItems: [
        { quantity: 2.5, unitPrice: 48 },
        { quantity: 1, unitPrice: 12.5 },
        { quantity: 3, unitPrice: 0.335 },
      ],
      discount: 0,
      taxRate: 8.875,
    });

    expect(totals.lineTotalsCents).toEqual([12_000, 1_250, 101]);
    expect(totals.subtotalCents).toBe(13_351);
    expect(totals.taxCents).toBe(1_185);
    expect(formatCents(totals.grandTotalCents)).toBe("$145.36");
  });

  it("taxes the discounted amount, not the subtotal", () => {
    const totals = calculateTotals({
      lineItems: [{ quantity: 1, unitPrice: 100 }],
      discount: 50,
      taxRate: 10,
    });

    expect(totals.taxCents).toBe(500);
    expect(formatCents(totals.grandTotalCents)).toBe("$55.00");
  });

  it("zeroes out when the discount equals the subtotal", () => {
    const totals = calculateTotals({
      lineItems: [{ quantity: 4, unitPrice: 12.25 }],
      discount: 49,
      taxRate: 7,
    });

    expect(totals.taxableCents).toBe(0);
    expect(totals.taxCents).toBe(0);
    expect(formatCents(totals.grandTotalCents)).toBe("$0.00");
  });

  it("reports a negative taxable amount rather than clamping it", () => {
    // Validation refuses this before it can be saved; totals stays honest about it.
    const totals = calculateTotals({
      lineItems: [{ quantity: 1, unitPrice: 10 }],
      discount: 25,
      taxRate: 0,
    });

    expect(totals.taxableCents).toBe(-1_500);
    expect(totals.grandTotalCents).toBe(-1_500);
  });

  it("returns zeros for an invoice with no line items", () => {
    const totals = calculateTotals({ lineItems: [], discount: 0, taxRate: 7 });

    expect(totals.subtotalCents).toBe(0);
    expect(totals.grandTotalCents).toBe(0);
  });

  it("keeps a long invoice exact to the cent", () => {
    const totals = calculateTotals({
      lineItems: Array.from({ length: 100 }, () => ({ quantity: 1, unitPrice: 0.1 })),
      discount: 0,
      taxRate: 0,
    });

    expect(totals.grandTotalCents).toBe(1_000);
  });
});
