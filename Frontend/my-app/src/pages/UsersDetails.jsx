import React, { useState, useEffect } from 'react';
import NavBar from '../components/Layout/NavBar';
import UserRegisterForm from '../components/Register/UserRegisterForm';
import api from '../services/http-common';
import BackButton from '../components/Common/BackButton';

const UsersDetails = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get('/api/user/me');
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
        // If password is empty, don't send it (or backend handles it? usually backend ignores if null/empty, 
        // but here we are sending the whole object. If password is empty string, we might need to handle it.
        // However, UserRegisterForm sends password field. 
        // If the backend updates password only if not empty, we are good.
        // If the backend hashes the password, we need to be careful.
        // Let's assume the backend handles password update if provided.
      };
      
      // If password is empty string, remove it from payload if possible, 
      // OR rely on backend logic. 
      // Looking at UserRegisterForm, it sets password in state.
      // If user didn't type password, it's empty string.
      // We should probably check if password is changed.
      
      if (!formData.password) {
        delete updatedUser.password;
      }

      await api.put('/api/user/', updatedUser);
      alert('Información actualizada correctamente.');
      // Refresh user data
      fetchUser();
    } catch (err) {
      console.error(err);
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
        <div style={{ width: '100%', maxWidth: 900, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Ajustes de Usuario</h2>
            <BackButton to="/" />
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
