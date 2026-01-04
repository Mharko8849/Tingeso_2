import React, { useState } from 'react';
import api from '../services/http-common';
import NavBar from '../components/Layout/NavBar';
import './forms.css';
import UserRegisterForm from '../components/Register/UserRegisterForm';
import TransitionAlert from '../components/Alerts/TransitionAlert';
const Register = () => {
  const [alert, setAlert] = useState(null); // { severity: 'success'|'error', message }

  const submit = async (form) => {
    // parent-level submit: posts to public register endpoint
    const body = {
      username: form.username,
      name: form.name,
      lastName: form.lastName,
      rut: form.rut,
      phone: form.phone,
      email: form.email,
      password: form.password,
      // stateClient and rol are set server-side by UserService.createClient
    };

    try {
      await api.post('/users/register/client', body);
      // success: show success alert and go back to the previous page after a short delay
      setAlert({ severity: 'success', message: 'Registro exitoso. Volviendo a la página anterior...' });
      setTimeout(() => {
        try { window.history.back(); } catch (e) { window.location.href = '/'; }
      }, 1200);
    } catch (e) {
      console.error('Registration failed', e);
      const err = e.response?.data || e.message || 'Registro falló';
      // show error alert
      setAlert({ severity: 'error', message: typeof err === 'string' ? err : JSON.stringify(err) });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <NavBar />
      <main style={{ paddingTop: 60 }} className="px-6">
        <div style={{ maxWidth: 900, margin: '0 auto 12px' }}>
          <TransitionAlert alert={alert} onClose={() => setAlert(null)} autoHideMs={4000} />
        </div>
        <UserRegisterForm title="Crear cuenta" submitLabel="Crear cuenta" requirePassword={true} defaultRole={"CLIENT"} hideRoleField={true} onSubmit={submit} />
      </main>
    </div>
  );
};

export default Register;
