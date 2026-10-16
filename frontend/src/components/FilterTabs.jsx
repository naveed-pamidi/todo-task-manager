const TABS = [
  { key: 'all', label: 'All Tasks' },
  { key: 'Pending', label: 'Pending' },
  { key: 'Completed', label: 'Completed' },
  { key: 'overdue', label: 'Overdue' },
];

export default function FilterTabs({ active, onChange }) {
  return (
    <nav className="tabs">
      {TABS.map((t) => (
        <button
          key={t.key}
          className={'tab' + (active === t.key ? ' active' : '')}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
