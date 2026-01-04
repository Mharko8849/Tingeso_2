import React, { useState, useEffect } from 'react';
import NavBar from '../components/Layout/NavBar';
import UserRegisterForm from '../components/Register/UserRegisterForm';
import api from '../services/http-common';
import BackButton from '../components/Common/BackButton';
import TransitionAlert from '../components/Alerts/TransitionAlert';

const UsersDetails = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get('/users/me');
      setUser(res.data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar la información del usuario.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (formData) => {
    try {
      // Merge original user data with form data to ensure we don't lose fields like ID
      const updatedUser = {
        ...user,
        ...formData,
      };

      if (!formData.password) {
        delete updatedUser.password;
      }

      await api.put('/users', updatedUser);
      setAlert({ severity: 'success', message: 'Información actualizada correctamente.' });
      // Refresh user data
      fetchUser();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.message || 'Error al actualizar información.';
      setAlert({ severity: 'error', message: errMsg });
      throw err; // UserRegisterForm will catch and display error
    }
  };

  if (loading) return <div className="p-8">Cargando...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!user) return <div className="p-8">No se encontró usuario.</div>;

  // Determine read-only fields based on role
  // Rule: RUT is always read-only.
  // Rule: If EMPLOYEE or ADMIN, Name and LastName are also read-only.
  const isStaff = user.rol === 'EMPLOYEE' || user.rol === 'ADMIN' || user.rol === 'SUPERADMIN';
  const readOnlyFields = ['rut', 'rol'];
  if (isStaff) {
    readOnlyFields.push('name');
    readOnlyFields.push('lastName');
  }

  return (
    <div className="page-container">
      <NavBar />
      <div className="content-wrap" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 900, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Ajustes de Usuario</h2>
            <BackButton to="/" />
          </div>
          <TransitionAlert alert={alert} onClose={() => setAlert(null)} />
        </div>

        <UserRegisterForm
          initial={user}
          isEditMode={true}
          title="" // Title moved outside
          submitLabel="Guardar cambios"
          onSubmit={handleUpdate}
          readOnlyFields={readOnlyFields}
          hideRoleField={true}
          requirePassword={true}
        />
      </div>
    </div>
  );
};

export default UsersDetails;
