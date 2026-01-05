import React, { useState } from "react";
import "../Tools/ToolDropdown.css";
import { cancelOrderDraft } from "../../services/orderDraft";
import ModalAddCategory from "../Categories/ModalAddCategory";
import ModalToolStatesList from "../Tools/ModalToolStatesList";

const AdminDropdown = ({ isAdminOrSuper }) => {
  const [open, setOpen] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStatesModal, setShowStatesModal] = useState(false);

  const toggleMenu = () => setOpen(!open);
  const closeMenu = () => setOpen(false);

  const navigate = async (path) => {
    await cancelOrderDraft();
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
    closeMenu();
  };

  const handleOpenCategoryModal = () => {
    closeMenu();
    setShowCategoryModal(true);
  };

  const handleOpenStatesModal = () => {
    closeMenu();
    setShowStatesModal(true);
  };

  return (
    <>
      <button className="tool-btn" onClick={toggleMenu}>
        Administración
      </button>

      {open && (
        <div className="tool-overlay" onClick={closeMenu}>
          <div className="tool-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeMenu}>✕</button>

            <div className="tool-grid">
              <div className="tool-section">
                <h4><strong>Pedidos</strong></h4>
                <button type="button" className="link-as-anchor" onClick={() => navigate("/admin/orders/create")}>Crear un pedido</button>
                <button type="button" className="link-as-anchor" onClick={() => navigate("/loans")}>Ver todos los pedidos</button>
                <button type="button" className="link-as-anchor" onClick={() => navigate("/admin/returns")}>Devolver y/o pagar un pedido</button>
              </div>
              <div className="tool-section">
                <h4><strong>Administración</strong></h4>
                {isAdminOrSuper && <button type="button" className="link-as-anchor" onClick={() => navigate("/employees")}>Empleados</button>}
                {isAdminOrSuper && <button type="button" className="link-as-anchor" onClick={() => navigate("/clients")}>Clientes</button>}
                <button type="button" className="link-as-anchor" onClick={() => navigate("/admin/kardex")}>Kardex</button>
              </div>
              <div className="tool-section">
                <h4><strong>Herramientas</strong></h4>
                <button type="button" className="link-as-anchor" onClick={() => navigate("/inventory")}>Ver inventario</button>
                {isAdminOrSuper && (
                  <>
                    <button type="button" className="link-as-anchor" onClick={handleOpenCategoryModal}>
                      Crear nueva Categoría
                    </button>
                    <button type="button" className="link-as-anchor" onClick={handleOpenStatesModal}>
                      Añadir nuevo estado de herramientas
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ModalAddCategory 
        open={showCategoryModal} 
        onClose={() => setShowCategoryModal(false)} 
      />
      
      <ModalToolStatesList
        open={showStatesModal}
        onClose={() => setShowStatesModal(false)}
      />
    </>
  );
};

export default AdminDropdown;
