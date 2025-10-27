import ProductDetails from './ProductDetails.jsx';
import RelatedProducts from './RelatedProducts';
import styles from './css/SingleProduct.module.css';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addToCart } from '../../features/product/cartSlice';

const SingleProduct = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleBuyNow = (product) => {
    // Add the product to the selected products in the cart slice
    dispatch(
      addToCart({
        ...product,
        quantity: 1,
      })
    );

    // Navigate to the buy page
    navigate('/buy');
  };

  return (
    <div className={styles.productContainer}>
      <ProductDetails onBuyNow={handleBuyNow} />
      <RelatedProducts />
    </div>
  );
};

export default SingleProduct;
