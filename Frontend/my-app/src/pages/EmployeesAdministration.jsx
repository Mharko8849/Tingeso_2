import React, { useEffect, useState } from 'react';
import NavBar from '../components/Layout/NavBar';
import { useKeycloak } from '@react-keycloak/web';
import api from '../services/http-common';
import { useAlert } from '../components/Alerts/useAlert';
import EmployeeRegister from '../components/Register/ModalEmployeesRegister';
import ConfirmDelete from '../components/Common/ConfirmDelete';
import BackButton from '../components/Common/BackButton';
import { ReportEmployees } from '../components/Reports';
import PaginationBar from '../components/Common/PaginationBar';

const EmployeesAdministration = () => {
  const { keycloak } = useKeycloak();
  const parseJwt = (token) => {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch (e) { return null; }
  };
  let roles = [];
  if (keycloak?.tokenParsed?.realm_access?.roles) {
    roles = keycloak.tokenParsed.realm_access.roles;
  } else {
    const localToken = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('app_token')) : null;
    if (localToken) {
      const p = parseJwt(localToken);
      if (p && p.realm_access && Array.isArray(p.realm_access.roles)) roles = p.realm_access.roles;
    }
  }
  roles = roles.map((r) => String(r).toUpperCase());
  const isAdminOrSuper = roles.includes('ADMIN') || roles.includes('SUPERADMIN');
  console.debug('EmployeesAdministration roles:', roles, 'isAdminOrSuper:', isAdminOrSuper);

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { show } = useAlert();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState(null);

  useEffect(() => {
    fetchFilteredEmployees({ role: roleFilter, q });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFilteredEmployees = async ({ role: roleVal, q: qVal } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      const resp = await api.get('/users/employees', { params });
      const data = resp?.data || [];

      let filtered = data.slice();
      if (qVal) {
        const term = qVal.toString().toLowerCase();
        filtered = filtered.filter((u) => {
          const name = (u.name || '').toString().toLowerCase();
          const lastName = (u.lastName || '').toString().toLowerCase();
          const email = (u.email || '').toString().toLowerCase();
          return name.includes(term) || lastName.includes(term) || email.includes(term);
        });
      }
      if (roleVal) {
        filtered = filtered.filter((u) => ((u.rol || u.role || '').toString().toUpperCase() === String(roleVal).toUpperCase()));
      }
      filtered = filtered.filter((u) => {
        const r = (u.rol || u.role || '').toString().toUpperCase();
        return r === 'EMPLOYEE' || r === 'ADMIN';
      });
      setEmployees(filtered);
    } catch (e) {
      console.error('Failed to load employees (filtered)', e);
      setError('No se pudo cargar la lista de empleados');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const total = employees.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;
  const pagedEmployees = employees.slice(start, end);

  const [showRegister, setShowRegister] = useState(false);

  const resolveAdminId = async () => {
    let idAdmin = null;
    try {
      const localToken = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('app_token')) : null;
      const token = keycloak?.token || localToken;

      if (token) {
        try {
          const meResp = await fetch('/users/me', { headers: { Authorization: `Bearer ${token}` } });
          if (meResp.ok) {
            const me = await meResp.json();
            idAdmin = me.id;
          }
        } catch (err) {
          console.warn('Failed to call /users/me', err);
        }
      }

      if (!idAdmin) {
        const kcSub = keycloak?.tokenParsed?.sub || keycloak?.subject || null;
        const preferred = keycloak?.tokenParsed?.preferred_username || keycloak?.tokenParsed?.username || null;
        const emailClaim = keycloak?.tokenParsed?.email || null;

        const findIn = Array.isArray(employees) && employees.length > 0 ? employees : null;
        const tryMatch = (list) => {
          if (!list) return null;
          const found = list.find((u) => {
            if (kcSub && u.keycloakId && String(u.keycloakId) === String(kcSub)) return true;
            if (preferred && (u.username === preferred || u.username === String(preferred))) return true;
            if (emailClaim && (u.email === emailClaim || u.email === String(emailClaim))) return true;
            return false;
          });
          return found ? found.id : null;
        };

        idAdmin = tryMatch(findIn);

        if (!idAdmin) {
          const allResp = await api.get('/users');
          const allUsers = allResp.data || [];
          idAdmin = tryMatch(allUsers);
        }

        if (!idAdmin) {
          throw new Error('No pude determinar tu ID de administrador automáticamente. Asegúrate que tu cuenta Keycloak esté mapeada a la BD (campo keycloakId) o que el backend exponga /users/me.');
        }
      }

      return idAdmin;
    } catch (e) {
      console.warn('Error intentando resolver idAdmin automáticamente', e);
      throw e;
    }
  };

  const createEmployee = async (payload) => {
    try {
      const wantedRole = (payload?.rol || payload?.role || 'EMPLOYEE').toString().toUpperCase();

      // Usar los endpoints de /users/register para asegurar creación en Keycloak primero.
      let resp;
      if (wantedRole === 'ADMIN') {
        if (!roles.includes('SUPERADMIN')) {
          throw new Error('Sólo un SUPERADMIN puede crear usuarios ADMIN');
        }
        resp = await api.post('/users/register/admin', payload);
      } else {
        // EMPLOYEE por defecto
        resp = await api.post('/users/register/employee', payload);
      }
      setEmployees((s) => [resp.data, ...s]);
      try { show({ severity: 'success', message: 'Empleado creado correctamente' }); } catch (e) { alert('Empleado creado correctamente'); }
    } catch (e) {
      console.error('create employee failed', e);
      const status = e?.response?.status;
      const data = e?.response?.data;
      let serverMessage = null;
      if (data) {
        if (typeof data === 'string') serverMessage = data;
        else if (data.message) serverMessage = data.message;
        else serverMessage = JSON.stringify(data);
      }
      const msg = serverMessage || e?.message || 'Error al crear empleado';
      const userMsg = status ? `Error ${status}: ${msg}` : msg;
      throw new Error(userMsg);
    }
  };

  const addEmployee = () => setShowRegister((s) => !s);

  const confirmDelete = (employee) => {
    setSelectedToDelete(employee);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setSelectedToDelete(null);
  };

  const removeEmployee = async (employee) => {
    if (!employee || !employee.id) return closeConfirm();
    try {
      await api.delete(`/users/id/${employee.id}`);
      setEmployees((s) => s.filter((u) => u.id !== employee.id));
      try { show({ severity: 'success', message: 'Empleado eliminado' }); } catch (e) { alert('Empleado eliminado'); }
    } catch (e) {
      console.error('delete failed', e);
      try {
        const status = e?.response?.status;
        const data = e?.response?.data;
        let serverMessage = null;
        if (data) {
          if (typeof data === 'string') serverMessage = data;
          else if (data.message) serverMessage = data.message;
          else serverMessage = JSON.stringify(data);
        }
        show({ severity: 'error', message: serverMessage || `Error ${status || ''}: No se pudo eliminar empleado` });
      } catch (ee) {
        alert('Error al eliminar empleado');
      }
    } finally {
      closeConfirm();
    }
  };

  if (!isAdminOrSuper) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <NavBar />
        <main style={{ paddingTop: 30 }} className="px-6">
          <div className="max-w-6xl mx-auto" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
            <h2>Acceso denegado</h2>
            <p>Esta sección sólo está disponible para usuarios ADMIN o SUPERADMIN.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <NavBar />
      <main style={{ paddingTop: 30 }} className="px-6">
        <div className="max-w-6xl mx-auto" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <h2 style={{ margin: 0 }}>Administración — Empleados</h2>
              <p style={{ margin: '4px 0 0', color: '#4b5563' }}>Listado general de empleados del sistema. Desde aquí puedes buscar, registrar o eliminar cuentas de empleados.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <BackButton to="/" />
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              placeholder="Buscar por nombre o email..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', minWidth: 260 }}
            />
            <select
              value={roleFilter}
              onChange={(e) => {
                const v = e.target.value;
                setRoleFilter(v);
                setPage(1);
                fetchFilteredEmployees({ role: v, q });
              }}
              style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', minWidth: 160 }}
            >
              <option value="">Todos los roles</option>
              <option value="EMPLOYEE">Empleado</option>
              <option value="ADMIN">Administrador</option>
            </select>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
              <button
                onClick={() => fetchFilteredEmployees({ role: roleFilter, q })}
                className="primary-cta"
                type="button"
                aria-label="Refrescar"
                title="Refrescar"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 12a9 9 0 1 1-2.64-6.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Refrescar
              </button>
              <ReportEmployees rows={employees} />
              <button onClick={addEmployee} className="primary-cta" type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z" fill="#fff"/></svg>
                <span style={{ marginLeft: 8 }}>Añadir Empleado</span>
              </button>
            </div>
          </div>

          {showRegister && (
            <EmployeeRegister
              title={roles.includes('SUPERADMIN') ? 'Añadir Empleado' : 'Añadir Empleado'}
              defaultRole="EMPLOYEE"
              allowedRoles={roles.includes('SUPERADMIN') ? ["EMPLOYEE", "ADMIN"] : ["EMPLOYEE"]}
              hideRoleField={false}
              isSuper={roles.includes('SUPERADMIN')}
              isAdmin={roles.includes('ADMIN')}
              onCreate={async (payload) => {
                try {
                  await createEmployee(payload);
                  setShowRegister(false);
                } catch (e) {
                  try { show({ severity: 'error', message: e?.message || 'Error al crear empleado' }); } catch (ee) { alert(e?.message || 'Error al crear empleado'); }
                  throw e;
                }
              }}
              onCancel={() => setShowRegister(false)}
            />
          )}

          <div style={{ marginTop: 12 }}>
            {loading && <div>Cargando empleados...</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}

            {!loading && !error && (
              <div style={{ overflowX: 'auto', marginTop: 8 }}>
                <PaginationBar
                  page={safePage}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={(p) => setPage(p)}
                  onPageSizeChange={(ps) => { setPageSize(ps); setPage(1); }}
                  showPageSizeControls
                  showSummary={false}
                />
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '6%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '28%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '10%' }} />
                  </colgroup>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: 8 }}>ID</th>
                      <th style={{ padding: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Nombre</th>
                      <th style={{ padding: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Apellido</th>
                      <th style={{ padding: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Email</th>
                      <th style={{ padding: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Rol</th>
                      <th style={{ padding: 8, whiteSpace: 'nowrap' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedEmployees.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.id}</td>
                        <td style={{ padding: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</td>
                        <td style={{ padding: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.lastName}</td>
                        <td style={{ padding: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</td>
                        <td style={{ padding: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.rol || u.role || 'EMPLOYEE'}</td>
                        <td style={{ padding: 8, whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => confirmDelete(u)}
                            style={{
                              marginRight: 8,
                              backgroundColor: '#e53e3e',
                              color: '#fff',
                              border: 'none',
                              padding: '6px 10px',
                              borderRadius: 4,
                              cursor: 'pointer'
                            }}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {employees.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: 12, textAlign: 'center' }}>No hay usuarios</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <PaginationBar
                  page={safePage}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={(p) => setPage(p)}
                  onPageSizeChange={(ps) => { setPageSize(ps); setPage(1); }}
                  showPageSizeControls={false}
                  showSummary
                />
              </div>
            )}
          </div>
        </div>
        <ConfirmDelete open={confirmOpen} employee={selectedToDelete} onCancel={closeConfirm} onConfirm={removeEmployee} />
      </main>
    </div>
  );
};

export default EmployeesAdministration;
