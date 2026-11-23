import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-emerald-950 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold tracking-tight">Green Corner</h3>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-emerald-200/80">
              Your trusted online plant and gardening supplies shop in
              Bangladesh.
            </p>
          </div>

          {/* Payment numbers */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
              Payment Numbers
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span
                  className="inline-flex h-6 w-10 items-center justify-center rounded bg-pink-500/20 text-[10px] font-bold uppercase tracking-wide text-pink-200"
                  aria-hidden="true"
                >
                  bK
                </span>
                <span className="text-emerald-200/80">bKash:</span>
                <a
                  href="tel:01735262232"
                  className="font-mono font-medium text-emerald-100 hover:text-white hover:underline"
                >
                  01735262232
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="inline-flex h-6 w-10 items-center justify-center rounded bg-orange-500/20 text-[10px] font-bold uppercase tracking-wide text-orange-200"
                  aria-hidden="true"
                >
                  Na
                </span>
                <span className="text-emerald-200/80">Nagad:</span>
                <a
                  href="tel:01735262232"
                  className="font-mono font-medium text-emerald-100 hover:text-white hover:underline"
                >
                  01735262232
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & address */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
              Contact &amp; Address
            </h4>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li className="flex items-start gap-2 text-emerald-100">
                <span className="mt-0.5 shrink-0" aria-hidden="true">
                  📍
                </span>
                <span>Kuril Bisso Road, Dhaka, Bangladesh</span>
              </li>
              <li className="flex items-start gap-2 text-emerald-100">
                <span className="mt-0.5 shrink-0" aria-hidden="true">
                  📞
                </span>
                <span>
                  Phone:{' '}
                  <a
                    href="tel:01735262232"
                    className="font-medium hover:text-white hover:underline"
                  >
                    01735262232
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2 text-emerald-100">
                <span className="mt-0.5 shrink-0" aria-hidden="true">
                  ✉️
                </span>
                <span className="break-all">
                  Email:{' '}
                  <a
                    href="mailto:suraiyazahid085@gmail.com"
                    className="font-medium hover:text-white hover:underline"
                  >
                    suraiyazahid085@gmail.com
                  </a>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Compact bottom bar — a subtle rule, never a thick white gap. */}
      <div className="border-t border-white/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-emerald-300/80 sm:flex-row">
          <span>
            &copy; {new Date().getFullYear()} Green Corner. All rights
            reserved.
          </span>
          <span className="flex flex-wrap items-center gap-4">
            <Link href="/products" className="hover:text-white">
              Shop
            </Link>
            <Link href="/account/orders" className="hover:text-white">
              My Orders
            </Link>
            <a href="tel:01735262232" className="hover:text-white">
              Call Us
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
