import { useState, useEffect } from 'react';
import { ProductCard } from '../../components';
import { useLocation } from 'react-router-dom';
import styles from './css/RelatedProducts.module.css';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';

const RelatedProducts = () => {
 const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const productId = queryParams.get('id');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        // Get the current product's collection ID
        let productCollectionId = null;
        const currentProductRef = await getDocs(
          query(collection(db, 'products'), where('__name__', '==', productId))
        );
        
        if (!currentProductRef.empty) {
          productCollectionId = currentProductRef.docs[0].data().collection_id;
        }

        // Fetch related products from the same collection
        let productsQuery;
        if (productCollectionId) {
          productsQuery = query(
            collection(db, 'products'),
            where('collection_id', '==', productCollectionId),
            where('__name__', '!=', productId),
            limit(4)
          );
        } else {
          // Fallback: fetch any 4 products
          productsQuery = query(
            collection(db, 'products'),
            where('__name__', '!=', productId),
            limit(4)
          );
        }

        const snapshot = await getDocs(productsQuery);
        
        if (snapshot.empty && productCollectionId) {
          // If no products in the same collection, fetch any 4 products
          const fallbackQuery = query(
            collection(db, 'products'),
            where('__name__', '!=', productId),
            limit(4)
          );
          const fallbackSnapshot = await getDocs(fallbackQuery);
          
          const fallbackProducts = fallbackSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            image: doc.data().images && doc.data().images.length > 0 ? 
                   doc.data().images[0] : '/images/placeholder.jpg',
            hoverImage: doc.data().images && doc.data().images.length > 1 ? 
                       doc.data().images[1] : doc.data().images && doc.data().images.length > 0 ? 
                       doc.data().images[0] : '/images/placeholder.jpg',
            price: doc.data().price ? `AED ${doc.data().price}` : 'Price not available',
          }));
          
          setRelatedProducts(fallbackProducts);
        } else {
          const relatedProductsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            image: doc.data().images && doc.data().images.length > 0 ? 
                   doc.data().images[0] : '/images/placeholder.jpg',
            hoverImage: doc.data().images && doc.data().images.length > 1 ? 
                       doc.data().images[1] : doc.data().images && doc.data().images.length > 0 ? 
                       doc.data().images[0] : '/images/placeholder.jpg',
            price: doc.data().price ? `AED ${doc.data().price}` : 'Price not available',
          }));
          
          setRelatedProducts(relatedProductsData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching related products:', error);
        setLoading(false);
      }
    };

    if (productId) {
      fetchRelatedProducts();
    }
  }, [productId]);

  if (loading) {
    return (
      <div className={styles.relatedProductsContainer}>
        <h1 className={styles.relatedProductsTitle}>Similar Products</h1>
        <div className={styles.relatedProducts}>
          {[...Array(4)].map((_, index) => (
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

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className={styles.relatedProductsContainer}>
      <h1 className={styles.relatedProductsTitle}>Similar Products</h1>
      <div className={styles.relatedProducts}>
        {relatedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
