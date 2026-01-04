import React from 'react';
import { Link } from 'react-router-dom';
import NavBar from '../components/Layout/NavBar';

const OrdersIndex = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <NavBar />
      <main style={{ paddingTop: 30 }} className="px-6">
        <div className="max-w-6xl mx-auto big-page" style={{ textAlign: 'center' }}>
          <h2>Administración — Pedidos</h2>
          <p>Interfaz básica para crear/devolver pedidos.</p>

          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'center', gap: 16 }}>
            <Link to="/admin/orders/create" className="primary-cta large" style={{ textDecoration: 'none', color: '#fff', display: 'inline-flex', alignItems: 'center' }}>
              Crear Pedido
            </Link>
            <Link to="/loans" className="primary-cta large" style={{ textDecoration: 'none', color: '#fff', display: 'inline-flex', alignItems: 'center' }}>
              Ver todos los pedidos
            </Link>
            <Link to="/admin/returns" className="primary-cta large" style={{ textDecoration: 'none', color: '#fff', display: 'inline-flex', alignItems: 'center' }}>
              Devolver Pedido
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrdersIndex;
