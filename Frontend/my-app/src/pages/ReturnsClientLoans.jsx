import React, { useEffect, useState } from 'react';
import NavBar from '../components/Layout/NavBar';
import BackButton from '../components/Common/BackButton';
import api from '../services/http-common';
import Badge from '../components/Badges/Badge';
import { statusToBadgeVariant } from '../components/Badges/statusToBadge';

const ReturnsClientLoans = () => {
  const [loans, setLoans] = useState([]);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const parts = window.location.pathname.split('/');
    const clientId = parts[parts.length - 1];
    if (!clientId) return;

    // fetch loans for this client
    api.get(`/loans/filter?userId=${clientId}`)
      .then(res => {
        setLoans(res.data || []);
        if (res.data && res.data.length > 0) setClient(res.data[0].client);
      })
      .catch(() => setLoans([]))
      .finally(() => setLoading(false));
  }, []);

  const openLoan = (id) => {
    window.history.pushState({}, '', `/admin/returns/loan/${id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <NavBar />
      <main style={{ paddingTop: 30 }} className="px-6">
        <div className="max-w-6xl mx-auto big-page">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0 }}>Pedidos del cliente {client ? (client.name ? `${client.name} ${client.lastName || ''}` : (client.username || client.email)) : ''}</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <BackButton to="/admin/returns" />
            </div>
          </div>
          {loading ? <p>Cargando pedidos...</p> : (
            loans.length === 0 ? <p>El cliente no tiene pedidos.</p> : (
              <div style={{ marginTop: 12, maxHeight: 520, overflowY: 'auto', width: '100%' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 160px 120px', gap: 12, padding: '6px 8px', borderBottom: '1px solid #f1f5f9', marginBottom: 8, alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Pedido #</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Fecha inicio</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Fecha devolución</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Estado</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', textAlign: 'right' }}>Acciones</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                  {loans.map((l) => (
                    <div
                      key={l.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openLoan(l.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openLoan(l.id); }}
                      style={{
                        padding: 14,
                        borderRadius: 8,
                        border: '1px solid #e6e6e6',
                        background: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 24,
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 160px 120px', alignItems: 'center', gap: 12, width: '100%' }}>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>#{l.id}</div>
                        <div style={{ fontSize: 14, color: '#374151' }}>{l.initDate}</div>
                        <div style={{ fontSize: 14, color: '#374151' }}>{l.returnDate}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Badge variant={statusToBadgeVariant(l.status)} title={l.status || ''} />
                          <div style={{ fontSize: 14, color: '#374151' }}>{l.status}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <button className="link" style={{ whiteSpace: 'nowrap' }} onClick={(ev) => { ev.stopPropagation(); openLoan(l.id); }}>Ver pedido</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
};

export default ReturnsClientLoans;
