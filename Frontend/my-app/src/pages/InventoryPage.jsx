import React, { useEffect, useState, useRef } from "react";
import NavBar from "../components/Layout/NavBar";
import BackButton from "../components/Common/BackButton";
import CategoryListing from "../components/Categories/CategoryListing";
import ModalAddNewTool from "../components/Stock/ModalAddNewTool";
import api from "../services/http-common";
import { useLocation } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";
import { getUser } from "../services/auth";

const InventoryPage = ({ category = null }) => {
  const location = useLocation();
  // default maxPrice aligns with FiltersSidebar BOUND_MAX
  const [filters, setFilters] = useState(() => {
    const initial = location.state?.initialFilters || {};
    return {
      minPrice: initial.minPrice || 0,
      maxPrice: initial.maxPrice || 500000,
      sort: initial.sort || '',
      asc: initial.sort === 'price_asc',
      desc: initial.sort === 'price_desc',
      recent: initial.sort === 'newest',
      popular: initial.sort === 'popular',
    };
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddNewTool, setShowAddNewTool] = useState(false);

  // determine roles to show add button only to admins
  const { keycloak, initialized } = useKeycloak();
  const user = getUser();
  
  let rolesRaw = [];
  if (initialized && keycloak.authenticated && keycloak.tokenParsed && keycloak.tokenParsed.realm_access) {
    rolesRaw = keycloak.tokenParsed.realm_access.roles || [];
  } else if (user && user.realm_access && Array.isArray(user.realm_access.roles)) {
    rolesRaw = user.realm_access.roles;
  }

  const roles = rolesRaw.map((r) => String(r).toUpperCase());
  const canEdit = roles.includes("ADMIN") || roles.includes("SUPERADMIN");

  const fetchProducts = async (appliedFilters) => {
    setLoading(true);
    try {
      // Request inventory from backend, letting backend apply category,
      // price and sort filters. Backend will perform case-insensitive
      // substring match on category when provided.
        // Use axios instance so interceptor adds Authorization header automatically
  const qs = {};
  if (category) qs.category = category;
  if (appliedFilters?.minPrice) qs.minPrice = appliedFilters.minPrice;
  if (appliedFilters?.maxPrice) qs.maxPrice = appliedFilters.maxPrice;
  if (appliedFilters?.asc) qs.asc = true;
  if (appliedFilters?.desc) qs.desc = true;
  if (appliedFilters?.recent) qs.recent = true;
  // if (appliedFilters?.popular) qs.popular = true; // Removed as backend doesn't support it

  const resp = await api.get('/inventory/filter', { params: qs });
  const inv = resp.data;
  // Debug: log server response so we can inspect its shape in the browser console
  console.debug('[InventoryPage] /inventory/filter response:', inv);

      // Group inventory entries by tool id and compute available stock
      const map = new Map();
      (inv || []).forEach((entry) => {
        const t = entry.idTool || {};
        const tid = t.id;
        if (!map.has(tid)) {
          map.set(tid, {
            id: tid,
            name: t.toolName || t.name || '—',
            price: t.priceRent || t.price || 0,
            category: t.category || category,
            image: t.imageUrl ? `/images/${t.imageUrl}` : 'http://localhost:8090/images/NoImage.png',
            stock: 0,
          });
        }
        const item = map.get(tid);
        // sum only available stock entries
        if (entry.toolState === 'DISPONIBLE') {
          item.stock = (item.stock || 0) + (entry.stockTool || 0);
        }
      });

      let data = Array.from(map.values());

      // Backend already applied category/minPrice/maxPrice/sort. Keep
      // the insertion order coming from the backend and only display
      // unique tools by first occurrence.

      // Client-side sorting for "popular" if requested
      if (appliedFilters?.popular) {
        try {
          // Fetch ranking data to know which tools are popular
          const rankingResp = await api.get("/kardex/ranking");
          const rankingList = rankingResp.data; // List of { tool: {...}, totalLoans: X }
          
          // Create a map of toolId -> totalLoans for quick lookup
          const popularityMap = new Map();
          rankingList.forEach(item => {
            if (item.tool && item.tool.id) {
              popularityMap.set(item.tool.id, item.totalLoans);
            }
          });

          // Sort the data array based on popularity (descending)
          data.sort((a, b) => {
            const popA = popularityMap.get(a.id) || 0;
            const popB = popularityMap.get(b.id) || 0;
            return popB - popA;
          });
        } catch (error) {
          console.error("Error fetching ranking for sorting:", error);
        }
      }

      setProducts(data || []);
    } catch (err) {
      console.warn("Could not fetch products", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    fetchProducts(newFilters);
  };

  // no extra top offset here — layout is handled by page containers

  const formatTitle = (s) =>
    String(s)
      .split(/[-_\s]+/)
      .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");

  return (
    <div className="bg-gray-50 min-h-screen">
      <NavBar />

      {/* reduce top spacing so page content sits closer to the fixed NavBar (navbar height = 70px) */}
      <main className="px-6" style={{ paddingTop: '30px', paddingBottom: '24px' }}>
        <div className="max-w-6xl mx-auto">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: '0 0 0 20px', fontSize: '1.5rem', fontWeight: 700 }}>{formatTitle(category || 'inventario')}</h2>
            <div style={{ marginRight: 8 }}>
              <BackButton onClick={() => window.history.back()} />
            </div>
          </div>

          {loading ? <p>Cargando productos...</p> : (
            <CategoryListing
              tools={products}
              onApplyFilters={applyFilters}
              initialFilters={filters}
              sidebarFooter={canEdit ? (
                <div style={{ padding: '12px 8px' }}>
                  <button className="td-quote" onClick={() => setShowAddNewTool(true)} style={{ width: '100%' }}>
                    Añadir Herramienta
                  </button>
                </div>
              ) : null}
            />
          )}
        </div>
      </main>
      <ModalAddNewTool open={showAddNewTool} onClose={() => setShowAddNewTool(false)} onAdded={() => fetchProducts(filters)} />
    </div>
  );
};

export default InventoryPage;
