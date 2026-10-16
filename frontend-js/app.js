const API = 'http://127.0.0.1:8000/api/tasks/';
let currentFilter = 'all';

const $ = (id) => document.getElementById(id);
const body = $('taskBody');

// ---------- helpers ----------
function showMessage(text, isError = false) {
  const m = $('message');
  m.textContent = text;
  m.className = 'message' + (isError ? ' err' : '');
  m.hidden = false;
  setTimeout(() => (m.hidden = true), 3000);
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str ?? '';
  return d.innerHTML;
}

async function api(url, method = 'GET', data) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (data) opts.body = JSON.stringify(data);
  const res = await fetch(url, opts);
  const json = res.status === 204 ? null : await res.json();
  if (!res.ok) throw { status: res.status, data: json };
  return json;
}

// ---------- load & render ----------
async function loadTasks() {
  const params = new URLSearchParams();
  if (currentFilter === 'overdue') params.set('overdue', 'true');
  else if (currentFilter !== 'all') params.set('status', currentFilter);
  if ($('search').value.trim()) params.set('search', $('search').value.trim());
  if ($('priorityFilter').value) params.set('priority', $('priorityFilter').value);

  try {
    render(await api(API + '?' + params));
  } catch (e) {
    showMessage('Could not load tasks. Is the server running?', true);
  }
}

function render(tasks) {
  $('empty').hidden = tasks.length > 0;
  body.innerHTML = tasks.map((t) => `
    <tr class="${t.status === 'Completed' ? 'done' : ''}">
      <td class="title">${escapeHtml(t.title)}</td>
      <td>${escapeHtml(t.description) || '—'}</td>
      <td><span class="pill p-${t.priority}">${t.priority}</span></td>
      <td><span class="pill s-${t.status}">${t.status}</span></td>
      <td class="${t.is_overdue ? 'overdue' : ''}">
        ${t.deadline || '—'}${t.is_overdue ? '<span class="badge-overdue">OVERDUE</span>' : ''}
      </td>
      <td class="actions">
        <button title="Toggle status" onclick="toggleStatus(${t.id}, '${t.status}')">${t.status === 'Pending' ? '✔' : '↩'}</button>
        <button title="Edit" onclick='openModal(${JSON.stringify(t).replace(/'/g, "&#39;")})'>✎</button>
        <button class="del" title="Delete" onclick="deleteTask(${t.id})">🗑</button>
      </td>
    </tr>`).join('');
}

// ---------- actions ----------
async function toggleStatus(id, status) {
  await api(`${API}${id}/`, 'PATCH', { status: status === 'Pending' ? 'Completed' : 'Pending' });
  loadTasks();
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  await api(`${API}${id}/`, 'DELETE');
  showMessage('Task deleted.');
  loadTasks();
}

// ---------- modal ----------
function openModal(task = null) {
  $('titleError').textContent = '';
  $('modalTitle').textContent = task ? 'Edit Task' : 'Create Task';
  $('taskId').value = task ? task.id : '';
  $('title').value = task ? task.title : '';
  $('description').value = task ? task.description : '';
  $('deadline').value = task && task.deadline ? task.deadline : '';
  $('priority').value = task ? task.priority : 'Medium';
  $('status').value = task ? task.status : 'Pending';
  $('modal').hidden = false;
  $('title').focus();
}
const closeModal = () => ($('modal').hidden = true);

$('taskForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('titleError').textContent = '';

  // client-side validation
  if (!$('title').value.trim()) {
    $('titleError').textContent = 'Task title cannot be empty.';
    return;
  }

  const id = $('taskId').value;
  const payload = {
    title: $('title').value.trim(),
    description: $('description').value.trim(),
    deadline: $('deadline').value || null,
    priority: $('priority').value,
    status: $('status').value,
  };

  try {
    await api(id ? `${API}${id}/` : API, id ? 'PUT' : 'POST', payload);
    closeModal();
    showMessage(id ? 'Task updated.' : 'Task created.');
    loadTasks();
  } catch (err) {
    // server-side validation errors
    const msg = err.data && err.data.title ? err.data.title[0] : 'Something went wrong.';
    $('titleError').textContent = msg;
  }
});

// ---------- events ----------
$('newBtn').onclick = () => openModal();
$('cancelBtn').onclick = closeModal;
$('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
$('priorityFilter').onchange = loadTasks;

let timer;
$('search').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(loadTasks, 300); });

$('tabs').addEventListener('click', (e) => {
  if (!e.target.dataset.filter) return;
  document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
  e.target.classList.add('active');
  currentFilter = e.target.dataset.filter;
  loadTasks();
});

loadTasks();
