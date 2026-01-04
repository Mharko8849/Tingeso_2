import React, { useEffect, useState } from 'react';
import NavBar from '../components/Layout/NavBar';
import BackButton from '../components/Common/BackButton';
import api from '../services/http-common';
import TransitionAlert from '../components/Alerts/TransitionAlert';

const ResumeLoan = () => {
  const [resume, setResume] = useState(null);
  const [initDate, setInitDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [alert, setAlert] = useState(null);
  const [dateError, setDateError] = useState('');
  const [total, setTotal] = useState(0);
  
    const isDatesValid = () => {
        if (!initDate || !returnDate) return false;
        try {
          const dInit = new Date(initDate);
          const dRet = new Date(returnDate);
          const minDiff = 24 * 60 * 60 * 1000;
          return (dRet.getTime() - dInit.getTime()) >= minDiff;
        } catch (e) {
          return false;
        }
    };

  // derived validation flag used to enable/disable the Confirm button
  const datesValid = isDatesValid();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('order_resume');
      if (raw) {
        const data = JSON.parse(raw);
        setResume(data);
        // try to load loan dates from backend if loanId present
        (async () => {
          try {
            const loanId = data.loanId || sessionStorage.getItem('order_loan_id');
            if (loanId) {
              const r = await api.get(`/api/loan/${loanId}`);
              const loan = r.data;
              if (loan) {
                if (loan.initDate) setInitDate(loan.initDate.slice(0,10));
                if (loan.returnDate) setReturnDate(loan.returnDate.slice(0,10));
                // fetch total from backend to mirror read-only summary behaviour
                try {
                  const t = await api.get(`/api/loantool/total/${loanId}`);
                  setTotal(Number(t.data || 0));
                } catch (e) {
                  setTotal(0);
                }
                return;
              }
            }
          } catch (e) {
            console.warn('Could not fetch loan dates, falling back to defaults', e?.response?.data || e.message || e);
          }
          // sensible defaults for dates if loan fetch failed
          const today = new Date();
          const iso = d => d.toISOString().slice(0,10);
          const init = iso(today);
          setInitDate(init);
          const plus1 = new Date(today.getTime() + 1*24*60*60*1000);
          setReturnDate(iso(plus1));
        })();
      }
    } catch (e) {
      console.warn('Could not read resume data', e);
    }
  }, []);

  const calcTotal = () => {
    if (total && Number(total) > 0) return Number(total);
    if (!resume || !Array.isArray(resume.items)) return 0;
    return resume.items.reduce((s,it) => s + (Number(it.price || 0) * Number(it.qty || 1)), 0);
  };

  const confirmAndCreate = async () => {
    if (!resume || !resume.client || !resume.items || resume.items.length === 0) {
      setAlert({ severity: 'error', message: 'No hay datos del pedido.' });
      return;
    }
    if (!initDate || !returnDate) { setAlert({ severity: 'error', message: 'Selecciona las fechas.'}); return; }

    // validate dates: initDate must be today and returnDate at least one day after initDate
    const dInit = new Date(initDate);
    const dReturn = new Date(returnDate);
    const diffMs = dReturn.getTime() - dInit.getTime();
    const minDiff = 24 * 60 * 60 * 1000; // 1 day
    if (diffMs < minDiff) {
      setAlert({ severity: 'error', message: 'La fecha de devolución debe ser al menos 1 día después de la fecha inicial.'});
      return;
    }
    
      // final validation: ensure dates are valid before sending
      if (!isDatesValid()) {
        setAlert({ severity: 'error', message: 'Fechas inválidas. La fecha inicial debe ser hoy y la devolución al menos 1 día después.'});
        return;
      }

    // Pre-check: verify the client does not already have active loans for these tools
    try {
      const clientId = resume.client.id;
      const loansResp = await api.get(`/api/loan/user/${clientId}`);
      const loans = loansResp.data || [];
      const conflicts = [];
      for (const loan of loans) {
        // get all loan-tool relations for this loan
        const lxtResp = await api.get(`/api/loantool/loan/${loan.id}`);
        const lxts = lxtResp.data || [];
        for (const lxt of lxts) {
          // tool object may be nested under idTool
          const existingToolId = lxt.idTool?.id || lxt.idTool;
          // consider tool active only if it was actually lent (PRESTADA)
          const active = (lxt.toolActivity === 'PRESTADA');
          if (active) {
            // check against resume items
            const matched = resume.items.find(it => Number(it.id) === Number(existingToolId));
            if (matched) {
              conflicts.push(matched.name || `herramienta ${existingToolId}`);
            }
          }
        }
      }

      if (conflicts.length > 0) {
        setAlert({ severity: 'error', message: `El cliente ya tiene préstamos activos para: ${[...new Set(conflicts)].join(', ')}.` });
        return;
      }
    } catch (e) {
      // if the pre-check fails for some reason, log it but continue to attempt creation
      console.warn('Pre-check failed, proceeding to creation. Error:', e?.response?.data || e.message || e);
    }

    setCreating(true);
    try {
      const employeeResp = await api.get('/api/user/me');
      const employeeId = employeeResp.data?.id;
      if (!employeeId) throw new Error('No se pudo obtener el id del empleado logueado');

      // loanId should be present in resume (created earlier in OrdersCreateClient)
      let loanId = resume.loanId || sessionStorage.getItem('order_loan_id');
      if (!loanId) throw new Error('No se encontró el pedido asociado. Vuelve al paso anterior y crea el pedido con fechas.');

      // Loan already created with dates in the first step; no need to update dates here.

      // collect loanX ids for all items; if some items miss loanXId, create them now
      const loanXIds = [];
      for (const it of resume.items) {
        if (it.loanXId) {
          loanXIds.push(it.loanXId);
          continue;
        }
        // create LoanXTools for this tool
        try {
          const payload = { loanId: loanId, toolId: Number(it.id) };
          console.log('Creating LoanXTools for', payload);
          // backend expects path parameters: /api/loantool/create/{loanId}/{toolId}
          const r = await api.post(`/api/loantool/create/${loanId}/${Number(it.id)}`);
          if (r.data && r.data.id) loanXIds.push(r.data.id);
        } catch (e) {
          const status = e?.response?.status;
          const data = e?.response?.data;
          console.error('Could not create loanX for item', it, 'status=', status, 'data=', data, e?.message || e);
          const serverMsg = data && (data.error || data.message) ? (data.error || data.message) : (e?.message || 'No se pudo registrar la herramienta en el servidor.');
          setAlert({ severity: 'error', message: `No se pudo registrar la herramienta ${it.name}: ${serverMsg}` });
          setCreating(false);
          return;
        }
      }

      if (loanXIds.length === 0) {
        setAlert({ severity: 'error', message: 'No hay items válidos para prestar.' });
        setCreating(false);
        return;
      }

  // call batch give endpoint to mark all as PRESTADA in one transaction
  // backend exposes /api/loantool/give/all/user/{idUser}
  await api.post(`/api/loantool/give/all/user/${employeeId}`, loanXIds);

      // success: clear resume and selected client and navigate to orders list
      sessionStorage.removeItem('order_resume');
      sessionStorage.removeItem('order_selected_client');
      sessionStorage.removeItem('order_loan_id');
  setAlert({ severity: 'success', message: 'Pedido creado y herramientas prestadas correctamente' });
  // give user time to read the success message before redirecting
  setTimeout(() => { window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }, 3000);
    } catch (e) {
      console.error('Error creating/processing order', e?.response?.data || e.message || e);
      const backendMsg = e?.response?.data && (e.response.data.message || e.response.data.error || e.response.data);
      setAlert({ severity: 'error', message: backendMsg || (e.message || 'Error al crear el pedido.') });
    } finally {
      setCreating(false);
    }
  };

  if (!resume) return (
    <div className="bg-gray-50 min-h-screen">
      <NavBar />
      {alert && <TransitionAlert alert={alert} onClose={() => setAlert(null)} />}
      <main className="px-6" style={{ paddingTop: 30 }}>
        <div className="max-w-4xl mx-auto">No hay datos del pedido. Vuelve y selecciona cliente/herramientas.</div>
      </main>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <NavBar />
      {alert && <TransitionAlert alert={alert} onClose={() => setAlert(null)} />}
      <main className="px-6" style={{ paddingTop: 30 }}>
        <div className="max-w-4xl mx-auto">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <h2 style={{ margin: 0 }}>Resumen del Pedido</h2>
              <p style={{ margin: '4px 0 0', color: '#4b5563' }}>Revisa los datos antes de confirmar el pedido.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <BackButton onClick={() => {
                // volver al paso anterior del flujo de creación de pedido
                window.history.pushState({}, '', '/admin/orders/create/tools');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }} />
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
            <section style={{ flex: '0 0 320px', background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e6e6e6' }}>
              <h4>Cliente</h4>
              <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 800 }}>{resume.client.name ? `${resume.client.name} ${resume.client.lastName || ''}` : (resume.client.username || resume.client.email)}</div>
                <div style={{ marginTop: 4, fontSize: 16, color: '#374151' }}>{resume.client.username || resume.client.email}</div>
                {resume.client.rut && <div style={{ marginTop: 4, fontSize: 16 }}>RUT: {resume.client.rut}</div>}
              </div>
            </section>

            <section style={{ flex: 1, background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e6e6e6' }}>
              <h4>Items</h4>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {resume.items.map(it => (
                  <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderRadius: 6, background: '#fafafa' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <img src={it.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80'} alt={it.name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6 }} />
                      <div>
                        <div style={{ fontWeight: 700 }}>{it.name}</div>
                        <div style={{ color: '#64748b' }}>Cantidad: {it.qty}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700 }}>${(Number(it.price || 0) * Number(it.qty || 1)).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#334155' }}>Total</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>${calcTotal().toLocaleString()}</div>
              </div>

              <div style={{ marginTop: 16 }}>
                <label>Fecha inicio: <input type="date" value={initDate} min={initDate} disabled /></label>
                <label style={{ marginLeft: 12 }}>Fecha retorno: <input type="date" value={returnDate} min={(() => {
                    try { const d = new Date(initDate); d.setDate(d.getDate() + 1); return d.toISOString().slice(0,10); } catch(e) { return '' }
                  })()} disabled /></label>
                {dateError && <div style={{ color: '#b91c1c', marginTop: 6 }}>{dateError}</div>}
              </div>

              <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="primary-cta" onClick={confirmAndCreate} disabled={creating || !datesValid}>{creating ? 'Creando...' : 'Confirmar pedido'}</button>
              </div>
            </section>
          </div>

          {/* alert moved to top (below NavBar) */}
        </div>
      </main>
    </div>
  );
};

export default ResumeLoan;
