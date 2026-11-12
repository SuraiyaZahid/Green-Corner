import type { TrackStep } from '@/lib/types';

export function OrderTimeline({
  steps,
  cancelled,
}: {
  steps: TrackStep[];
  cancelled?: boolean;
}) {
  if (cancelled) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        This order was cancelled. Any stock reserved for it has been released.
      </div>
    );
  }

  return (
    <ol className="relative space-y-0">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <li key={step.status} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  step.completed
                    ? 'bg-emerald-600 text-white'
                    : 'border-2 border-gray-300 bg-white text-gray-400'
                }`}
              >
                {step.completed ? '✓' : index + 1}
              </span>
              {!isLast && (
                <span
                  className={`w-0.5 flex-1 ${
                    steps[index + 1]?.completed ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>

            <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
              <p
                className={`text-sm font-medium ${
                  step.completed ? 'text-gray-800' : 'text-gray-400'
                }`}
              >
                {step.label}
              </p>
              {step.current && (
                <p className="mt-0.5 text-xs font-medium text-emerald-700">
                  Current status
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default OrderTimeline;
