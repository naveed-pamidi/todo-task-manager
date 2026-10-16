export default function Toolbar({ search, onSearch, priority, onPriority, onNew }) {
  return (
    <div className="toolbar">
      <input
        type="search"
        placeholder="Search tasks..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
      />
      <select value={priority} onChange={(e) => onPriority(e.target.value)}>
        <option value="">All priorities</option>
        <option>Low</option>
        <option>Medium</option>
        <option>High</option>
      </select>
      <button className="btn btn-dark" onClick={onNew}>+ Create New Task</button>
    </div>
  );
}
