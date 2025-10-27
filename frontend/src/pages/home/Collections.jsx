import React, { useState, useEffect } from 'react';
import styles from './css/Collections.module.css';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';

const Collections = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVerticalLayout, setIsVerticalLayout] = useState(window.innerWidth <= 900);
  
  // Get collections data from the centralized home store
  const { collections, status } = useSelector((state) => state.home);
  const loading = status === 'loading' || status === 'idle';

  useEffect(() => {
    const handleResize = () => {
      setIsVerticalLayout(window.innerWidth <= 900);
      // Reset index when switching layouts
      setCurrentIndex(0);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCollectionClick = (category) => {
    navigate(`/shop?id=${category}`);
    window.scrollTo(0, 0);
  };

  const nextSlide = () => {
    if (currentIndex < collections.length - 3) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <section className={styles.collectionsSection}>
        <h2 className={styles.title}>
          OUR <span style={{ color: '#E6994B' }}>COLLECTIONS</span>
        </h2>
        <div className={styles.collectionsGrid}>
          {[1, 2, 3].map((_, index) => (
            <div key={index} className={`${styles.collectionCard} ${styles.shimmer}`} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.collectionsSection}>
      <h2 className={styles.title}>
        OUR <span style={{ color: '#E6994B' }}>COLLECTIONS</span>
      </h2>
      <div className={styles.sliderContainer}>
        {!isVerticalLayout && currentIndex > 0 && (
          <button 
            className={`${styles.sliderButton} ${styles.prevButton}`}
            onClick={prevSlide}
            aria-label="Previous collections"
          >
            <IoIosArrowBack />
          </button>
        )}
        <div 
          className={styles.collectionsGrid}
          style={!isVerticalLayout ? {
            transform: `translateX(-${currentIndex * (100 / collections.length)}%)`
          } : undefined}
        >
          {(isVerticalLayout ? collections : collections).map((collection) => (
            <div
              key={collection.id}
              className={styles.collectionCard}
              onClick={() => handleCollectionClick(collection.id)}
            >
              <div className={styles.collectionLink}>
                <img
                  src={collection.image}
                  alt={collection.name}
                  className={styles.collectionImage}
                />
                <div className={styles.overlay}></div>
                <h3 className={styles.collectionTitle}>{collection.name}</h3>
              </div>
            </div>
          ))}
        </div>
        {!isVerticalLayout && currentIndex < collections.length - 3 && (
          <button 
            className={`${styles.sliderButton} ${styles.nextButton}`}
            onClick={nextSlide}
            aria-label="Next collections"
          >
            <IoIosArrowForward />
          </button>
        )}
      </div>
     
    </section>
  );
};



export default Collections;
