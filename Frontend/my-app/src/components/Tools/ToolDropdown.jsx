import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TOOL_CATEGORIES } from "../../constants/toolCategories";
import "./ToolDropdown.css";

/**
 * ToolDropdown component.
 * Displays a dropdown menu with tool categories for navigation.
 */
const ToolDropdown = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setOpen(!open);
  const closeMenu = () => setOpen(false);

  const handleCategoryClick = (category) => {
    navigate("/inventory", { state: { initialFilters: { category } } });
    closeMenu();
  };

  return (
    <>
      <button className="tool-btn" onClick={toggleMenu}>
        Herramientas
      </button>

      {open && (
        <div className="tool-overlay" onClick={closeMenu}>
          <div
            className="tool-content"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside content
          >
            <button className="close-btn" onClick={closeMenu}>
              ✕
            </button>

            <div className="tool-grid-container">
              <h4>Categorías</h4>
              <div className="tool-categories-grid">
                <a href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(''); }} className="category-item all-categories">
                  Todas
                </a>
                {TOOL_CATEGORIES.map((cat) => (
                  <a 
                    key={cat} 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); handleCategoryClick(cat); }}
                    className="category-item"
                  >
                    {cat}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ToolDropdown;
