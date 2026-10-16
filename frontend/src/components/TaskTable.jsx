export default function TaskTable({ tasks, onToggle, onEdit, onDelete }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Title</th><th>Description</th><th>Priority</th>
            <th>Status</th><th>Deadline</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id} className={t.status === 'Completed' ? 'done' : ''}>
              <td className="title">{t.title}</td>
              <td>{t.description || '—'}</td>
              <td><span className={`pill p-${t.priority}`}>{t.priority}</span></td>
              <td><span className={`pill s-${t.status}`}>{t.status}</span></td>
              <td className={t.is_overdue ? 'overdue' : ''}>
                {t.deadline || '—'}
                {t.is_overdue && <span className="badge-overdue">OVERDUE</span>}
              </td>
              <td className="actions">
                <button title="Toggle status" onClick={() => onToggle(t)}>
                  {t.status === 'Pending' ? '✔' : '↩'}
                </button>
                <button title="Edit" onClick={() => onEdit(t)}>✎</button>
                <button className="del" title="Delete" onClick={() => onDelete(t.id)}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tasks.length === 0 && <p className="empty">No tasks found.</p>}
    </div>
  );
}
