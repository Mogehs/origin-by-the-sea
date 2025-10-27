import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ProductCard } from '../../components';
import { setPage, fetchProducts } from '../../features/product/productSlice';
import { BsFilter, BsSearch, BsSliders } from 'react-icons/bs';
import { IoMdClose } from 'react-icons/io';
import { FiChevronDown } from 'react-icons/fi';
import styles from './css/AllProducts.module.css';
import './css/categoryFilter.css'; // Import our new category filter styles
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { formatColorToHex, getColorName, areColorsSimilar, getColorFamily } from '../../utils/ProductUtils';

const priceRanges = [
  { id: 1, label: 'Under AED 1,000', min: 0, max: 1000 },
  { id: 2, label: 'AED 1,000 - AED 2,000', min: 1000, max: 2000 },
  { id: 3, label: 'AED 2,000 - AED 3,000', min: 2000, max: 3000 },
  { id: 4, label: 'AED 3,000 - AED 5,000', min: 3000, max: 5000 },
  { id: 5, label: 'Over AED 5,000', min: 5000, max: Infinity },
];

const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const colorOptions = [
  { name: 'Red', value: '#ff0000' },
  { name: 'Blue', value: '#00aaff' },
  { name: 'Green', value: '#32cd32' },
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#ffffff' },
  { name: 'Navy', value: '#000080' },
  { name: 'Purple', value: '#800080' },
  { name: 'Pink', value: '#ff69b4' },
  { name: 'Brown', value: '#8b4513' },
  { name: 'Gray', value: '#808080' },
];

const sortOptions = [
  { id: 'newest', label: 'Newest' },
  { id: 'popularity', label: 'Most Popular' },
  { id: 'priceAsc', label: 'Price: Low to High' },
  { id: 'priceDesc', label: 'Price: High to Low' },
];

