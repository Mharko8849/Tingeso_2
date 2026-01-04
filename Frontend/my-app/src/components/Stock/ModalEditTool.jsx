import React, { useState, useEffect } from 'react';
import api from '../../services/http-common';
import './ModalAddStockTool.css';

const ModalEditTool = ({ open, onClose, tool, onUpdated }) => {
  const [form, setForm] = useState({ toolName: '', category: '', repoCost: '', priceRent: '', priceFineAtDate: '' });
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (tool) {
      setForm({
        toolName: tool.toolName || tool.name || '',
        category: tool.categoryId || tool.idCategory || '',
        repoCost: tool.amounts?.repoCost || tool.repoCost || '',
        priceRent: tool.amounts?.priceRent || tool.priceRent || '',
        priceFineAtDate: tool.amounts?.priceFineAtDate || tool.priceFineAtDate || '',
      });
    }
  }, [tool]);

  useEffect(() => {
    if (open) {
      const fetchCategories = async () => {
        try {
          const res = await api.get('/category');
          setCategories(res.data || []);
        } catch (e) {
          console.error('Failed to fetch categories', e);
        }
      };
      fetchCategories();
    }
  }, [open]);

  if (!open || !tool) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!form.toolName || String(form.toolName).trim().length === 0) throw new Error('Nombre de herramienta requerido');
      const repoCost = Number(form.repoCost) || 0;
      const priceRent = Number(form.priceRent) || 0;
      const priceFineAtDate = Number(form.priceFineAtDate) || 0;

      const me = await api.get('/users/me');
      const userId = me.data?.id;
      if (!userId) throw new Error('Usuario no identificado');

      let imageFilename = tool.imageUrl; // Keep existing if no new file

      // Upload new image if provided
      if (file) {
        const imageFormData = new FormData();
        imageFormData.append('file', file);

        const uploadRes = await api.post('/tools/upload-image', imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        imageFilename = uploadRes.data?.filename;
      }

      const toolPayload = {
        tool: {
          toolName: String(form.toolName).trim(),
          categoryId: Number(form.category) || null,
          imageUrl: imageFilename || null,
        },
        amounts: {
          repoCost: Math.round(repoCost),
          priceRent: Math.round(priceRent),
          priceFineAtDate: Math.round(priceFineAtDate),
        }
      };

      const toolId = tool.id || tool.idTool;
      // Send JSON
      const response = await api.put(`/tools/${toolId}`, toolPayload, {
        params: { userId }
      });

      if (onUpdated) onUpdated(response.data);
      onClose();
    } catch (e) {
      console.warn('Failed to edit tool', e);
      const msg = e?.response?.data || e?.message || 'No se pudo actualizar la herramienta';
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
        <h3 className="mas-title">Editar herramienta</h3>
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
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
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
                  : 'Haz clic para seleccionar o arrastra y suelta una nueva imagen aquí'}
              </div>
            </div>
          </div>

          {error && <div className="mas-error">{error}</div>}
        </div>

        <div className="mas-actions">
          <button className="mas-btn mas-confirm" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button className="mas-btn mas-cancel" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEditTool;
