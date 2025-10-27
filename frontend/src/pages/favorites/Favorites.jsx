import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchUserFavorites,
  removeFavorite,
  removeProductFromFavorites,
} from '../../features/product/favoritesSlice';
import { addToCart } from '../../features/product/cartSlice';
import { HeartIcon } from '../../components/Icons';
import { toast } from 'react-toastify';
import styles from './css/Favorites.module.css';

const Favorites = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth() || {};
  const { favorites, loading } = useSelector((state) => state.favorites);
  const [isGridView, setIsGridView] = useState(true);

  useEffect(() => {
    if (isAuthenticated && currentUser?.uid) {
      dispatch(fetchUserFavorites(currentUser.uid));
    }
  }, [dispatch, isAuthenticated, currentUser]);

  const handleRemoveFavorite = (product) => {
    const productId = product.productId || product.id;

    if (isAuthenticated && currentUser) {
      dispatch(
        removeProductFromFavorites({
          userId: currentUser.uid,
          productId,
        })
      );
    } else {
      dispatch(removeFavorite(productId));
    }
    toast.success('Removed from favorites');
  };

  const handleAddToCart = (product) => {
    // Default values for cart item
    const cartItem = {
      id: product.productId || product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: product.size || 'M', // Default size
      color: product.color || '000000', // Default color (black)
      quantity: 1,
    };

    dispatch(addToCart(cartItem));
    toast.success('Added to cart');
  };

  const handleProductClick = (productId) => {
    navigate(`/product?id=${productId}`);
  };

  const renderEmptyState = () => (
    <div className={styles.emptyState}>
      <HeartIcon size={60} color='#ccc' />
      <h2>Your Favorites List is Empty</h2>
      <p>Save items you love to your favorites list and they'll appear here.</p>
      <button className={styles.browseButton} onClick={() => navigate('/shop')}>
        Browse Collection
      </button>
    </div>
  );

  const renderGridView = () => (
    <div className={styles.gridContainer}>
      {favorites.map((product) => (
        <div key={product.id || product.productId} className={styles.gridItem}>
          <div
            className={styles.imageContainer}
            onClick={() => handleProductClick(product.productId || product.id)}
          >
            <img
              src={product.image}
              alt={product.name}
              className={styles.productImage}
              onError={(e) => {
                e.target.src = '/images/placeholder.jpg';
              }}
            />
            <button
              className={styles.removeButton}
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFavorite(product);
              }}
            >
              <HeartIcon size={18} filled={true} color='#e6994b' />
            </button>
          </div>
          <div className={styles.productInfo}>
            <h3
              className={styles.productName}
              onClick={() =>
                handleProductClick(product.productId || product.id)
              }
            >
              {product.name}
            </h3>
            <p className={styles.productPrice}>{product.price}</p>
            <button
              className={styles.addToCartButton}
              onClick={() => handleAddToCart(product)}
            >
              Add to Cart
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className={styles.listContainer}>
      {favorites.map((product) => (
        <div key={product.id || product.productId} className={styles.listItem}>
          <div
            className={styles.listImageContainer}
            onClick={() => handleProductClick(product.productId || product.id)}
          >
            <img
              src={product.image}
              alt={product.name}
              className={styles.listProductImage}
              onError={(e) => {
                e.target.src = '/images/placeholder.jpg';
              }}
            />
          </div>
          <div className={styles.listProductInfo}>
            <h3
              className={styles.listProductName}
              onClick={() =>
                handleProductClick(product.productId || product.id)
              }
            >
              {product.name}
            </h3>
            <p className={styles.listProductPrice}>{product.price}</p>
          </div>
          <div className={styles.listActions}>
            <button
              className={styles.listAddToCartButton}
              onClick={() => handleAddToCart(product)}
            >
              Add to Cart
            </button>
            <button
              className={styles.listRemoveButton}
              onClick={() => handleRemoveFavorite(product)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Favorites</h1>
        {favorites.length > 0 && (
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewButton} ${
                isGridView ? styles.active : ''
              }`}
              onClick={() => setIsGridView(true)}
            >
              Grid
            </button>
            <button
              className={`${styles.viewButton} ${
                !isGridView ? styles.active : ''
              }`}
              onClick={() => setIsGridView(false)}
            >
              List
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}>Loading favorites...</div>
      ) : favorites.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <p className={styles.count}>
            {favorites.length} item{favorites.length !== 1 ? 's' : ''}
          </p>
          {isGridView ? renderGridView() : renderListView()}
        </>
      )}
    </div>
  );
};

export default Favorites;
