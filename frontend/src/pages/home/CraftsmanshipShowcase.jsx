import styles from './css/CraftsmanshipShowcase.module.css';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CraftsmanshipShowcase = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const fetchProducts = async () => {
        try {
          const productsRef = collection(db, 'products');
          const q = query(productsRef, orderBy('created_at', 'desc'), limit(8));
          const snapshot = await getDocs(q);
          
          const productsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            image: doc.data().images && doc.data().images.length > 0 ? 
                   doc.data().images[0] : '/images/placeholder.jpg',
            hoverImage: doc.data().images && doc.data().images.length > 1 ? 
                       doc.data().images[1] : doc.data().images && doc.data().images.length > 0 ? 
                       doc.data().images[0] : '/images/placeholder.jpg',
            price: doc.data().price ? `AED ${doc.data().price}` : 'Price not available',
            name: doc.data().name || 'Product Name'
          }));
          
          setProducts(productsData);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching products:', error);
          setLoading(false);
        }
      };
  
      fetchProducts();
    }, []);
  
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
    <section className={styles.showcase}>
      <h2 className={styles.heading}>Timeless Craftsmanship in Motion</h2>      <div className={styles.gallery}>
        {products.slice(0,5).map((item) => (
          <div onClick={()=>{
            navigate(`/product?id=${item.id}`)
          }} key={item.id} className={styles.card}>

            <img
              src={item.images[0]}
              alt='Craftsmanship'
              className={styles.image}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default CraftsmanshipShowcase;
