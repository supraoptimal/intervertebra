const OPTIONS = [
  { v: 'yes', label: 'Yes', color: 'bg-compliance-yes text-white' },
  { v: 'no', label: 'No', color: 'bg-compliance-no text-white' },
  { v: 'na', label: 'N/A', color: 'bg-compliance-na text-white' },
  { v: 'pending', label: 'Pending', color: 'bg-compliance-pending text-white' },
];

export default function StatusPicker({ value, onChange, size = 'sm' }) {
  const px = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  return (
    <div className="inline-flex flex-wrap gap-1" role="radiogroup">
      {OPTIONS.map((o) => {
        const active = value === o.v;
        return (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.v)}
            className={`rounded-md ${px} font-medium transition ring-1 ring-inset ${
              active
                ? `${o.color} ring-transparent`
                : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
