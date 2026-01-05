import React, { useState, useEffect } from 'react';
import api from '../../services/http-common';
import './ModalAddStockTool.css';

const ModalAddNewTool = ({ open, onClose, onAdded }) => {
  const [form, setForm] = useState({ toolName: '', category: '', repoCost: '', priceRent: '', priceFineAtDate: '' });
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categoriesList, setCategoriesList] = useState([]);

  useEffect(() => {
    if (open) {
      const fetchCategories = async () => {
        try {
          const response = await api.get('/inventory/category');
          setCategoriesList(response.data.map(c => c.name));
        } catch (error) {
          console.error('Error fetching categories:', error);
        }
      };
      fetchCategories();
    }
  }, [open]);

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

      const me = await api.get('/users/me');
      const userId = me.data?.id;
      if (!userId) throw new Error('Usuario no identificado');

      // 1. Upload image if selected
      let imageUrl = null;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadResp = await api.post('/tools/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = uploadResp.data.filename;
      }

      // 2. Resolve category ID
      let categoryId = null;
      try {
        const catsResp = await api.get('/inventory/category');
        const catObj = catsResp.data.find(c => c.name === form.category);
        if (catObj) {
            categoryId = catObj.id;
        } else {
            console.warn("Category name not found in backend list:", form.category);
        }
      } catch (err) {
        console.warn("Could not fetch categories", err);
      }
      
      if (!categoryId) {
          throw new Error(`No se pudo resolver el ID para la categoría: ${form.category}. Asegúrese de que las categorías existan en el backend.`);
      }

      // 3. Create Tool
      const toolInput = {
        tool: {
          toolName: String(form.toolName).trim(),
          categoryId: categoryId,
          imageUrl: imageUrl,
        },
        amounts: {
          repoCost: Math.round(repoCost),
          priceRent: Math.round(priceRent),
          priceFineAtDate: Math.round(priceFineAtDate),
        },
      };

      await api.post(`/tools?userId=${userId}`, toolInput);

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
    <div className="mas-backdrop" onClick={onClose}>
      <div className="mas-modal mas-modal-large" style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
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
            {categoriesList.map((cat) => (
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
