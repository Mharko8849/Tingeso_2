import React from 'react';

/**
 * Reusable pagination bar with Inventory/CategoryListing aesthetics.
 * - Top usage: typically with showPageSizeControls=true and showSummary=false.
 * - Bottom usage: typically with showPageSizeControls=false and showSummary=true.
 *
 * Input: props (page, pageSize, total, onPageChange, onPageSizeChange, showPageSizeControls, showSummary)
 * Output: JSX Element
 */
const PaginationBar = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  showPageSizeControls = true,
  showSummary = true,
}) => {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (pageSize || 1)));
  const safePage = Math.min(Math.max(1, page || 1), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(total, safePage * pageSize);

  /**
   * Navigates to the specified page.
   * Input: target page number
   * Output: void
   */
  const goTo = (p) => {
    if (!onPageChange) return;
    const next = Math.max(1, Math.min(p, totalPages));
    onPageChange(next);
  };

  return (
    <div
      className="cl-footer"
      style={{
        marginTop: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      {showSummary && (
        <div className="cl-footer-left">
          Mostrando {total === 0 ? 0 : end - start + 1} de {total} resultados
        </div>
      )}
      <div className="cl-footer-right" style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        {showPageSizeControls && (
          <div className="cl-controls-left" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label>Mostrar por página:</label>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange && onPageSizeChange(Number(e.target.value) || 10)}
            >
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={20}>20</option>
              <option value={40}>40</option>
            </select>
          </div>
        )}
        <div className="cl-controls-right">
          <button onClick={() => goTo(1)} disabled={safePage === 1} className="cl-page-small">|&lt;</button>
          <button onClick={() => goTo(safePage - 1)} disabled={safePage === 1} className="cl-page-small">&lt;</button>
          <span className="cl-page-ind-small">{safePage} / {totalPages}</span>
          <button onClick={() => goTo(safePage + 1)} disabled={safePage === totalPages} className="cl-page-small">&gt;</button>
          <button onClick={() => goTo(totalPages)} disabled={safePage === totalPages} className="cl-page-small">&gt;|</button>
        </div>
      </div>
    </div>
  );
};

export default PaginationBar;
