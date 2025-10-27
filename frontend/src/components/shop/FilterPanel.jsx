import React, { useState, useRef, useEffect } from 'react';
import {
  FilterIcon,
  CloseIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '../Icons';
import styles from '../../pages/shop/css/AllProducts.module.css';

const FilterPanel = ({ filters, activeFilters, onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const filterRef = useRef(null);

  // Handle outside clicks to close the filter panel
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const toggleFilterPanel = () => {
    setIsOpen(!isOpen);
  };

  const toggleCategory = (category) => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category],
    });
  };

  const handleFilterChange = (category, option) => {
    const newFilters = { ...activeFilters };

    if (!newFilters[category]) {
      newFilters[category] = [option];
    } else if (newFilters[category].includes(option)) {
      newFilters[category] = newFilters[category].filter(
        (item) => item !== option
      );
      if (newFilters[category].length === 0) {
        delete newFilters[category];
      }
    } else {
      newFilters[category] = [...newFilters[category], option];
    }

    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    onFilterChange({});
  };

  // Count active filters
  const activeFilterCount = Object.values(activeFilters).flat().length;

  return (
    <div className={styles.filterContainer} ref={filterRef}>
      <button
        className={styles.filterButton}
        onClick={toggleFilterPanel}
        aria-expanded={isOpen}
        aria-controls='filter-panel'
      >
        <FilterIcon size={16} />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className={styles.filterCount}>{activeFilterCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.filterPanel} id='filter-panel'>
          <div className={styles.filterHeader}>
            <h3>Filters</h3>
            <button
              className={styles.closeButton}
              onClick={toggleFilterPanel}
              aria-label='Close filter panel'
            >
              <CloseIcon size={18} />
            </button>
          </div>

          {Object.entries(filters).map(([category, options]) => (
            <div key={category} className={styles.filterCategory}>
              <button
                className={styles.categoryHeader}
                onClick={() => toggleCategory(category)}
                aria-expanded={expandedCategories[category]}
              >
                <span>{category}</span>
                {expandedCategories[category] ? (
                  <ChevronUpIcon size={16} />
                ) : (
                  <ChevronDownIcon size={16} />
                )}
              </button>

              {expandedCategories[category] && (
                <div className={styles.categoryOptions}>
                  {options.map((option) => (
                    <label key={option} className={styles.filterOption}>
                      <input
                        type='checkbox'
                        checked={
                          activeFilters[category]?.includes(option) || false
                        }
                        onChange={() => handleFilterChange(category, option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          {activeFilterCount > 0 && (
            <button
              className={styles.clearFiltersButton}
              onClick={clearAllFilters}
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
