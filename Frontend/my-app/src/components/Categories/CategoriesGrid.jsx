import React from 'react';
import './CategoriesGrid.css';

const CategoryCard = ({ cat }) => (
  <a className="cat-card" href={cat.href}>
    <div className="cat-left">
      <h4 className="cat-title">{cat.title}</h4>
      <p className="cat-sub">{cat.subtitle}</p>
      <div className="cat-cta">
        <button className="cat-btn">Ver ofertas</button>
      </div>
    </div>
    <div className="cat-right" style={{ borderLeft: `6px solid ${cat.color || '#2B7FFF'}`, backgroundColor: '#fff' }}>
      <img src={cat.image} alt={cat.title} />
    </div>
  </a>
);

const CategoriesGrid = ({ categories = [] }) => {
  return (
    <section className="categories-section max-w-6xl mx-auto my-8">
      <h2 className="section-title">Categorías populares</h2>
      <div className="categories-grid">
        {categories.map((c) => (
          <CategoryCard key={c.id} cat={c} />
        ))}
      </div>
    </section>
  );
};

export default CategoriesGrid;
