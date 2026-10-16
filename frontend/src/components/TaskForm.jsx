import { useState } from 'react';

export default function TaskForm({ task, onSave, onCancel }) {
  const [form, setForm] = useState({
    id: task.id,
    title: task.title || '',
    description: task.description || '',
    deadline: task.deadline || '',
    priority: task.priority || 'Medium',
    status: task.status || 'Pending',
  });
  const [error, setError] = useState('');

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');

    // client-side validation
    if (!form.title.trim()) {
      setError('Task title cannot be empty.');
      return;
    }

    try {
      await onSave({ ...form, title: form.title.trim(), deadline: form.deadline || null });
    } catch (err) {
      // server-side validation error
      setError(err.data?.title?.[0] || 'Something went wrong.');
    }
  }

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="modal-box" onSubmit={submit} noValidate>
        <h2>{task.id ? 'Edit Task' : 'Create Task'}</h2>

        <label>Title *</label>
        <input name="title" value={form.title} onChange={change} maxLength={200} autoFocus />
        <small className="error">{error}</small>

        <label>Description</label>
        <textarea name="description" rows={3} value={form.description} onChange={change} />

        <div className="row">
          <div>
            <label>Deadline</label>
            <input type="date" name="deadline" value={form.deadline} onChange={change} />
          </div>
          <div>
            <label>Priority</label>
            <select name="priority" value={form.priority} onChange={change}>
              <option>Low</option><option>Medium</option><option>High</option>
            </select>
          </div>
          <div>
            <label>Status</label>
            <select name="status" value={form.status} onChange={change}>
              <option>Pending</option><option>Completed</option>
            </select>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-light" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-dark">Save</button>
        </div>
      </form>
    </div>
  );
}