const AllProducts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { categoryId, collectionId: routeCollectionId } = useParams();
  
  // Get ID from either route params or search params (ensure it's a string)
  const collectionId = (routeCollectionId || searchParams.get('id') || '').toString();
  const categoryParam = (categoryId || searchParams.get('category') || '').toString();
  
  // Filter states
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [priceFilter, setPriceFilter] = useState([]);
  const [sizeFilter, setSizeFilter] = useState([]);
  const [colorFilter, setColorFilter] = useState([]);
  const [customColor, setCustomColor] = useState('#ffffff');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef(null);
  const [categoryFilter, setCategoryFilter] = useState(collectionId ? [collectionId] : []);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { products, currentPage, productsPerPage, status } = useSelector(
    (state) => state.product
  );

  // Accordion states for filter sections
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    size: true,
    color: true,
    sort: true
  });

  // Fetch collection categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Fetch all collections
        const collectionsRef = collection(db, 'collections');
        const collectionsSnapshot = await getDocs(collectionsRef);
        
        // Map collections without product counts - just name and ID
        const categoriesData = collectionsSnapshot.docs.map(doc => {
          // Normalize the ID to string for consistent comparison
          const collectionId = String(doc.id).trim();
          
          return {
            id: doc.data().id,
            label: doc.data().name || 'Unknown Collection'
          };
        });
        
        // Log collections
        console.log('All categories:', 
          categoriesData.map(c => `${c.label} (${c.id})`));
        
        setCategoryOptions(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);
  
  // Create a navigation handler for category clicks
  const handleCategoryClick = (category) => {
    // Navigate to the collection route
    navigate(`/shop?id=${category.id}`);
    // Scroll to top of the page
    window.scrollTo(0, 0);
  };

  // Fetch products
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchProducts());
    }
  }, [status, dispatch]);

  // Remove redundant effect for fetching collection details as it's now handled in the unified category effect

  // Unified category and collection handling
  useEffect(() => {
    // This effect runs when URL parameters change but keeps the component mounted
    console.log('URL parameters changed, updating filters:', { collectionId, categoryParam });
    
    // Create a new array for category filters
    const newCategoryFilters = [];
    
    // Add collectionId to filter if it exists (ensure it's a string)
    if (collectionId && collectionId.length > 0) {
      const collectionIdStr = String(collectionId).trim();
      
      // Only add if not already in the array
      if (!newCategoryFilters.includes(collectionIdStr)) {
        newCategoryFilters.push(collectionIdStr);
      }
      
      // Fetch collection details
      const fetchCollectionName = async () => {
        try {
          const collectionRef = doc(db, 'collections', collectionIdStr);
          const collectionDoc = await getDoc(collectionRef);
          
          if (collectionDoc.exists()) {
            const collectionData = collectionDoc.data();
            setCollectionName(collectionData.name || 'Collection');
            console.log('Found collection name:', collectionData.name);
          } else {
            console.warn('Collection not found for ID:', collectionIdStr);
            
            // Try to find by matching ID as string
            const collectionsRef = collection(db, 'collections');
            const collectionsSnapshot = await getDocs(collectionsRef);
            
            for (const doc of collectionsSnapshot.docs) {
              if (String(doc.id).trim() === collectionIdStr) {
                const collectionData = doc.data();
                setCollectionName(collectionData.name || 'Collection');
                console.log('Found collection by string matching:', collectionData.name);
                break;
              }
            }
          }
        } catch (error) {
          console.error('Error fetching collection name:', error);
        }
      };
      
      fetchCollectionName();
    } else {
      // Reset collection name if no collection ID
      setCollectionName('');
    }
    
    // Add categoryParam to filter if it exists and is not already included
    if (categoryParam && categoryParam.length > 0) {
      const categoryParamStr = String(categoryParam).trim();
      
      if (!newCategoryFilters.includes(categoryParamStr)) {
        newCategoryFilters.push(categoryParamStr);
      }
    }
    
    // Update category filter with all collected values
    console.log('Setting category filters to:', newCategoryFilters);
    setCategoryFilter(newCategoryFilters);
  }, [collectionId, categoryParam]);

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  // Filter functions
  const handlePriceFilter = (range) => {
    if (priceFilter.includes(range.id)) {
      setPriceFilter(priceFilter.filter((id) => id !== range.id));
    } else {
      setPriceFilter([...priceFilter, range.id]);
    }
  };

  const handleSizeFilter = (size) => {
    if (sizeFilter.includes(size)) {
      setSizeFilter(sizeFilter.filter((s) => s !== size));
    } else {
      setSizeFilter([...sizeFilter, size]);
    }
  };

  const handleColorFilter = (color) => {
    if (colorFilter.includes(color.value)) {
      setColorFilter(colorFilter.filter((c) => c !== color.value));
    } else {
      setColorFilter([...colorFilter, color.value]);
    }
  };

  const handleCustomColorFilter = () => {
    // Add the custom color to the filter if it's not already included
    if (!colorFilter.includes(customColor)) {
      setColorFilter([...colorFilter, customColor]);
    }
    setShowColorPicker(false);
  };

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCategoryFilter = (category) => {
    // Ensure we're working with string IDs
    const categoryId = String(category.id).trim();
    
    console.log('Toggling category filter:', category.label, categoryId);
    
    // Check if this category is already in the filter
    if (categoryFilter.some(id => String(id).trim() === categoryId)) {
      console.log(`Removing category ${category.label} from filters`);
      setCategoryFilter(categoryFilter.filter((id) => String(id).trim() !== categoryId));
    } else {
      console.log(`Adding category ${category.label} to filters`);
      setCategoryFilter([...categoryFilter, categoryId]);
    }
  };

  const handleSortChange = (option) => {
    setSortOption(option);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const resetFilters = () => {
    setPriceFilter([]);
    setSizeFilter([]);
    setColorFilter([]);
    setCategoryFilter([]);
    setSearchQuery('');
    setSortOption('newest');
    // Navigate to default shop route
    navigate('/shop');
  };

  const toggleFilterPanel = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  // Apply filters and sort
  useEffect(() => {
    if (status !== 'succeeded' || !products.length) {
      return;
    }
    
    setLoading(true);
    let result = [...products];
    console.log('Filtering from total products:', products.length);
    console.log('Category filters:', categoryFilter);

    // Apply category filter with improved matching logic - similar to how 'id' search parameter works
    if (categoryFilter.length > 0) {
      console.log('Before category filtering, products count:', result.length);
      console.log('Applying category filters:', categoryFilter.map(id => `"${id}"`).join(', '));
      
      // Convert all categoryFilter values to strings for consistent comparison
      const normalizedCategoryFilters = categoryFilter.map(id => String(id).trim());
      
      // First, let's log all the collection IDs that exist in our products for debugging
      const availableCollectionIds = [];
      products.forEach(p => {
        if (p.collection_id) {
          const colId = String(p.collection_id).trim();
          if (!availableCollectionIds.includes(colId)) {
            availableCollectionIds.push(colId);
          }
        }
      });
      console.log('Available collection IDs in products:', availableCollectionIds);
      
      // Filter products that match any of our selected categories
      result = result.filter(product => {
        // Ensure we have a valid product
        if (!product) return false;
        
        // Get product's collection ID and normalize it
        if (product.collection_id) {
          const productCollectionId = String(product.collection_id).trim();
          
          // Log detailed matching for debugging
          if (normalizedCategoryFilters.includes(productCollectionId)) {
            console.log(`✓ Product "${product.name}" (${product.id}) matches collection "${productCollectionId}"`);
            return true;
          }
        }
        
        // Also check categories array if the product has it
        if (product.categories && Array.isArray(product.categories) && product.categories.length > 0) {
          for (const category of product.categories) {
            const catId = typeof category === 'object' ? String(category.id).trim() : String(category).trim();
            
            if (normalizedCategoryFilters.includes(catId)) {
              console.log(`✓ Product "${product.name}" (${product.id}) matches via categories array with "${catId}"`);
              return true;
            }
          }
        }
        
        // If no match found, log for debugging
        console.log(`✗ Product "${product.name}" (${product.id}) doesn't match any selected categories`);
        return false;
      });
      
      console.log('After filtering by collection/category, products count:', result.length);
      
      // If no products found with current filters, log detailed info for debugging
      if (result.length === 0) {
        console.warn('No products match the selected categories. Debug info:');
        console.warn('- Selected category filters:', normalizedCategoryFilters);
        console.warn('- Available collection IDs in products:', availableCollectionIds);
        
        // Log some sample products to help debug
        const sampleProducts = products.slice(0, 3);
        console.warn('Sample product data:', sampleProducts.map(p => ({
          id: p.id,
          name: p.name,
          collection_id: p.collection_id ? String(p.collection_id) : 'null',
          categories: p.categories || []
        })));
      }
    }

    // Apply search filter
    if (searchQuery) {
      result = result.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply price filter
    if (priceFilter.length > 0) {
      result = result.filter((product) => {
        // Use rawPrice for price filtering if available
        const productPrice = product.rawPrice !== undefined ? product.rawPrice : 
          typeof product.price === 'string' ? 
          Number(product.price.replace(/[^0-9.-]+/g, '')) : 
          Number(product.price || 0);
          
        return priceFilter.some((rangeId) => {
          const range = priceRanges.find((r) => r.id === rangeId);
          return productPrice >= range.min && productPrice <= range.max;
        });
      });
    }

    // Apply size filter
    if (sizeFilter.length > 0) {
      result = result.filter((product) =>
        product.sizes && sizeFilter.some((size) => 
          product.sizes.map(s => s.toUpperCase()).includes(size))
      );
    }

    // Apply color filter with support for similar colors and shades
    if (colorFilter.length > 0) {
      result = result.filter((product) => {
        if (!product.colors || !Array.isArray(product.colors)) {
          return false;
        }
        
        return colorFilter.some((filterColor) => {
          return product.colors.some(productColor => {
            // Convert both to hex for comparison
            const productHex = formatColorToHex(productColor);
            const filterHex = formatColorToHex(filterColor);
            
            // Check if colors are exactly the same or in the same family
            return productHex.toLowerCase() === filterHex.toLowerCase() || 
                  areColorsSimilar(productHex, filterHex);
          });
        });
      });
    }

    // Apply sorting
    switch (sortOption) {
      case 'priceAsc':
        result.sort((a, b) => {
          // Use rawPrice for sorting if available
          const priceA = a.rawPrice !== undefined ? a.rawPrice : 
            typeof a.price === 'string' ? Number(a.price.replace(/[^0-9.-]+/g, '')) : Number(a.price || 0);
          const priceB = b.rawPrice !== undefined ? b.rawPrice : 
            typeof b.price === 'string' ? Number(b.price.replace(/[^0-9.-]+/g, '')) : Number(b.price || 0);
          return priceA - priceB;
        });
        break;
      case 'priceDesc':
        result.sort((a, b) => {
          // Use rawPrice for sorting if available
          const priceA = a.rawPrice !== undefined ? a.rawPrice : 
            typeof a.price === 'string' ? Number(a.price.replace(/[^0-9.-]+/g, '')) : Number(a.price || 0);
          const priceB = b.rawPrice !== undefined ? b.rawPrice : 
            typeof b.price === 'string' ? Number(b.price.replace(/[^0-9.-]+/g, '')) : Number(b.price || 0);
          return priceB - priceA;
        });
        break;
      case 'popularity':
        result.sort((a, b) => (b.stock || 0) - (a.stock || 0));
        break;
      case 'newest':
      default:
        result.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
          const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
          return dateB - dateA;
        });
        break;
    }

    setFilteredProducts(result);
    setLoading(false);
    // Reset to first page when filters change
    dispatch(setPage(1));
  }, [
    products,
    searchQuery,
    priceFilter,
    sizeFilter,
    colorFilter,
    sortOption,
    dispatch,
    categoryFilter,
    status
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  const handlePageClick = (pageNumber) => {
    dispatch(setPage(pageNumber));
    // Scroll to top of products when changing page
    document
      .querySelector(`.${styles.productsGrid}`)
      .scrollIntoView({ behavior: 'smooth' });
  };

  // Calculate how many active filters
  const activeFilterCount =
    priceFilter.length +
    sizeFilter.length +
    colorFilter.length +
    (categoryFilter.length - (collectionId && collectionId.length > 0 ? 1 : 0)); // Don't count the initial collection filter

  // Show loading state
  if (status === 'loading' || (status === 'idle' && !products.length)) {
    return (
      <div className={styles.shopContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.shimmerProductGrid}>
            {[...Array(8)].map((_, index) => (
              <div key={index} className={styles.shimmerProduct}>
                <div className={styles.shimmerImage}></div>
                <div className={styles.shimmerTitle}></div>
                <div className={styles.shimmerPrice}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shopContainer}>
      {/* Mobile Filter Header */}
      <div className={styles.mobileFilterHeader}>
        <div className={styles.filterToggle} onClick={toggleFilterPanel}>
          <BsFilter size={24} />
          <span>
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </span>
        </div>

        <div className={styles.mobileSearch}>
          <div className={styles.searchInputContainer}>
            <BsSearch className={styles.searchIcon} />
            <input
              type='text'
              placeholder='Search products...'
              value={searchQuery}
              onChange={handleSearch}
              className={styles.searchInput}
            />
            {searchQuery && (
              <IoMdClose
                className={styles.clearSearch}
                onClick={() => setSearchQuery('')}
              />
            )}
          </div>
        </div>

        <div className={styles.sortSelectContainer}>
          <select
            value={sortOption}
            onChange={(e) => handleSortChange(e.target.value)}
            className={styles.sortSelect}
          >
            <option value='' disabled>
              Sort by
            </option>
            {sortOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.shopContent}>
        {/* Filters Panel */}
        <aside
          className={`${styles.filtersPanel} ${
            isFilterOpen ? styles.filterOpen : ''
          }`}
        >
          <div className={styles.filterHeader}>
            <h3>Filters</h3>
            <div className={styles.filterActions}>
              {activeFilterCount > 0 && (
                <button className={styles.resetButton} onClick={resetFilters}>
                  Clear All
                </button>
              )}
              <button
                className={styles.closeFilters}
                onClick={toggleFilterPanel}
              >
                <IoMdClose size={24} />
              </button>
            </div>
          </div>

          <div className={styles.filterBody}>
            <button className={styles.clearAllFiltersButton} onClick={resetFilters}>
              Clear All Filters
            </button>
            {/* Search filter for desktop */}
            <div className={styles.desktopSearch}>
              <div className={styles.searchInputContainer}>
                <BsSearch className={styles.searchIcon} />
                <input
                  type='text'
                  placeholder='Search products...'
                  value={searchQuery}
                  onChange={handleSearch}
                  className={styles.searchInput}
                />
                {searchQuery && (
                  <IoMdClose
                    className={styles.clearSearch}
                    onClick={() => setSearchQuery('')}
                  />
                )}
              </div>
            </div>

            {/* Active filter tags */}
            {activeFilterCount > 0 && (
              <div className={styles.activeFilterTags}>
                {categoryFilter
                  .filter(id => id !== collectionId) // Don't show the initial collection as a tag
                  .map((id) => {
                    // Find the category in the options - strip out the count part from the label
                    const category = categoryOptions.find((c) => String(c.id).trim() === String(id).trim());
                    if (!category) return null; // Skip if category not found
                    
                    // Extract just the collection name without the count for display
                    const labelWithoutCount = category.label.replace(/\s*\(\d+\)$/, '');
                    
                    return (
                      <div key={`cat-${id}`} className={styles.filterTag}>
                        <span>{labelWithoutCount}</span>
                        <IoMdClose
                          className={styles.removeTag}
                          size={14}
                          onClick={() =>
                            setCategoryFilter(
                              categoryFilter.filter((catId) => String(catId).trim() !== String(id).trim())
                            )
                          }
                        />
                      </div>
                    );
                  })}
                {priceFilter.map((id) => {
                  const range = priceRanges.find((r) => r.id === id);
                  return (
                    <div key={`price-${id}`} className={styles.filterTag}>
                      <span>{range?.label}</span>
                      <IoMdClose
                        className={styles.removeTag}
                        size={14}
                        onClick={() =>
                          setPriceFilter(
                            priceFilter.filter((rangeId) => rangeId !== id)
                          )
                        }
                      />
                    </div>
                  );
                })}
                {sizeFilter.map((size) => (
                  <div key={`size-${size}`} className={styles.filterTag}>
                    <span>Size: {size}</span>
                    <IoMdClose
                      className={styles.removeTag}
                      size={14}
                      onClick={() =>
                        setSizeFilter(sizeFilter.filter((s) => s !== size))
                      }
                    />
                  </div>
                ))}
                {colorFilter.map((color) => {
                  const colorObj = colorOptions.find((c) => c.value === color) || 
                                  { name: getColorName(color), value: color };
                  const family = getColorFamily(formatColorToHex(color));
                  return (
                    <div key={`color-${color}`} className={styles.filterTag}>
                      <span>Color: {colorObj.name}</span>
                      <IoMdClose
                        className={styles.removeTag}
                        size={14}
                        onClick={() =>
                          setColorFilter(colorFilter.filter((c) => c !== color))
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sort options for desktop */}
            <div className={styles.desktopSort}>
              <div className={styles.filterSection}>
                <div
                  className={styles.filterHeading}
                  onClick={() => toggleSection('sort')}
                >
                  <h4>Sort By</h4>
                  <FiChevronDown
                    className={expandedSections.sort ? styles.expanded : ''}
                  />
                </div>
                {expandedSections.sort && (
                  <div className={styles.sortOptions}>
                    {sortOptions.map((option) => (
                      <div
                        key={option.id}
                        className={`${styles.sortOption} ${
                          sortOption === option.id ? styles.active : ''
                        }`}
                        onClick={() => handleSortChange(option.id)}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

                  <div className={styles.filterSection}>
                    <div
                    className={styles.filterHeading}
                    onClick={() => toggleSection('category')}
                    >
                    <h4>Category</h4>
                    <FiChevronDown
                      className={expandedSections.category ? styles.expanded : ''}
                    />
                    </div>
                    {expandedSections.category && (
                    <div className={styles.categoryOptions}>
                      {categoryOptions.map((category) => (
                      <div 
                        key={category.id} 
                        className={`${styles.categoryLink} ${
                          categoryFilter.includes(String(category.id).trim()) ? styles.active : ''
                        }`}
                        onClick={() => handleCategoryClick(category)}
                        style={{ cursor: 'pointer' }}
                      >
                        {category.label}
                      </div>
                      ))}
                    </div>
                    )}
                  </div>

                  {/* Price filter */}
            <div className={styles.filterSection}>
              <div
                className={styles.filterHeading}
                onClick={() => toggleSection('price')}
              >
                <h4>Price</h4>
                <FiChevronDown
                  className={expandedSections.price ? styles.expanded : ''}
                />
              </div>
              {expandedSections.price && (
                <div className={styles.filterOptions}>
                  {priceRanges.map((range) => (
                    <label key={range.id} className={styles.filterOption}>
                      <input
                        type='checkbox'
                        checked={priceFilter.includes(range.id)}
                        onChange={() => handlePriceFilter(range)}
                      />
                      <span>{range.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Size filter */}
            <div className={styles.filterSection}>
              <div
                className={styles.filterHeading}
                onClick={() => toggleSection('size')}
              >
                <h4>Size</h4>
                <FiChevronDown
                  className={expandedSections.size ? styles.expanded : ''}
                />
              </div>
              {expandedSections.size && (
                <div className={styles.sizeOptions}>
                  {sizeOptions.map((size) => (
                    <div
                      key={size}
                      className={`${styles.sizeOption} ${
                        sizeFilter.includes(size) ? styles.active : ''
                      }`}
                      onClick={() => handleSizeFilter(size)}
                    >
                      {size}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Color filter */}
            <div className={styles.filterSection}>
              <div
                className={styles.filterHeading}
                onClick={() => toggleSection('color')}
              >
                <h4>Color</h4>
                <FiChevronDown
                  className={expandedSections.color ? styles.expanded : ''}
                />
              </div>
              {expandedSections.color && (
                <div className={styles.colorOptions}>
                  {colorOptions.map((color) => (
                    <div
                      key={color.value}
                      className={`${styles.colorOption} ${
                        colorFilter.includes(color.value)
                          ? styles.activeColor
                          : ''
                      }`}
                      onClick={() => handleColorFilter(color)}
                      style={{ backgroundColor: color.value }}
                      title={`${color.name} (includes similar shades)`}
                    >
                      {colorFilter.includes(color.value) && (
                        <span className={styles.colorCheck}>✓</span>
                      )}
                    </div>
                  ))}
                  
                  {/* Custom color picker section */}
                  <div className={styles.customColorSection} ref={colorPickerRef}>
                    <div 
                      className={`${styles.colorOption} ${styles.customColorOption}`}
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      style={{ 
                        background: 'linear-gradient(135deg, red, orange, yellow, green, blue, indigo, violet)',
                        position: 'relative' 
                      }}
                      title="Choose custom color"
                    >
                      <span className={styles.customColorIcon}>+</span>
                    </div>
                    
                    {showColorPicker && (
                      <div className={styles.colorPickerContainer}>
                        <input 
                          type="color" 
                          value={customColor}
                          onChange={(e) => setCustomColor(e.target.value)}
                          className={styles.colorPickerInput}
                        />
                        <div className={styles.colorPickerControls}>
                          <div 
                            className={styles.colorPreview} 
                            style={{ backgroundColor: customColor }}
                          ></div>
                          <button 
                            className={styles.addCustomColorBtn}
                            onClick={handleCustomColorFilter}
                          >
                            Add Color
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Display active custom colors */}
                  {colorFilter.filter(color => !colorOptions.some(option => option.value === color)).map((customColorValue) => (
                    <div
                      key={customColorValue}
                      className={`${styles.colorOption} ${styles.activeColor}`}
                      onClick={() => setColorFilter(colorFilter.filter(c => c !== customColorValue))}
                      style={{ backgroundColor: customColorValue }}
                      title={`Custom color (${customColorValue})`}
                    >
                      <span className={styles.colorCheck}>✓</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Apply filters button for mobile */}
            <div className={styles.applyFilters}>
              <button
                className={styles.applyButton}
                onClick={toggleFilterPanel}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className={styles.productsArea}>
          <div className={styles.productsHeader}>
            <h2 className={styles.title}>
              {searchQuery
                ? `Search results for "${searchQuery}"`
                : collectionName || 'All Products'}
            </h2>
            <div className={styles.resultsInfo}>
              Showing {currentProducts.length} of {filteredProducts.length}{' '}
              products
            </div>
          </div>

          {loading ? (
            <div className={styles.shimmerProductGrid}>
              {[...Array(8)].map((_, index) => (
                <div key={index} className={styles.shimmerProduct}>
                  <div className={styles.shimmerImage}></div>
                  <div className={styles.shimmerTitle}></div>
                  <div className={styles.shimmerPrice}></div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.productsGrid}>
              {currentProducts.length > 0 ? (
                currentProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className={styles.noResults}>
                  <h3>No products found</h3>
                  <p>Try adjusting your filters or search terms</p>
                  <button className={styles.resetButton} onClick={resetFilters}>
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {filteredProducts.length > 0 && !loading && (
            <div className={styles.paginationContainer}>
              <div className={styles.paginationButtons}>
                <span className={styles.pageNumbers}>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => handlePageClick(index + 1)}
                      className={
                        currentPage === index + 1
                          ? styles.activePage
                          : styles.pageButton
                      }
                    >
                      {index + 1}
                    </button>
                  ))}
                </span>
                <button
                  onClick={() => handlePageClick(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={styles.nextButton}
                  aria-label='Next page'
                >
                  &#x276F;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay for mobile filter */}
      <div
        className={`${styles.filterOverlay} ${
          isFilterOpen ? styles.visible : ''
        }`}
        onClick={toggleFilterPanel}
      />
    </div>
  );
};

export default AllProducts;
