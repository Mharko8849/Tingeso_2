import React, { useEffect, useState } from "react";
import NavBar from "../components/Layout/NavBar";
import ToolCarousel from "../components/Tools/ToolCarousel";
import CategoriesGrid from "../components/Categories/CategoriesGrid";
import api from "../services/http-common";
import { useNavigate } from "react-router-dom";
import { TOOL_CATEGORIES } from "../constants/toolCategories";

const getImageUrl = (imagePath) => {
  if (!imagePath) return "/NoImage.png"; // Fallback image
  if (imagePath.startsWith("http")) return imagePath;
  return `/images/${imagePath}`; 
};

const FALLBACK_CATEGORIES = [
  { 
    title: "Herramientas Eléctricas", 
    image: 'Taladro.png', 
  },
  { 
    title: "Generadores", 
    image: 'Generador.png', 
  },
  { 
    title: "Construcción", 
    image: 'Pala.png', 
  },
  { 
    title: "Seguridad", 
    image: 'SetCascoBotasGuante.png', 
  },
];

const Home = () => {
  const [rankingTools, setRankingTools] = useState([]);
  const [displayCategories, setDisplayCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const response = await api.get("/kardex/ranking");
        // Backend returns a list of maps { tool: {...}, totalLoans: X }
        // ToolCarousel expects an array of tools with properties like name, price, image
        const tools = response.data.map(item => ({
          ...item.tool,
          name: item.tool.toolName || item.tool.name,
          price: item.tool.priceRent || item.tool.price,
          image: getImageUrl(item.tool.imageUrl), // Use helper to resolve URL
          visits: item.totalLoans // Use visits to show loan count
        }));
        setRankingTools(tools);
      } catch (error) {
        console.error("Error ranking tools:", error);
      }
    };

    fetchRanking();
  }, []);

  // Calculate popular categories based on rankingTools
  useEffect(() => {
    // 1. Extract unique categories from ranking
    const rankedCategoryNames = [...new Set(rankingTools.map(t => t.category).filter(Boolean))];
    
    // 2. Build category objects from ranking data (using the first tool's image)
    let finalCats = rankedCategoryNames.map(catName => {
      const tool = rankingTools.find(t => t.category === catName);
      // Check if we have a fallback subtitle for this category, otherwise generic
      const fallback = FALLBACK_CATEGORIES.find(fc => fc.title === catName);
      return {
        title: catName,
        subtitle: fallback ? fallback.subtitle : 'Tendencia en alquiler',
        image: tool ? tool.image : (fallback ? getImageUrl(fallback.image) : '/NoImage.png'),
        href: '#',
        color: '#2B7FFF'
      };
    });

    // 3. Fill with fallback categories if we have less than 4
    if (finalCats.length < 4) {
      for (const fallback of FALLBACK_CATEGORIES) {
        if (finalCats.length >= 4) break;
        // Avoid duplicates
        if (!finalCats.some(c => c.title === fallback.title)) {
          finalCats.push({
            ...fallback,
            image: getImageUrl(fallback.image),
            href: '#',
            color: '#2B7FFF'
          });
        }
      }
    }

    // 4. Limit to 4 and add IDs
    finalCats = finalCats.slice(0, 4).map((c, idx) => ({ ...c, id: idx + 1 }));

    setDisplayCategories(finalCats);

  }, [rankingTools]);

  const handleViewMorePopular = (e) => {
    e.preventDefault();
    // Navigate to /inventory with 'popular' sort filter
    navigate("/inventory", { state: { initialFilters: { sort: 'Popular' } } });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <NavBar />
      
      {/* Header block: centered welcome */}
      <div style={{ paddingTop: '100px', paddingBottom: '24px' }} className="px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <section className="text-center mb-10" style={{ marginTop: '16px', marginBottom: '48px' }}>
            <h1 className="text-3xl font-bold text-gray-900">Bienvenido a ToolRent</h1>
            <p className="text-gray-600 mt-2 text-lg">Tu plataforma para arrendar herramientas fácilmente.</p>
          </section>
        </div>
      </div>

      {/* Most Popular (First Carousel) */}
      <section style={{ width: '100%', padding: 0 }}>
        <ToolCarousel 
          tools={rankingTools} 
          title="Lo más popular" 
          onViewMore={handleViewMorePopular}
        />
      </section>

      {/* Categories centered after first carousel */}
      <div style={{ paddingTop: '50px'}} className="px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <CategoriesGrid
            categories={displayCategories}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
