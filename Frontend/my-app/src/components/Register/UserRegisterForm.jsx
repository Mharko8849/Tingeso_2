import React, { useState, useEffect } from 'react';

// Icons as constants to keep the JSX clean.
const ICONS = {
  USER: <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M2 14s1-4 6-4 6 4 6 4v1H2v-1z"/></svg>,
  EMAIL: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8l9 6 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 8v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  PHONE: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92V21a1 1 0 0 1-1.11 1 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2 3.11 1 1 0 0 1 3 2h4.09a1 1 0 0 1 1 .75c.12.62.36 1.9.4 2.3a1 1 0 0 1-.24.86L7.7 8.3a15.09 15.09 0 0 0 6 6l1.4-1.4a1 1 0 0 1 .86-.24c.4.04 1.68.28 2.3.4a1 1 0 0 1 .75 1V21z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ID_CARD: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 8v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  USERNAME: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 21c0-3.866-3.582-7-8-7s-8 3.134-8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  LOCK: <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8 1a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3zM6 4a2 2 0 1 1 4 0v2H6V4z"/></svg>
};

/**
 * UserRegisterForm component.
 * A reusable form for user registration.
 * 
 * Props:
 * - initial: object with initial values for fields.
 * - requirePassword: boolean (default true) to enforce password fields.
 * - isSuper: boolean to allow selecting ADMIN role.
 * - defaultRole: initial role.
 * - title: heading text.
 * - submitLabel: label for submit button.
 * - onSubmit(form): async function called when validated form is submitted.
 * - onCancel(): optional callback.
 * - hideRoleField: boolean to hide the role selection field.
 * - readOnlyFields: array of field names to be read-only.
 * - isEditMode: boolean to indicate if the form is in edit mode.
 */
