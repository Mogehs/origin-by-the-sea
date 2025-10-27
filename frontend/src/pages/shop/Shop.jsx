import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import AllProducts from './AllProducts';
import SEO from '../../components/SEO';

const Shop = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Log when params change
  useEffect(() => {
    console.log('Shop component detected URL change:', location.pathname, location.search);
    
    // You can add additional logic here to handle specific URL parameter changes
    // For example, scroll to top when a new collection is selected
    if (searchParams.has('id') || location.pathname.includes('/collection/')) {
      window.scrollTo(0, 0);
    }
  }, [location, searchParams]);
  
  return (
    <Routes>
      {/* Main shop page - show all products */}
      <Route index element={<AllProducts />} />
      
      {/* Category-specific pages */}
      <Route path="category/:categoryId" element={<AllProducts />} />
      
      {/* Collection-specific pages */}
      <Route path="collection/:collectionId" element={<AllProducts />} />
      
      {/* Legacy compatibility for old URL patterns */}
      <Route path="/" element={<AllProducts />} />
      
      {/* Redirect other paths to main shop */}
      <Route path="*" element={<Navigate to="/shop" replace />} />
    </Routes>
  );
};

export default Shop;
