import React, { useState, useEffect } from 'react';
import api from '../../services/http-common';
import '../Stock/ModalAddStockTool.css';
import ModalAddToolState from './ModalAddToolState';

const ModalToolStatesList = ({ open, onClose }) => {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchStates = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tool-states');
      setStates(response.data);
    } catch (error) {
      console.error("Error fetching tool states", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchStates();
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="mas-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
        <div className="mas-modal" style={{ width: '500px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <button className="mas-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
          <h3 className="mas-title">Estados de Herramientas</h3>
          
          <div className="mas-content" style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
            {loading ? (
              <p>Cargando estados...</p>
            ) : states.length > 0 ? (
              <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                {states.map((state) => (
                  <li key={state.id} style={{ marginBottom: '8px', fontSize: '16px' }}>
                    {state.state}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontStyle: 'italic', color: '#666' }}>
                Aún no se han registrado estados para las herramientas
              </p>
            )}
          </div>

          <div className="mas-actions" style={{ justifyContent: 'center' }}>
            <button 
              className="mas-btn mas-confirm" 
              onClick={() => setShowAddModal(true)}
              style={{ width: '100%' }}
            >
              Añadir nuevo estado al sistema
            </button>
          </div>
        </div>
      </div>

      <ModalAddToolState 
        open={showAddModal} 
        onClose={() => setShowAddModal(false)}
        onAdded={fetchStates}
      />
    </>
  );
};

export default ModalToolStatesList;
