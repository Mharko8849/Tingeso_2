import React, { useEffect, useState } from 'react';
import NavBar from '../components/Layout/NavBar';
import BackButton from '../components/Common/BackButton';
import api from '../services/http-common';
import { useKeycloak } from '@react-keycloak/web';
import { getUser } from '../services/auth';
import Badge from '../components/Badges/Badge';
import './ToolDetail.css';
import ModalAddStockTool from '../components/Stock/ModalAddStockTool';
import ModalAddNewTool from '../components/Stock/ModalAddNewTool';
import ModalEditTool from '../components/Stock/ModalEditTool';
import { useAlert } from '../components/Alerts/AlertContext';

const ToolDetail = (props) => {
  const id = props?.id;

  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [invEntries, setInvEntries] = useState([]);
  const [stockSummary, setStockSummary] = useState({ DISPONIBLE: 0, PRESTADA: 0, EN_REPARACION: 0, DADA_DE_BAJA: 0 });
  const [showAddStock, setShowAddStock] = useState(false);
  const [showAddNewTool, setShowAddNewTool] = useState(false);
  const [showEditTool, setShowEditTool] = useState(false);

  const { keycloak, initialized } = useKeycloak();
  const user = getUser();
  const { showAlert } = useAlert();

  let rolesRaw = [];
  if (initialized && keycloak.authenticated && keycloak.tokenParsed && keycloak.tokenParsed.realm_access) {
    rolesRaw = keycloak.tokenParsed.realm_access.roles || [];
  } else if (user && user.realm_access && Array.isArray(user.realm_access.roles)) {
    rolesRaw = user.realm_access.roles;
  }

  const roles = rolesRaw.map((r) => String(r).toUpperCase());
  const isInternalUser =
    roles.includes('EMPLOYEE') || roles.includes('ADMIN') || roles.includes('SUPERADMIN');
  const canEdit = isInternalUser && (roles.includes('ADMIN') || roles.includes('SUPERADMIN'));
  const canEditFine = canEdit;

  const fetchTool = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // There is no GET /tools/{id}. Use inventory filter to fetch a tool by id.
      const res = await api.get('/inventory/filter', { params: { idTool: id } });
      const arr = res.data || [];
      // Backend returns InventoryFull. The tool details are in 'toolFull' (or fallback to 'idTool' for legacy)
      const t = (arr[0] && (arr[0].toolFull || arr[0].idTool)) || {};

      if (!t || !t.id) {
        setTool(null);
        setError('Herramienta no encontrada');
        return;
      }

      // Compute stock by state from inventory entries of this tool
      const summary = { DISPONIBLE: 0, PRESTADA: 0, EN_REPARACION: 0, DADA_DE_BAJA: 0 };
      for (const e of arr) {
        // Backend uses toolStateName
        const st = String(e.toolStateName || e.toolState || '').toUpperCase();
        const qty = Number(e.stockTool) || 0;
        if (summary.hasOwnProperty(st)) summary[st] += qty;
      }

      const mapped = {
        id: t.id,
        name: t.toolName ?? t.name ?? '',
        // Price is nested in amounts
        price: t.amounts?.priceRent ?? (typeof t.priceRent === 'number' ? t.priceRent : (typeof t.price === 'number' ? t.price : null)),
        // Category name is in categoryName
        category: t.categoryName ?? t.category ?? '',
        description: '',
        specs: [],
        image: t.imageUrl ? `/images/${t.imageUrl}` : '',
        // Repo cost and fine are in amounts
        repoCost: t.amounts?.priceRepo ?? (typeof t.repoCost === 'number' ? t.repoCost : null),
        priceFineAtDate: t.amounts?.priceFine ?? (typeof t.priceFineAtDate === 'number' ? t.priceFineAtDate : null),
      };

      setTool(mapped);
      setInvEntries(arr);
      setStockSummary(summary);
      setError(null);
    } catch (err) {
      console.error('Failed to load tool entity', err);
      setError('No se pudo cargar la herramienta');
      setTool(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const priceLabel = tool && typeof tool.price === 'number' ? `$${tool.price.toLocaleString()}` : '';
  const categoryLabel = tool ? tool.category || '' : '';
  const fineValue = tool ? (typeof tool.priceFineAtDate === 'number' ? tool.priceFineAtDate : null) : null;
  const fineLabel = typeof fineValue === 'number' ? `$${fineValue.toLocaleString()}` : '—';

  const handleToolUpdated = (updated) => {
    if (!updated) {
      fetchTool();
      return;
    }
    const mapped = {
      ...tool,
      name: updated.toolName ?? updated.name ?? tool?.name,
      price: updated.amounts?.priceRent ?? (typeof updated.priceRent === 'number' ? updated.priceRent : (typeof updated.price === 'number' ? updated.price : tool?.price)),
      category: updated.categoryName ?? updated.category ?? tool?.category,
      repoCost: updated.amounts?.priceRepo ?? (typeof updated.repoCost === 'number' ? updated.repoCost : tool?.repoCost),
      priceFineAtDate: updated.amounts?.priceFine ?? (typeof updated.priceFineAtDate === 'number' ? updated.priceFineAtDate : tool?.priceFineAtDate),
      image: updated.imageUrl ? `/images/${updated.imageUrl}` : tool?.image,
    };
    setTool(mapped);
    showAlert('Se ha guardado el cambio correctamente', 'success');
  };

  const DEFAULT_IMAGE = '/images/NoImage.png';

  return (
    <div className="td-page bg-gray-50 min-h-screen">
      <NavBar />

      <main className="td-main px-6 pb-12" style={{ paddingTop: 30 }}>
        <div className="td-container flex items-center justify-center w-full py-8 min-h-[calc(100vh-70px)]">
          {loading && <p>Cargando herramienta...</p>}
          {!loading && error && <p style={{ color: 'red' }}>{error}</p>}

          {tool && (
            <div className="td-grid w-full max-w-5xl items-center gap-20N">
              <div className="td-image-card">
                <div className="td-image-wrap">
                  <img
                    src={tool.image || DEFAULT_IMAGE}
                    alt={tool.name || 'Herramienta'}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_IMAGE;
                    }}
                  />
                </div>
              </div>

              <div className="td-side">
                <div className="td-header">
                  <h1 className="td-title m-0">{tool.name}</h1>
                  <BackButton onClick={() => window.history.back()} />
                </div>

                <div className="td-price">{priceLabel}</div>


                <div className="td-specs">
                  <h4 style={{ margin: 0 }}>Características</h4>

                  <ul>
                    {tool.specs && tool.specs.map((s, i) => (
                      <li key={i}><strong>{s[0]}:</strong> {s[1]}</li>
                    ))}

                    {categoryLabel && (
                      <li>
                        <strong>Categoría:</strong> {categoryLabel}
                      </li>
                    )}

                    {typeof tool.repoCost === 'number' && (
                      <li>
                        <strong>Precio de reposición:</strong> {`$${tool.repoCost.toLocaleString()}`}
                      </li>
                    )}

                    {canEditFine && (
                      <li>
                        <strong>Tarifa multa por día:</strong> {fineLabel}
                      </li>
                    )}
                  </ul>
                </div>

                <div className="td-stock">
                  <h4 className="mt-3 mb-1 text-lg font-semibold">Stock</h4>
                  <div className="td-stock-list">
                    <div className="td-stock-row">
                      <Badge variant="green" />
                      <span className="ml-2">Disponible:</span>
                      <span className="ml-2 font-semibold">
                        {(stockSummary.DISPONIBLE || 0).toLocaleString()}
                      </span>
                    </div>

                    {isInternalUser && (
                      <>
                        <div className="td-stock-row">
                          <Badge variant="blue" />
                          <span className="ml-2">Prestada:</span>
                          <span className="ml-2 font-semibold">
                            {(stockSummary.PRESTADA || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="td-stock-row">
                          <Badge variant="yellow" />
                          <span className="ml-2">Reparación:</span>
                          <span className="ml-2 font-semibold">
                            {(stockSummary.EN_REPARACION || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="td-stock-row">
                          <Badge variant="red" />
                          <span className="ml-2">Dada de Baja:</span>
                          <span className="ml-2 font-semibold">
                            {(stockSummary.DADA_DE_BAJA || 0).toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center td-actions">
                  {canEdit && (
                    <>
                      <button onClick={() => setShowAddStock(true)} type="button" className="td-quote inline-flex items-center gap-5 px-4 py-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <span>Añadir Stock</span>
                      </button>

                      <button onClick={() => setShowEditTool(true)} type="button" className="td-quote inline-flex items-center gap-5 px-4 py-2">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="#fff" /><path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#fff" /></svg>
                        <span>Editar Producto</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <ModalAddStockTool open={showAddStock} onClose={() => setShowAddStock(false)} toolId={id} onAdded={() => fetchTool()} />
        <ModalAddNewTool open={showAddNewTool} onClose={() => setShowAddNewTool(false)} onAdded={() => fetchTool()} />
        <ModalEditTool
          open={showEditTool}
          onClose={() => setShowEditTool(false)}
          tool={tool}
          onUpdated={handleToolUpdated}
        />
      </main>
    </div>
  );
};

export default ToolDetail;

