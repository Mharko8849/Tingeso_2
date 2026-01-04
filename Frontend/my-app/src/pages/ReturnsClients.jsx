import React, { useState } from 'react';
import NavBar from '../components/Layout/NavBar';
import BackButton from '../components/Common/BackButton';
import ClientSearch from '../components/Clients/ClientSearch';

const ReturnsClients = () => {
  const [selected, setSelected] = useState(null);
  

  const handleNext = () => {
    if (!selected || !selected.id) {
      show({ severity: 'error', message: 'Selecciona un cliente antes de continuar.' });
      return;
    }
    try {
      sessionStorage.setItem('return_selected_client', JSON.stringify(selected));
    } catch (e) { /* ignore */ }
    window.history.pushState({}, '', `/admin/returns/client/${selected.id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleCancel = () => {
    try { sessionStorage.removeItem('return_selected_client'); } catch (e) {}
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <NavBar />
      <main style={{ paddingTop: 30 }} className="px-6">
        <div className="max-w-7xl mx-auto" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
          <section style={{ paddingRight: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <h2 style={{ margin: 0 }}>Devolver Pedido — Selecciona cliente</h2>
                <p style={{ margin: '4px 0 0', color: '#4b5563' }}>Busca y selecciona el cliente cuyos pedidos deseas devolver.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <BackButton onClick={handleCancel} />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <label style={{ fontSize: 16, fontWeight: 700 }}>Buscar cliente</label>
              </div>

              <ClientSearch selected={selected} onSelect={setSelected} hideHeader={true} />
            </div>
          </section>

          <aside style={{ position: 'relative' }}>
            <div style={{ position: 'sticky', top: 90 }}>
              <div style={{ padding: 18, borderRadius: 8, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', border: '1px solid #eee' }}>
                <h3 style={{ marginTop: 0 }}>Seleccionado</h3>
                {selected ? (
                  <div>
                    <div style={{ fontWeight: 700 }}>{selected.username}</div>
                    <div style={{ fontSize: 13 }}>{selected.name} {selected.lastName}</div>
                    <div style={{ fontSize: 13 }}>{selected.email}</div>
                    {selected.rut && <div style={{ marginTop: 8, fontSize: 13 }}>RUT: {selected.rut}</div>}
                    {selected.stateClient && <div style={{ marginTop: 6, fontSize: 13 }}>Estado: {selected.stateClient}</div>}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                      <button className="link" onClick={() => setSelected(null)}>Deseleccionar</button>
                      <button className="primary-cta" onClick={handleNext}>Siguiente</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#666' }}>
                    No hay cliente seleccionado

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                      <button className="link" onClick={handleCancel}>Cancelar</button>
                      <button className="primary-cta" onClick={handleNext}>Siguiente</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ReturnsClients;
