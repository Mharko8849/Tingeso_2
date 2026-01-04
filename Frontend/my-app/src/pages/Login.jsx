import React, { useState } from 'react';
// import { useKeycloak } from '@react-keycloak/web';
import api from '../services/http-common';
import NavBar from '../components/Layout/NavBar';
import './forms.css';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  // const { keycloak } = useKeycloak();

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    // Use backend password-grant flow: submit credentials to our backend which
    // will request tokens from Keycloak and return them. We store tokens
    // locally and treat the user as logged in.
    try {
      setLoading(true);
      const body = { username: identifier, password };
      // Use axios instance which points to backend (VITE env vars or defaults)
      const resp = await api.post('/users/login', body);
      const data = resp.data;
      // store tokens locally (the backend returns a structure { token_info: { access_token, refresh_token }, user: {...} })
      // Support both old and new shapes for compatibility.
      if (data) {
        // shape: { token_info: { access_token, ... }, user: ... }
        if (data.token_info && data.token_info.access_token) {
          localStorage.setItem('access_token', data.token_info.access_token);
          if (data.token_info.refresh_token) localStorage.setItem('refresh_token', data.token_info.refresh_token);
          localStorage.setItem('app_token', data.token_info.access_token);
        }
        // shape: { access_token, refresh_token }
        else if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
        }

        // shape: { token: { access_token, refresh_token } }
        else if (data.token && data.token.access_token) {
          localStorage.setItem('access_token', data.token.access_token);
          if (data.token.refresh_token) localStorage.setItem('refresh_token', data.token.refresh_token);
          // also keep alias used elsewhere
          localStorage.setItem('app_token', data.token.access_token);
        }

        if (data.user) {
          localStorage.setItem('app_user', JSON.stringify(data.user));
        }
      }
  // redirect to home using History API (path-based routing)
  window.history.pushState({}, '', '/');
  window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err) {
      setMsg('Error iniciando sesión: ' + (err && err.message ? err.message : err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <NavBar />
      <main style={{ paddingTop: 120 }} className="px-6">
        <div className="form-card max-w-md mx-auto bg-white p-8 rounded shadow">
          <h2 className="form-title">Iniciar sesión</h2>
          <p className="form-sub">Ingresa con tu usuario o email</p>

          <form onSubmit={submit} className="form-grid">
            <div className="input-group">
              <label>Usuario o Email</label>
              <div className="input-with-icon">
                <span className="icon" aria-hidden>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8l9 6 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 8v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="usuario o email" required />
              </div>
            </div>

            <div className="input-group">
              <label>Contraseña</label>
              <div className="input-with-icon">
                <span className="icon" aria-hidden>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="tu contraseña" required />
              </div>
            </div>

            <div className="actions">
                <button className="primary-cta" type="submit" disabled={loading} style={{ width: '100%' , justifyContent: 'center' }}>{loading ? 'Entrando...' : 'Ingresar'}</button>
         <button type="button" className="link" style={{ width: '100%' ,justifyContent: 'center'}} onClick={() => { window.history.pushState({}, '', '/register'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Crear cuenta</button>
            </div>
          </form>

          {msg && <div className="form-message">{msg}</div>}
        </div>
      </main>
    </div>
  );
};

export default Login;
