interface FilterTabsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export const FilterTabs = ({ activeFilter, onFilterChange }: FilterTabsProps) => {
  const filters = [
    { id: 'all', label: 'All Food', count: 12 },
    { id: 'nearby', label: 'Nearby', count: 5 },
    { id: 'available', label: 'Available', count: 8 },
    { id: 'ending-soon', label: 'Ending Soon', count: 3 },
  ];

  return (
    <div className="px-4 py-3 bg-background">
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {filters.map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => onFilterChange(id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              activeFilter === id
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <span>{label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeFilter === id
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-background text-muted-foreground'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};