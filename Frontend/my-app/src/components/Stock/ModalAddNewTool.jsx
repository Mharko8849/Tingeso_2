import React, { useState } from 'react';
import api from '../../services/http-common';
import { TOOL_CATEGORIES } from '../../constants/toolCategories';
import './ModalAddStockTool.css';

const ModalAddNewTool = ({ open, onClose, onAdded }) => {
  const [form, setForm] = useState({ toolName: '', category: '', repoCost: '', priceRent: '', priceFineAtDate: '' });
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      // validate
      if (!form.toolName || String(form.toolName).trim().length === 0) throw new Error('Nombre de herramienta requerido');
      if (!form.category) throw new Error('Categoría requerida');
      const repoCost = Number(form.repoCost) || 0;
      const priceRent = Number(form.priceRent) || 0;
      const priceFineAtDate = Number(form.priceFineAtDate) || 0;

      const me = await api.get('/api/user/me');
      const userId = me.data?.id;
      if (!userId) throw new Error('Usuario no identificado');

      // construir objeto tool que coincida con ToolEntity en backend
      const tool = {
        toolName: String(form.toolName).trim(),
        category: form.category || '',
        repoCost: Math.round(repoCost),
        priceRent: Math.round(priceRent),
        priceFineAtDate: Math.round(priceFineAtDate),
      };

      // construir FormData multipart con parte "tool" (JSON) + "image"
      const formData = new FormData();
      formData.append('tool', new Blob([JSON.stringify(tool)], { type: 'application/json' }));

      if (file) {
        formData.append('image', file);
      }

      await api.post(`/api/tool/user/${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (onAdded) onAdded();
      onClose();
    } catch (e) {
      console.warn('Failed to add new tool', e);
      const msg = e?.response?.data || e?.message || 'No se pudo crear la herramienta';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (fileObj) => {
    if (!fileObj) {
      setFile(null);
      return;
    }
    setFile(fileObj);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files && e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      handleFileSelect(droppedFile);
    }
  };

  return (
    <div className="mas-backdrop">
      <div className="mas-modal mas-modal-large" style={{ position: 'relative' }}>
        <button className="mas-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <h3 className="mas-title">Añadir nueva herramienta</h3>
        <div className="mas-content">
        <div className="mas-row">
          <label>Nombre</label>
          <input value={form.toolName} onChange={(e) => setForm((s) => ({ ...s, toolName: e.target.value }))} />
        </div>

        <div className="mas-row">
          <label>Categoría</label>
          <select 
            value={form.category} 
            onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">Seleccionar categoría</option>
            {TOOL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="mas-row">
          <label>Precio reposición</label>
          <input type="number" value={form.repoCost} onChange={(e) => setForm((s) => ({ ...s, repoCost: e.target.value }))} />
        </div>

        <div className="mas-row">
          <label>Precio arriendo</label>
          <input type="number" value={form.priceRent} onChange={(e) => setForm((s) => ({ ...s, priceRent: e.target.value }))} />
        </div>

        <div className="mas-row">
          <label>Tarifa multa por día</label>
          <input type="number" value={form.priceFineAtDate} onChange={(e) => setForm((s) => ({ ...s, priceFineAtDate: e.target.value }))} />
        </div>

        <div className="mas-row">
          <label>Imagen (opcional)</label>
          <div
            className={`mas-file-wrapper ${isDragging ? 'mas-file-wrapper-dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <label className="mas-file-button">
              Seleccionar archivo
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
              />
            </label>
            <div className="mas-file-name">
              {file
                ? file.name
                : 'Haz clic para seleccionar o arrastra y suelta una imagen aquí'}
            </div>
          </div>
        </div>

        {error && <div className="mas-error">{error}</div>}

        </div>

        <div className="mas-actions">
          <button className="mas-btn mas-confirm" onClick={handleConfirm} disabled={loading}>{loading ? 'Creando...' : 'Añadir'}</button>
          <button className="mas-btn mas-cancel" onClick={onClose} disabled={loading}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default ModalAddNewTool;
