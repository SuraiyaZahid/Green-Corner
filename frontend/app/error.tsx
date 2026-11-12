'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto flex flex-col items-center px-4 py-20 text-center">
      <div className="text-6xl" aria-hidden="true">
        🥀
      </div>
      <h1 className="mt-4 text-3xl font-bold text-gray-800">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        {error.message ||
          'We could not load this page. Please try again in a moment.'}
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Try again
        </button>
        <a
          href="tel:01735262232"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Call 01735262232
        </a>
      </div>
    </div>
  );
}
