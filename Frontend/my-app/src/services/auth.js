// Small auth helper to store a token returned by backend and expose parsed user info
const STORAGE_KEY = 'app_token';

const subscribers = [];

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(STORAGE_KEY, token);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  subscribers.forEach((s) => s());
}

export function getToken() {
  return localStorage.getItem(STORAGE_KEY) || localStorage.getItem('access_token');
}

export function getUser() {
  const token = getToken();
  if (!token) return null;
  return parseJwt(token);
}

export function subscribe(cb) {
  subscribers.push(cb);
  return () => {
    const idx = subscribers.indexOf(cb);
    if (idx >= 0) subscribers.splice(idx, 1);
  };
}

export default { setToken, getToken, getUser, subscribe };
