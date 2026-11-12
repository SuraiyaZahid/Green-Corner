import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-emerald-900 text-white py-8 mt-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-2">Green Corner</h3>
          <p className="text-emerald-200 text-sm">
            Your trusted online plant and gardening supplies shop in Bangladesh.
          </p>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-2">Payment Numbers</h4>
          <p className="text-sm">
            bKash: <span className="font-mono text-emerald-300">01735262232</span>
          </p>
          <p className="text-sm">
            Nagad: <span className="font-mono text-emerald-300">01735262232</span>
          </p>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-2">Contact &amp; Address</h4>
          <p className="text-sm">📍 Kuril Bisso Road, Dhaka, Bangladesh</p>
          <p className="text-sm">
            📞 Phone:{' '}
            <a href="tel:01735262232" className="hover:underline">
              01735262232
            </a>
          </p>
          <p className="text-sm">
            ✉️ Email:{' '}
            <a
              href="mailto:suraiyazahid085@gmail.com"
              className="hover:underline"
            >
              suraiyazahid085@gmail.com
            </a>
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="border-t border-emerald-800 mt-8 pt-4 text-center text-xs text-emerald-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} Green Corner. All rights reserved.</span>
          <span className="flex flex-wrap gap-4">
            <Link href="/products" className="hover:text-emerald-200">
              Shop
            </Link>
            <Link href="/account/orders" className="hover:text-emerald-200">
              My Orders
            </Link>
            <a href="tel:01735262232" className="hover:text-emerald-200">
              Call Us
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
