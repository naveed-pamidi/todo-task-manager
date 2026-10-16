import { useCallback, useEffect, useRef, useState } from 'react';
import {
  House, ChartColumn, ChartPie, Archive, Moon, Sun, Settings, Search, Bell, Check, Undo2,
  Pencil, Trash2, EllipsisVertical, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Plus,
} from 'lucide-react';
import { API, api } from './api';
import './style.css';

const EMPTY_FORM = { id: '', title: '', description: '', deadline: '', priority: 'Medium', status: 'Pending' };
const TABS = [
  { key: 'all', label: 'All Tasks' },
  { key: 'Pending', label: 'Pending' },
  { key: 'Completed', label: 'Completed' },
  { key: 'overdue', label: 'Overdue' },
];

// 2026-10-16 -> 16/10/2026
const fmt = (v) => {
  if (!v) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { const [y, m, d] = v.split('-'); return `${d}/${m}/${y}`; }
  return new Date(v).toLocaleDateString('en-GB');
};

function Select({ value, onChange, children, className = '' }) {
  return (
    <div className={`select ${className}`}>
      <select value={value} onChange={onChange}>{children}</select>
      <ChevronDown size={16} />
    </div>
  );
}

function NavBtn({ active, title, onClick, children }) {
  return (
    <button className={`nav-btn ${active ? 'active' : ''}`} title={title} onClick={onClick}>{children}</button>
  );
}

