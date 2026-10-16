export const API = 'http://127.0.0.1:8000/api/tasks/';

export async function api(url, method = 'GET', data) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (data) opts.body = JSON.stringify(data);
  const res = await fetch(url, opts);
  const json = res.status === 204 ? null : await res.json();
  if (!res.ok) throw { status: res.status, data: json };
  return json;
}