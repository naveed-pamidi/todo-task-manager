
export const API = 'https://todo-task-manager-cpej.onrender.com/api/tasks/';

export async function api(url, method = 'GET', data) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data !== undefined && data !== null) {
    opts.body = JSON.stringify(data);
  }

  const res = await fetch(url, opts);

  const contentType = res.headers.get('content-type') || '';
  const responseData = contentType.includes('application/json')
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    throw {
      status: res.status,
      data: responseData,
    };
  }

  return responseData;
}