export default function App() {
  // ---------- state ----------
  const [view, setView] = useState('home');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [draftDate, setDraftDate] = useState('');
  const [draftPriority, setDraftPriority] = useState('');
  const [date, setDate] = useState('');           // applied by the Filter button
  const [priority, setPriority] = useState('');   // applied by the Filter button
  const [tasks, setTasks] = useState([]);
  const [everyTask, setEveryTask] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState(null);
  const [titleError, setTitleError] = useState('');
  const [menu, setMenu] = useState(null);         // 'bell' | 'avatar' | null
  const [rowMenu, setRowMenu] = useState(null);   // task id | null
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('theme') === 'dark'; } catch { return false; }
  });
  const searchRef = useRef(null);

  const showMessage = (text, error = false) => {
    setMessage({ text, error });
    setTimeout(() => setMessage(null), 3000);
  };

  // ---------- load data ----------
  const loadTasks = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter === 'overdue') params.set('overdue', 'true');
    else if (filter !== 'all') params.set('status', filter);
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    if (priority) params.set('priority', priority);
    try {
      const [filtered, all] = await Promise.all([api(`${API}?${params}`), api(API)]);
      setTasks(filtered);
      setEveryTask(all);
    } catch {
      showMessage('Could not load tasks. Is the server running?', true);
    }
  }, [filter, debouncedSearch, priority]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch { /* ignore */ }
  }, [dark]);

  useEffect(() => {
    const close = () => { setMenu(null); setRowMenu(null); };
    const onKey = (e) => { if (e.key === 'Escape') { close(); setForm(null); } };
    document.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', onKey); };
  }, []);

  // ---------- derived data ----------
  const shown = date ? tasks.filter((t) => t.deadline === date) : tasks;
  const total = shown.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(page, pages);
  const start = (currentPage - 1) * perPage;
  const visible = shown.slice(start, start + perPage);

  const soon = Date.now() + 2 * 86400000;
  const alerts = everyTask.filter((t) =>
    t.status !== 'Completed' && (t.is_overdue || (t.deadline && new Date(t.deadline) <= soon)));
  const stats = {
    Total: everyTask.length,
    Pending: everyTask.filter((t) => t.status === 'Pending').length,
    Completed: everyTask.filter((t) => t.status === 'Completed').length,
    Overdue: everyTask.filter((t) => t.is_overdue).length,
  };

  // ---------- actions ----------
  const toggleStatus = async (t) => {
    try {
      await api(`${API}${t.id}/`, 'PATCH', { status: t.status === 'Pending' ? 'Completed' : 'Pending' });
      loadTasks();
    } catch { showMessage('Could not update the task.', true); }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api(`${API}${id}/`, 'DELETE');
      showMessage('Task deleted.');
      loadTasks();
    } catch { showMessage('Could not delete the task.', true); }
  };

  const duplicateTask = async (t) => {
    try {
      await api(API, 'POST', {
        title: `${t.title} (copy)`, description: t.description, deadline: t.deadline,
        priority: t.priority, status: 'Pending',
      });
      showMessage('Task duplicated.');
      loadTasks();
    } catch { showMessage('Could not duplicate the task.', true); }
  };

  const copyTitle = async (t) => {
    try { await navigator.clipboard.writeText(t.title); showMessage('Title copied.'); }
    catch { showMessage('Could not copy the title.', true); }
  };

  const openModal = (task = null) => {
    setTitleError('');
    setForm(task
      ? { id: task.id, title: task.title, description: task.description || '', deadline: task.deadline || '', priority: task.priority, status: task.status }
      : { ...EMPTY_FORM });
  };
  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submitForm = async (e) => {
    e.preventDefault();
    setTitleError('');
    if (!form.title.trim()) { setTitleError('Task title cannot be empty.'); return; }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      deadline: form.deadline || null,
      priority: form.priority,
      status: form.status,
    };
    try {
      await api(form.id ? `${API}${form.id}/` : API, form.id ? 'PUT' : 'POST', payload);
      setForm(null);
      showMessage(form.id ? 'Task updated.' : 'Task created.');
      loadTasks();
    } catch (err) {
      setTitleError(err.data && err.data.title ? err.data.title[0] : 'Something went wrong.');
    }
  };

  const applyFilters = () => { setDate(draftDate); setPriority(draftPriority); setPage(1); };
  const clearFilters = () => { setDraftDate(''); setDraftPriority(''); setDate(''); setPriority(''); setPage(1); };
  const changeFilter = (key) => { setFilter(key); setPage(1); };
  const goTo = (v, f = 'all') => { setView(v); if (v === 'home') changeFilter(f); };
  const toggleSearch = () => {
    setSearchOpen((o) => !o);
    setView('home');
    setTimeout(() => searchRef.current && searchRef.current.focus(), 0);
  };
  const stop = (fn) => (e) => { e.stopPropagation(); fn(); };

  // ---------- UI ----------
  return (
    <>
      <div className="app">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="logo">TM</div>
          <nav className="side-nav">
            <NavBtn title="All tasks" active={view === 'home' && filter === 'all'} onClick={() => goTo('home', 'all')}><House size={22} /></NavBtn>
            <NavBtn title="Statistics" active={view === 'stats'} onClick={() => setView('stats')}><ChartColumn size={22} /></NavBtn>
            <NavBtn title="Overdue tasks" active={view === 'home' && filter === 'overdue'} onClick={() => goTo('home', 'overdue')}><ChartPie size={22} /></NavBtn>
            <NavBtn title="Completed tasks" active={view === 'home' && filter === 'Completed'} onClick={() => goTo('home', 'Completed')}><Archive size={22} /></NavBtn>
            <NavBtn title="Toggle dark mode" onClick={() => setDark((d) => !d)}>{dark ? <Sun size={22} /> : <Moon size={22} />}</NavBtn>
            <NavBtn title="Settings" active={view === 'settings'} onClick={() => setView('settings')}><Settings size={22} /></NavBtn>
          </nav>
        </aside>

        <main className="content">
          {/* NAVBAR */}
          <header className="topbar">
            {searchOpen && (
              <input
                ref={searchRef} type="search" className="top-search" placeholder="Search tasks..."
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
            )}
            <button className="icon-btn" title="Search" onClick={toggleSearch}><Search size={22} /></button>

            <div className="dropdown-wrap">
              <button className="icon-btn" title="Notifications" onClick={stop(() => { setRowMenu(null); setMenu(menu === 'bell' ? null : 'bell'); })}>
                <Bell size={22} />
                {alerts.length > 0 && <span className="bell-count">{alerts.length}</span>}
              </button>
              {menu === 'bell' && (
                <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                  {alerts.length === 0 && <div className="dd-item">No notifications</div>}
                  {alerts.map((t) => (
                    <div className="dd-item" key={t.id}>
                      {t.title}
                      <small>{t.is_overdue ? 'Overdue' : `Due ${fmt(t.deadline)}`}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="dropdown-wrap">
              <button className="avatar" title="Account" onClick={stop(() => { setRowMenu(null); setMenu(menu === 'avatar' ? null : 'avatar'); })}>TM</button>
              {menu === 'avatar' && (
                <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                  <div className="dd-item">Task Manager User</div>
                </div>
              )}
            </div>
          </header>

          {/* TASKS VIEW */}
          {view === 'home' && (
            <section>
              <h1>My Tasks</h1>

              <nav className="tabs">
                {TABS.map((t) => (
                  <button key={t.key} className={`tab ${filter === t.key ? 'active' : ''}`} onClick={() => changeFilter(t.key)}>{t.label}</button>
                ))}
              </nav>

              <div className="toolbar">
                <div className="filters">
                  <label className="date-field">
                    <CalendarDays size={18} />
                    <input type="date" value={draftDate} onChange={(e) => setDraftDate(e.target.value)} aria-label="Deadline date" />
                  </label>
                  <Select value={draftPriority} onChange={(e) => setDraftPriority(e.target.value)} className="w-select">
                    <option value="">Choose Priority</option>
                    <option>Low</option><option>Medium</option><option>High</option>
                  </Select>
                  <button className="btn btn-lilac" onClick={applyFilters}>Filter</button>
                  {(date || priority) && <button className="btn-link" onClick={clearFilters}>Clear</button>}
                </div>
                <button className="btn btn-dark btn-create" onClick={() => openModal()}><Plus size={20} /> Create New Task</button>
              </div>

              {message && <div className={`message ${message.error ? 'err' : ''}`}>{message.text}</div>}

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th><th>Priority</th><th>Status</th><th>Description</th>
                      <th>Date Assigned</th><th>Due Date</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((t) => (
                      <tr key={t.id} className={t.status === 'Completed' ? 'done' : ''}>
                        <td className="title">{t.title}</td>
                        <td><span className={`pill p-${t.priority}`}>{t.priority}</span></td>
                        <td><span className={`pill s-${t.status}`}>{t.status}</span></td>
                        <td className="desc" title={t.description}>{t.description || '—'}</td>
                        <td>{fmt(t.created_at)}</td>
                        <td className={t.is_overdue ? 'overdue' : ''}>
                          {fmt(t.deadline)}
                          {t.is_overdue && <span className="badge-overdue">Overdue</span>}
                        </td>
                        <td>
                          <div className="actions">
                            <button className="act a-done" title={t.status === 'Pending' ? 'Mark completed' : 'Mark pending'} onClick={() => toggleStatus(t)}>
                              {t.status === 'Pending' ? <Check size={15} /> : <Undo2 size={15} />}
                            </button>
                            <button className="act a-edit" title="Edit" onClick={() => openModal(t)}><Pencil size={15} /></button>
                            <button className="act a-del" title="Delete" onClick={() => deleteTask(t.id)}><Trash2 size={15} /></button>
                            <div className="dropdown-wrap">
                              <button className="act a-more" title="More" onClick={stop(() => { setMenu(null); setRowMenu(rowMenu === t.id ? null : t.id); })}>
                                <EllipsisVertical size={18} />
                              </button>
                              {rowMenu === t.id && (
                                <div className="dropdown row-menu" onClick={(e) => e.stopPropagation()}>
                                  <button className="dd-item dd-btn" onClick={() => { setRowMenu(null); duplicateTask(t); }}>Duplicate task</button>
                                  <button className="dd-item dd-btn" onClick={() => { setRowMenu(null); copyTitle(t); }}>Copy title</button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {total === 0 && <p className="empty">No tasks found.</p>}
              </div>

              {/* FOOTER */}
              <footer className="table-footer">
                <span>Rows per page:</span>
                <Select value={perPage} onChange={(e) => { setPerPage(+e.target.value); setPage(1); }} className="w-rows">
                  <option>5</option><option>10</option><option>20</option>
                </Select>
                <span className="page-info">{total ? `${start + 1}-${Math.min(start + perPage, total)} of ${total}` : '0 of 0'}</span>
                <button className="icon-btn" title="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={20} /></button>
                <button className="icon-btn" title="Next page" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}><ChevronRight size={20} /></button>
              </footer>
            </section>
          )}

          {/* STATS VIEW */}
          {view === 'stats' && (
            <section>
              <h1>Statistics</h1>
              <div className="stat-cards">
                {Object.entries(stats).map(([label, value]) => (
                  <div className="stat-card" key={label}><h2>{value}</h2><p>{label}</p></div>
                ))}
              </div>
            </section>
          )}

          {/* SETTINGS VIEW */}
          {view === 'settings' && (
            <section>
              <h1>Settings</h1>
              <div className="panel">
                <div className="setting">
                  <div><strong>Dark mode</strong><p>Switch between light and dark colours.</p></div>
                  <button className="btn btn-lilac" onClick={() => setDark((d) => !d)}>{dark ? 'Turn off' : 'Turn on'}</button>
                </div>
                <div className="setting">
                  <div><strong>Rows per page</strong><p>How many tasks to show in the table.</p></div>
                  <Select value={perPage} onChange={(e) => { setPerPage(+e.target.value); setPage(1); }} className="w-rows">
                    <option>5</option><option>10</option><option>20</option>
                  </Select>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* ADD / EDIT MODAL */}
      {form && (
        <div className="modal" onClick={(e) => { if (e.target === e.currentTarget) setForm(null); }}>
          <form className="modal-box" onSubmit={submitForm} noValidate>
            <h2>{form.id ? 'Edit Task' : 'Create Task'}</h2>

            <label htmlFor="title">Title *</label>
            <input id="title" type="text" maxLength={200} autoFocus value={form.title} onChange={setField('title')} />
            <small className="error">{titleError}</small>

            <label htmlFor="description">Description</label>
            <textarea id="description" rows={3} value={form.description} onChange={setField('description')} />

            <div className="row">
              <div>
                <label htmlFor="deadline">Deadline</label>
                <input id="deadline" type="date" value={form.deadline} onChange={setField('deadline')} />
              </div>
              <div>
                <label htmlFor="priority">Priority</label>
                <select id="priority" value={form.priority} onChange={setField('priority')}>
                  <option>Low</option><option>Medium</option><option>High</option>
                </select>
              </div>
              <div>
                <label htmlFor="status">Status</label>
                <select id="status" value={form.status} onChange={setField('status')}>
                  <option>Pending</option><option>Completed</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-light" onClick={() => setForm(null)}>Cancel</button>
              <button type="submit" className="btn btn-dark">Save</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}