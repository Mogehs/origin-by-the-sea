import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { IoMdClose } from 'react-icons/io';
import {
  FaShoppingCart,
  FaTimes,
  FaArrowRight,
  FaTrashAlt,
  FaPlus,
  FaMinus,
} from 'react-icons/fa';
import {
  removeFromCart,
  clearSelectedCart,
  addToSelectedCart,
  updateQuantity,
} from '../../features/product/cartSlice';
import styles from './css/CartSidebar.module.css';

const CartSidebar = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cartItems } = useSelector((state) => state.cart);

  // Handle ESC key to close sidebar
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.keyCode === 27 && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);

    // If sidebar is open, prevent background scrolling
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  const totalPrice = cartItems.reduce(
    (acc, item) =>
      acc +
      Number(item?.price.replace(/AED\s?|,/g, '')) * Number(item?.quantity),
    0
  );

  const handleRemove = (id, size, color) => {
    dispatch(removeFromCart({ id, size, color }));
  };

  const handleCheckout = (item) => {
    dispatch(clearSelectedCart());
    dispatch(addToSelectedCart(item));
    onClose();
    navigate('/buy');
    window.scrollTo(0, 0);
  };

  const handleCheckoutAll = () => {
    dispatch(clearSelectedCart());
    cartItems.forEach((item) => {
      dispatch(addToSelectedCart(item));
    });
    onClose();
    navigate('/buy');
    window.scrollTo(0, 0);
  };

  const continueShopping = () => {
    onClose();
  };

  const goToCart = () => {
    onClose();
    navigate('/cart');
    window.scrollTo(0, 0);
  };

  const handleQuantityChange = (id, size, color, newQuantity) => {
    if (newQuantity >= 1) {
      dispatch(updateQuantity({ id, size, color, quantity: newQuantity }));
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`${styles.overlay} ${
          isOpen ? styles.visible : styles.hidden
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`${styles.sidebar} ${
          isOpen ? styles.visible : styles.hidden
        }`}
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            <FaShoppingCart className={styles.cartIcon} /> Cart
            <span className={styles.cartCount}>
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </span>
          </h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label='Close cart'
          >
            <IoMdClose />
          </button>
        </div>

        {/* Cart Items */}
        <div className={styles.cartItemsContainer}>
          {cartItems.length > 0 ? (
            cartItems.map((item) => (
              <div
                key={`${item.id}-${item.size}-${item.color}-sidebar`}
                className={styles.cartItem}
              >
                {/* Item Image */}
                <div className={styles.imageContainer}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className={styles.itemImage}
                  />
                </div>

                {/* Item Details */}
                <div className={styles.itemDetails}>
                  <div className={styles.itemHeader}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <p className={styles.itemPrice}>
                      AED{' '}
                      {Number(
                        item?.price.replace(/AED\s?|,/g, '')
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div className={styles.itemMeta}>
                    <p>
                      <span>Size:</span>&nbsp;<span>{item.size}</span>
                    </p>
                    <div className={styles.quantityControl}>
                      <span>Qty:</span>&nbsp;
                      <div className={styles.quantityAdjuster}>
                        <button
                          className={styles.quantityBtn}
                          onClick={() =>
                            handleQuantityChange(
                              item.id,
                              item.size,
                              item.color,
                              item.quantity - 1
                            )
                          }
                          disabled={item.quantity <= 1}
                          aria-label='Decrease quantity'
                        >
                          <FaMinus size={8} />
                        </button>
                        <span className={styles.quantityValue}>
                          {item.quantity}
                        </span>
                        <button
                          className={styles.quantityBtn}
                          onClick={() =>
                            handleQuantityChange(
                              item.id,
                              item.size,
                              item.color,
                              item.quantity + 1
                            )
                          }
                          aria-label='Increase quantity'
                        >
                          <FaPlus size={8} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Color swatch if displayColor exists */}
                  {item.displayColor && (
                    <div className={styles.itemColor}>
                      <span className={styles.colorLabel}>Color:</span>
                      {item.displayColor.startsWith('linear-gradient') ? (
                        <span
                          className={styles.colorSwatch}
                          style={{ background: item.displayColor }}
                          title={item.color}
                        />
                      ) : (
                        <span
                          className={styles.colorSwatch}
                          style={{ backgroundColor: item.displayColor }}
                          title={item.color}
                        />
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className={styles.itemActions}>
                    <button
                      type='button'
                      className={styles.removeButton}
                      onClick={() =>
                        handleRemove(item.id, item.size, item.color)
                      }
                      title='Remove from cart'
                    >
                      <FaTrashAlt size={10} style={{ marginRight: '3px' }} />
                      Remove
                    </button>

                    <button
                      onClick={() => handleCheckout(item)}
                      className={styles.itemCheckoutButton}
                      title='Proceed to checkout with this item'
                    >
                      Checkout
                      <FaArrowRight size={10} style={{ marginLeft: '3px' }} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyCart}>
              <FaShoppingCart className={styles.emptyCartIcon} />
              <p className={styles.emptyCartMessage}>Your cart is empty</p>
              <p className={styles.emptyCartDesc}>
                Add items to your cart to see them here
              </p>
              <button
                onClick={continueShopping}
                className={styles.checkoutButton}
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>

        {/* Footer with totals and checkout */}
        {cartItems.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.subtotal}>
              <p>Subtotal</p>
              <p>AED {totalPrice.toLocaleString()}</p>
            </div>
            <div className={styles.buttonGroup}>
              <button
                onClick={handleCheckoutAll}
                className={styles.checkoutButton}
              >
                Checkout All
              </button>
              <button onClick={goToCart} className={styles.viewCartButton}>
                View Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartSidebar;