const UserRegisterForm = ({
  initial = {},
  requirePassword = true,
  isSuper = false,
  allowedRoles = null,
  defaultRole = 'CLIENT',
  title = 'Crear cuenta',
  submitLabel = 'Crear cuenta',
  onSubmit,
  onCancel,
  hideRoleField = false,
  readOnlyFields = [],
  isEditMode = false,
}) => {
  const [form, setForm] = useState({
    username: initial.username || '',
    name: initial.name || '',
    lastName: initial.lastName || '',
    rut: initial.rut || '',
    phone: initial.phone || '',
    email: initial.email || '',
    password: '',
    confirm: '',
    rol: initial.rol || defaultRole,
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Sync form state with initial props when they change
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      username: initial.username || prev.username,
      name: initial.name || prev.name,
      lastName: initial.lastName || prev.lastName,
      rut: initial.rut || prev.rut,
      phone: initial.phone || prev.phone,
      email: initial.email || prev.email,
      rol: initial.rol || prev.rol || defaultRole,
    }));
  }, [initial, defaultRole]);

  // Updates the form state for a given field key.
  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Validates the form fields.
  const validate = () => {
    if (!form.username || !form.name || !form.lastName || !form.email) {
      setMsg('Por favor completa los campos obligatorios.');
      return false;
    }
    if (requirePassword && !isEditMode) {
      if (!form.password) {
        setMsg('Por favor asigna una contraseña.');
        return false;
      }
      if (form.password !== form.confirm) {
        setMsg('Las contraseñas no coinciden.');
        return false;
      }
    }
    if (isEditMode && form.password && form.password !== form.confirm) {
      setMsg('Las contraseñas no coinciden.');
      return false;
    }
    return true;
  };

  // Handles form submission.
  const submit = async (e) => {
    e && e.preventDefault();
    setMsg(null);
    if (!validate()) return;
    setLoading(true);
    try {
      if (onSubmit) await onSubmit(form);
    } catch (err) {
      setMsg(err?.message || err?.response?.data || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = (field) => readOnlyFields.includes(field);

  return (
    <div className="form-card max-w-md mx-auto bg-white p-8 rounded shadow" style={{ maxWidth: 900 }}>
      <h2 className="form-title">{title}</h2>
      <p className="form-sub">{isEditMode ? 'Configuración de usuario' : 'Crea una cuenta en el sistema'}</p>

      <form onSubmit={submit} className="form-grid">
        <div className="input-group">
          <label>Nombre</label>
          <div className="input-with-icon">
            <span className="icon" aria-hidden>{ICONS.USER}</span>
            <input value={form.name} onChange={update('name')} placeholder="Nombre" required disabled={isReadOnly('name')} />
          </div>
        </div>

        <div className="input-group">
          <label>Apellido</label>
          <div className="input-with-icon">
            <span className="icon" aria-hidden>{ICONS.USER}</span>
            <input value={form.lastName} onChange={update('lastName')} placeholder="Apellido" required disabled={isReadOnly('lastName')} />
          </div>
        </div>

        <div className="input-group">
          <label>Email</label>
          <div className="input-with-icon">
            <span className="icon" aria-hidden>{ICONS.EMAIL}</span>
            <input type="email" value={form.email} onChange={update('email')} placeholder="tu@ejemplo.com" required disabled={isReadOnly('email')} />
          </div>
        </div>

        <div className="input-group">
          <label>Teléfono</label>
          <div className="input-with-icon">
            <span className="icon" aria-hidden>{ICONS.PHONE}</span>
            <input value={form.phone} onChange={update('phone')} placeholder="+56 9 1234 5678" disabled={isReadOnly('phone')} />
          </div>
        </div>

        <div className="input-group">
          <label>RUT</label>
          <div className="input-with-icon">
            <span className="icon" aria-hidden>{ICONS.ID_CARD}</span>
            <input value={form.rut} onChange={update('rut')} placeholder="12345678-9" disabled={isReadOnly('rut')} />
          </div>
        </div>

        <div className="input-group">
          <label>Usuario</label>
          <div className="input-with-icon">
            <span className="icon" aria-hidden>{ICONS.USERNAME}</span>
            <input value={form.username} onChange={update('username')} placeholder="nombre de usuario" required disabled={isReadOnly('username')} />
          </div>
        </div>

        {requirePassword && (
          <>
            <div className="input-group">
              <label>Contraseña {isEditMode && '(Opcional)'}</label>
              <div className="input-with-icon">
                <span className="icon" aria-hidden>{ICONS.LOCK}</span>
                <input type="password" value={form.password} onChange={update('password')} placeholder={isEditMode ? "Dejar en blanco para no cambiar" : "Contraseña"} required={!isEditMode} />
              </div>
            </div>

            <div className="input-group">
              <label>Repetir contraseña</label>
              <div className="input-with-icon">
                <span className="icon" aria-hidden>{ICONS.LOCK}</span>
                <input type="password" value={form.confirm} onChange={update('confirm')} placeholder="Repite la contraseña" required={!isEditMode || form.password.length > 0} />
              </div>
            </div>
          </>
        )}

        {!hideRoleField && (
          <div className="input-group">
            <label>Rol</label>
            <div className="input-with-icon">
              {/* Render roles based on allowedRoles prop; fallback: if isSuper allow ADMIN/EMPLOYEE only */}
              {Array.isArray(allowedRoles) && allowedRoles.length > 0 ? (
                <select value={form.rol} onChange={update('rol')} disabled={isReadOnly('rol')}>
                  {allowedRoles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              ) : isSuper ? (
                <select value={form.rol} onChange={update('rol')} disabled={isReadOnly('rol')}>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              ) : (
                <select value={form.rol} onChange={update('rol')} disabled={isReadOnly('rol')}>
                  <option value={form.rol}>{form.rol}</option>
                </select>
              )}
            </div>
          </div>
        )}

        <div className="actions">
          <button className="primary-cta" type="submit" disabled={loading} style={{ width: '100%' , justifyContent: 'center'}}>{loading ? 'Guardando...' : submitLabel}</button>
          {!isEditMode && (
            <button type="button" className="link" style={{ width: '100%' ,justifyContent: 'center'}} onClick={() => { window.history.pushState({}, '', '/login'); window.dispatchEvent(new PopStateEvent('popstate')); }}>¿Ya tienes cuenta? Inicia sesión</button>
          )}
          {onCancel && <button type="button" className="link" onClick={onCancel} style={{ width: '100%', justifyContent: 'center' }}>Cancelar</button>}
        </div>

        {msg && <div className="form-message">{msg}</div>}
      </form>
    </div>
  );
};

export default UserRegisterForm;
