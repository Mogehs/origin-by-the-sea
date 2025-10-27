import React, { useState, useRef, useEffect } from 'react';
import styles from '../../pages/shop/css/AllProducts.module.css';
import { SortIcon, ChevronDownIcon } from '../Icons';

const SortOptions = ({ sortBy = 'featured', onSortChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Sort options
  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'latest', label: 'Newest Arrivals' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'name-asc', label: 'Name: A-Z' },
    { value: 'name-desc', label: 'Name: Z-A' },
  ];

  // Get current sort option label
  const currentSortLabel =
    sortOptions.find((option) => option.value === sortBy)?.label || 'Sort By';

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Handle option selection
  const handleSelect = (value) => {
    onSortChange(value);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.sortContainer} ref={dropdownRef}>
      <button className={styles.sortButton} onClick={toggleDropdown}>
        <SortIcon size={16} />
        <span>{currentSortLabel}</span>
        <ChevronDownIcon size={14} className={isOpen ? styles.expanded : ''} />
      </button>

      {isOpen && (
        <div className={styles.sortDropdown}>
          {sortOptions.map((option) => (
            <div
              key={option.value}
              className={`${styles.sortOption} ${
                sortBy === option.value ? styles.active : ''
              }`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SortOptions;
