'use client';

interface InCartNoteProps {
  /** How many of this product the visitor already has in the cart. */
  inCartQuantity: number;
  /** Remaining stock for the product. */
  stock: number;
  /** The quantity currently selected in the stepper. */
  selected?: number;
  className?: string;
}

/**
 * Inline feedback next to a quantity stepper.
 *
 * Shows how many of the product are already in the cart and how many more
 * can still be added. When the stock limit is reached the note explains why
 * the "+" button is disabled instead of leaving the shopper guessing.
 */
export function InCartNote({
  inCartQuantity,
  stock,
  selected = 1,
  className = '',
}: InCartNoteProps) {
  const remaining = Math.max(0, stock - inCartQuantity);

  // Nothing in the cart yet and plenty of stock: stay quiet, the stepper
  // is self-explanatory.
  if (inCartQuantity <= 0) {
    if (stock > 0 && selected >= stock) {
      return (
        <p className={`text-xs font-medium text-amber-600 ${className}`}>
          Only {stock} left in stock — this is the maximum you can order.
        </p>
      );
    }

    return null;
  }

  return (
    <p
      className={`flex flex-wrap items-center gap-1.5 text-xs font-medium ${className}`}
      data-testid="in-cart-note"
    >
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
        {inCartQuantity} in cart
      </span>
      {remaining > 0 ? (
        <span className="text-gray-500">• {remaining} more available</span>
      ) : (
        <span className="text-amber-600">
          • Max stock reached — no more can be added
        </span>
      )}
    </p>
  );
}

export default InCartNote;
