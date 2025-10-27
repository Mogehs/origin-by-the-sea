import CartProduct from './CartProduct';
import styles from './css/Cart.module.css';
import SEO from '../../components/SEO';
import { useSelector } from 'react-redux';

const Cart = () => {
  const { cartItems } = useSelector((state) => state.cart);
  
  const seoData = {
    title: 'Shopping Cart | Origin By The Sea',
    description: 'Review your selected sustainable fashion items and complete your purchase.',
    canonicalUrl: 'https://originsbythesea.com/cart',
    type: 'website',
    pageType: 'CheckoutPage',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CheckoutPage',
      name: 'Shopping Cart',
      description: 'Review and checkout your selected items',
      url: 'https://originsbythesea.com/cart',
      hasPart: cartItems?.map(item => ({
        '@type': 'Product',
        name: item.name,
        image: item.images?.[0],
        quantity: item.quantity,
        offers: {
          '@type': 'Offer',
          price: item.price,
          priceCurrency: 'AED'
        }
      }))
    }
  };  return (
    <>
      <SEO {...seoData} />
      <div className={styles.cartContainer}>
        <h1 className={styles.cartTitle}>Shopping Cart</h1>
        <CartProduct />
      </div>
    </>
  );
};

export default Cart;
