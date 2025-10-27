import { useNavigate } from 'react-router-dom';
import styles from './css/ProductSection.module.css';
import { ProductCard } from '../../components';
import { useSelector } from 'react-redux';

const ProductSection = () => {
  const navigate = useNavigate();
  
  // Get featured products data from the centralized home store
  const { featuredProducts, status } = useSelector((state) => state.home);
  const loading = status === 'loading' || status === 'idle';

  if (loading) {
    return (
      <div className={styles.productSection}>
        <h2 className={styles.title}>Top Picks</h2>
        <div className={styles.gridContainer}>
          {[...Array(8)].map((_, index) => (
            <div key={index} className={styles.shimmerCard}>
              <div className={styles.shimmerImage}></div>
              <div className={styles.shimmerTitle}></div>
              <div className={styles.shimmerPrice}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.productSection}>
      <h2 className={styles.title}>Top Picks</h2>
      <div className={styles.gridContainer}>
        {featuredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <div className={styles.viewMoreWrapper}>
        <button
          onClick={() => {
            navigate('/shop');
            window.scrollTo(0, 0);
          }}
          className={styles.viewMore}
        >
          View All
        </button>
      </div>
    </div>
  );
};

export default ProductSection;
