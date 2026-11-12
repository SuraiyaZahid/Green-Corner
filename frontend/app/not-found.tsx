import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto flex flex-col items-center px-4 py-20 text-center">
      <div className="text-6xl" aria-hidden="true">
        🌵
      </div>
      <h1 className="mt-4 text-3xl font-bold text-gray-800">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        The page you are looking for does not exist or may have been moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Back to home
        </Link>
        <Link
          href="/products"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Browse products
        </Link>
      </div>
    </div>
  );
}
