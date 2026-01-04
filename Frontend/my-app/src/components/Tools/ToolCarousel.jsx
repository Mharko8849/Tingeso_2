// src/components/ToolCarousel.jsx
import React, { useEffect, useState } from "react";
import ToolCard from "./ToolCard";
import "./ToolCarousel.css";

/**
 * ToolCarousel component.
 * Displays a carousel of ToolCards with autoplay and responsive layout.
 * 
 * Input: props (tools, title, viewMoreUrl, onViewMore, autoplay, autoplayDelay)
 * Output: JSX Element
 */
const ToolCarousel = ({
  tools = [],
  title = "",
  viewMoreUrl = "",
  onViewMore = null,
  autoplay = true,
  autoplayDelay = 3500,
}) => {
  const [page, setPage] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);

  // Navigate to previous page
  const prev = () => {
    if (tools.length === 0) return;
    setPage((p) => (p - 1 + pages) % pages);
  };

  // Navigate to next page
  const next = () => {
    if (tools.length === 0) return;
    setPage((p) => (p + 1) % pages);
  };

  // Navigate to specific page
  const goToPage = (pageIndex) => {
    if (tools.length === 0) return;
    setPage(pageIndex % pages);
  };

  // Responsive adjustment for visibleCount
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w >= 1200) setVisibleCount(4);
      else if (w >= 900) setVisibleCount(3);
      else if (w >= 600) setVisibleCount(2);
      else setVisibleCount(1);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const pages = Math.max(1, Math.ceil((tools.length || 0) / visibleCount));

  // Reset page if it exceeds total pages (e.g. on resize)
  useEffect(() => {
    if (page >= pages) setPage(0);
  }, [visibleCount, pages]);

  const gap = 12; // Must match CSS gap
  const cardFlexBasis = `calc((100% - ${(visibleCount - 1) * gap}px) / ${visibleCount})`;

  // Create pages array
  const pagesArr = [];
  for (let p = 0; p < pages; p++) {
    const start = p * visibleCount;
    pagesArr.push(tools.slice(start, start + visibleCount));
  }

  // Autoplay logic
  const [paused, setPaused] = useState(false);
  const AUTOPLAY_MS = autoplayDelay;

  useEffect(() => {
    if (!autoplay) return;
    if (paused) return;
    if (pages <= 1) return;
    const id = setInterval(() => {
      setPage((p) => (p + 1) % pages);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, pages, autoplay, AUTOPLAY_MS]);

  return (
    <div
      className="tool-carousel container-fluid p-3 bg-light rounded shadow-sm position-relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">{title}</h3>
        {onViewMore ? (
          <button 
            onClick={onViewMore} 
            className="primary-cta"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            Ver más
          </button>
        ) : (
          <a href={viewMoreUrl} className="view-more-btn">Ver más</a>
        )}
      </div>

      {/* Left Arrow */}
      <button onClick={prev} className="carousel-btn left btn btn-light shadow-sm" aria-label="Anterior">
        <span aria-hidden>‹</span>
      </button>

      {/* Carousel Track */}
      <div className="carousel-viewport overflow-hidden">
        <div
          className="carousel-track d-flex"
          style={{ width: `${pages * 100}%`, transform: `translateX(-${page * (100 / pages)}%)` }}
        >
          {pagesArr.map((pageTools, pIdx) => (
            <div className="carousel-page d-flex" key={pIdx} style={{ width: `${100 / pages}%` }}>
              {pageTools.map((tool, idx) => (
                <ToolCard key={`${tool?.id ?? idx}-${idx}`} tool={tool} layout="vertical" style={{ flex: `0 0 ${cardFlexBasis}` }} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Right Arrow */}
      <button onClick={next} className="carousel-btn right btn btn-light shadow-sm" aria-label="Siguiente">
        <span aria-hidden>›</span>
      </button>

      {/* Pagination Dots */}
      <div className="d-flex justify-content-center mt-3">
        {Array.from({ length: pages }).map((_, pIdx) => (
          <button
            key={pIdx}
            className={`dot-btn ${pIdx === page ? "active" : ""}`}
            onClick={() => goToPage(pIdx)}
            aria-label={`Ir a la página ${pIdx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ToolCarousel;
