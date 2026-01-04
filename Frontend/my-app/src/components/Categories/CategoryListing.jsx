import React, { useMemo, useState } from 'react';
import './CategoryListing.css';
import FiltersSidebar from '../Filters/FiltersSidebar';
import ToolGrid from '../Tools/ToolGrid';
import PaginationBar from '../Common/PaginationBar';

// Component that composes FiltersSidebar + ToolGrid + pagination + itemsPerPage
const CategoryListing = ({ tools = [], onApplyFilters = () => {}, initialFilters = {}, toolCardProps = {}, sidebarFooter = null }) => {
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const pages = Math.max(1, Math.ceil((tools.length || 0) / itemsPerPage));

  // clamp page when itemsPerPage changes
  const visibleTools = useMemo(() => {
    const p = Math.min(page, pages);
    const start = (p - 1) * itemsPerPage;
    return tools.slice(start, start + itemsPerPage);
  }, [tools, page, itemsPerPage, pages]);

  return (
    <div className="category-listing">
      <aside className="cl-sidebar">
        <FiltersSidebar initial={initialFilters} onApply={(f) => { setPage(1); onApplyFilters(f); }} />
        {sidebarFooter ? <div className="cl-sidebar-footer">{sidebarFooter}</div> : null}
      </aside>

      <div className="cl-main">
        <PaginationBar
          page={page}
          pageSize={itemsPerPage}
          total={tools.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setItemsPerPage(size); setPage(1); }}
          showPageSizeControls={true}
          showSummary={false}
        />

        <div className="cl-grid-wrap">
          <ToolGrid tools={visibleTools} toolCardProps={toolCardProps} />
        </div>

        <PaginationBar
          page={page}
          pageSize={itemsPerPage}
          total={tools.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setItemsPerPage(size); setPage(1); }}
          showPageSizeControls={false}
          showSummary={true}
        />
      </div>
    </div>
  );
};

export default CategoryListing;
