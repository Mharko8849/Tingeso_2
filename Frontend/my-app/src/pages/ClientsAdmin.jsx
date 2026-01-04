import React, { useEffect, useState } from 'react';
import NavBar from '../components/Layout/NavBar';
import { useKeycloak } from '@react-keycloak/web';
import api from '../services/http-common';
import EmployeeRegister from '../components/Register/ModalEmployeesRegister';
import TransitionAlert from '../components/Alerts/TransitionAlert';
import { ReportClients } from '../components/Reports';
import Badge from '../components/Badges/Badge';
import { statusToBadgeVariant } from '../components/Badges/statusToBadge';
import BackButton from '../components/Common/BackButton';
import PaginationBar from '../components/Common/PaginationBar';

const ClientsAdmin = () => {
  const { keycloak } = useKeycloak();
  const parseJwt = (token) => {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch (e) {
      return null;
    }
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

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [alert, setAlert] = useState(null); // { severity, message }
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchFilteredClients = async ({ state: stateVal, q: qVal } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (stateVal) params.state = stateVal;
      const resp = await api.get('/api/user/filter', { params });
      const data = resp.data || [];
      // keep only users whose role looks like CLIENT as a safeguard
      let filtered = (data || []).filter((u) => {
        const r = (u.rol || u.role || '').toString().toUpperCase();
        return r === 'CLIENT' || r === 'CLIENTE';
      });

      // apply client-side text filter by name, lastName, email or rut
      if (qVal) {
        const term = String(qVal).toLowerCase();
        filtered = filtered.filter((u) => {
          const name = (u.name || '').toString().toLowerCase();
          const lastName = (u.lastName || '').toString().toLowerCase();
          const email = (u.email || '').toString().toLowerCase();
          const rut = (u.rut || u.RUT || '').toString().toLowerCase();
          return (
            name.includes(term)
            || lastName.includes(term)
            || email.includes(term)
            || rut.includes(term)
          );
        });
      }
      setClients(filtered);
    } catch (e) {
      console.error('Failed to load clients (filtered)', e);
      setError('No se pudo cargar la lista de clientes');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load using current filters (empty by default)
    fetchFilteredClients({ state: status, q });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = clients.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;
  const pagedClients = clients.slice(start, end);

  const addClient = () => setShowRegister((s) => !s);

  const createClient = async (form) => {
    // call backend register endpoint
    const body = {
      username: form.username,
      name: form.name,
      lastName: form.lastName,
      rut: form.rut,
      phone: form.phone,
      email: form.email,
      password: form.password,
      rol: form.rol || 'CLIENT',
    };

    const res = await fetch('/users/register/client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Registro de cliente falló');
    }

    const created = await res.json();
    // backend may return created user or not; attempt to append minimal info
    const toAppend = created || { username: form.username, name: form.name, lastName: form.lastName, email: form.email, rol: body.rol, rut: form.rut };
    setClients((s) => [toAppend, ...s]);
  };

  // Normalize various possible server fields for client state/status
  const getClientState = (u) => {
    const candidates = [u.stateClient, u.state, u.state_client, u.status, u.enabled, u.active, u.isActive, u.estado];
    for (let v of candidates) {
      if (v !== undefined && v !== null && v !== '') {
        if (typeof v === 'boolean') return v ? 'ACTIVO' : 'INACTIVO';
        const vs = String(v).toUpperCase();
        if (vs === 'TRUE' || vs === 'ACTIVE' || vs === 'ACTIVO' || vs === 'ENABLED') return 'ACTIVO';
        if (vs === 'FALSE' || vs === 'INACTIVE' || vs === 'INACTIVO' || vs === 'DISABLED') return 'INACTIVO';
        return String(v);
      }
    }
    return '—';
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
        <div style={{ maxWidth: 900, margin: '0 auto 12px' }}>
          <TransitionAlert alert={alert} onClose={() => setAlert(null)} autoHideMs={4000} />
        </div>
        <div className="max-w-6xl mx-auto" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <h2 style={{ margin: 0 }}>Administración — Clientes</h2>
              <p style={{ margin: '4px 0 0', color: '#4b5563' }}>Listado general de clientes registrados. Desde aquí puedes buscar, registrar y revisar su estado.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <BackButton to="/" />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  placeholder="Buscar por nombre, usuario o email..."
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', minWidth: 260 }}
                />
                <select
                  value={status}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStatus(v);
                    setPage(1);
                    // call filter immediately with new status
                    fetchFilteredClients({ state: v, q });
                  }}
                  style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', minWidth: 160 }}
                >
                  <option value="">Todos los estados</option>
                  <option value="ACTIVO">Activo</option>
                  <option value="RESTRINGIDO">Restringido</option>
                </select>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button
                    onClick={() => fetchFilteredClients({ state: status, q })}
                    className="primary-cta"
                    type="button"
                    aria-label="Refrescar"
                    title="Refrescar"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    {/* reload icon */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 12a9 9 0 1 1-2.64-6.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Refrescar
                  </button>
                  <ReportClients rows={clients} />
                  <button onClick={addClient} className="primary-cta" type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z" fill="#fff"/></svg>
                    <span style={{ marginLeft: 8 }}>Añadir Cliente</span>
                  </button>
                </div>
              </div>
              {showRegister && (
                <EmployeeRegister
                  title="Añadir cliente"
                  defaultRole="CLIENT"
                  allowedRoles={["CLIENT"]}
                  hideRoleField={true}
                  isSuper={roles.includes('SUPERADMIN')}
                  isAdmin={roles.includes('ADMIN')}
                  onCreate={async (payload) => {
                    try {
                      await createClient(payload);
                      // show success alert in the page and close modal
                      setAlert({ severity: 'success', message: 'Cliente creado correctamente.' });
                      setShowRegister(false);
                    } catch (e) {
                      // show error alert and keep modal open so admin can fix
                      setAlert({ severity: 'error', message: e?.message || 'Error al crear cliente' });
                      throw e;
                    }
                  }}
                  onCancel={() => setShowRegister(false)}
                />
              )}
            </div>
            {loading && <div>Cargando clientes...</div>}
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
                  {/* Define column widths to make Username less wide and balance columns */}
                  <colgroup>
                    <col style={{ width: '6%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '8%' }} />
                  </colgroup>
                  <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                          <th style={{ padding: 8 }}>ID</th>
                          <th style={{ padding: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Username</th>
                          <th style={{ padding: 8 }}>Nombre</th>
                          <th style={{ padding: 8 }}>Apellido</th>
                          <th style={{ padding: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Email</th>
                          <th style={{ padding: 8 }}>RUT</th>
                          <th style={{ padding: 8 }}>Pedidos</th>
                          <th style={{ padding: 8 }}>Estado</th>
                          <th style={{ padding: 8 }}>Rol</th>
                        </tr>
                  </thead>
                  <tbody>
                    {pagedClients.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.id}</td>
                        <td style={{ padding: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.username}</td>
                        <td style={{ padding: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</td>
                        <td style={{ padding: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.lastName}</td>
                        <td style={{ padding: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</td>
                        <td style={{ padding: 8 }}>{u.rut ?? u.RUT ?? '—'}</td>
                        <td style={{ padding: 8, textAlign: 'center' }}>{u.loans != null ? u.loans : 0}</td>
                        <td style={{ padding: 8 }}>
                          {(() => {
                            const s = getClientState(u);
                            const variant = statusToBadgeVariant(s);
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Badge variant={variant} title={s} ariaLabel={`Estado: ${s}`} />
                                <div style={{ fontSize: 14, color: '#374151' }}>{s}</div>
                              </div>
                            );
                          })()}
                        </td>
                        <td style={{ padding: 8 }}>{u.rol}</td>
                      </tr>
                    ))}
                    {clients.length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ padding: 12, textAlign: 'center' }}>No hay clientes</td>
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
      </main>
    </div>
  );
};

export default ClientsAdmin;
