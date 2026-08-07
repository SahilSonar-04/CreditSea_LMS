const STEPS = ["Personal details", "Salary slip", "Loan configuration"];

interface ApplicationStepsProps {
  currentStep: number;
}

export default function ApplicationSteps({ currentStep }: ApplicationStepsProps) {
  return (
    <ol className="mb-8 flex items-center justify-between gap-2" aria-label="Application progress">
      {STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const complete = stepNumber < currentStep;
        const active = stepNumber === currentStep;

        return (
          <li key={step} className="flex min-w-0 flex-1 items-center gap-2 last:flex-none">
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                complete || active ? "bg-sky-600 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {complete ? "✓" : stepNumber}
            </span>
            <span className={`hidden truncate text-xs font-medium sm:block ${active ? "text-slate-900" : "text-slate-500"}`}>
              {step}
            </span>
            {index < STEPS.length - 1 && <span className="h-px flex-1 bg-slate-200" />}
          </li>
        );
      })}
    </ol>
  );
}
