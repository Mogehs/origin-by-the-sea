import { useState, useEffect } from 'react';
import styles from './ProductCard.module.css';
import { Link } from 'react-router-dom';
import OptimizedImage from '../OptimizedImage/OptimizedImage';
import { useImageCache } from '../../context/ImageCacheContext';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { addToCache, isCached } = useImageCache();

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Cache the product images when the component mounts
  useEffect(() => {
    if (product) {
      // Add main image to cache
      if (product.image) {
        addToCache(product.image);
      }
      
      // Add hover image to cache
      if (product.hoverImage) {
        addToCache(product.hoverImage);
      }
    }
  }, [product, addToCache]);

  const handleImageError = () => {
    setImageError(true);
  };

  // Determine which image to show
  const displayImage = isHovered && !imageError && product.hoverImage
    ? product.hoverImage
    : product.image;

  // Check if the image is already cached
  const isImageCached = isCached(displayImage);

  return (
    <div className={styles.productCard}>
      <Link
        onClick={scrollToTop}
        to={`/product?id=${product.id}`}
        className={styles.productLink}
      >
        <div
          className={styles.imageContainer}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setImageError(false); // Reset error state when mouse leaves
          }}
        >
          <OptimizedImage
            src={displayImage}
            placeholderSrc={'/images/placeholder.jpg'}
            alt={product.name}
            className={styles.productImage}
            onError={handleImageError}
            lazy={true}
            blur={!isImageCached} // Only blur if not cached
            quality="medium"
            objectFit="cover"
          />
        </div>
        <h3 className={styles.productName}>{product?.name}</h3>
        <p className={styles.productPrice}>{product?.price}</p>
      </Link>
    </div>
  );
};


export default ProductCard;
