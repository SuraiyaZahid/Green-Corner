'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Modal } from '@/components/Modal';
import { formatBDT } from '@/lib/api';
import { loginUrlFor, registerUrlFor } from '@/lib/redirect';

interface SignInPromptProps {
  open: boolean;
  onClose: () => void;
  /** Where the visitor should land after signing in or registering. */
  redirectTo: string;
  /** Optional summary of the item the visitor was trying to buy. */
  product?: {
    name: string;
    price: number;
    imageUrl?: string | null;
  };
}

/**
 * Modal shown when a logged-out visitor tries to add an item to the cart or
 * buy it. It replaces the old behaviour, where the click fell through to a
 * protected endpoint and came back as a bare "Product not found." error.
 */
export function SignInPrompt({
  open,
  onClose,
  redirectTo,
  product,
}: SignInPromptProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sign in to continue"
      footer={
        <>
          <Link
            href={registerUrlFor(redirectTo)}
            className="rounded-lg border border-emerald-700 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
          >
            Create an account
          </Link>
          <Link
            href={loginUrlFor(redirectTo)}
            className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
          >
            Sign in
          </Link>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-gray-600">
        Please sign in to add items to your cart or place an order. You can
        browse all of our products, categories and plant care guides without an
        account.
      </p>

      {product && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-emerald-50">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xl">
                🌿
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-800">
              {product.name}
            </p>
            <p className="text-sm font-medium text-emerald-700">
              {formatBDT(product.price)}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default SignInPrompt;
