import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styles from './css/Buy.module.css';
import { FaPlus, FaMinus, FaTrashAlt } from 'react-icons/fa';
import {
  updateSelectedQuantity,
  removeFromSelectedCart,
} from '../../features/product/cartSlice';

const OrderSummary = () => {
  const dispatch = useDispatch();
  // Get items from cart if not provided as props
  const { selectedCartItems } = useSelector((state) => state.cart);
  const items = selectedCartItems;
  console.log('Order items:', items);

  const handleQuantityChange = (id, size, color, newQuantity) => {
    if (newQuantity >= 1) {
      dispatch(
        updateSelectedQuantity({ id, size, color, quantity: newQuantity })
      );
    }
  };

  const handleRemoveItem = (id, size, color) => {
    dispatch(removeFromSelectedCart({ id, size, color }));
  };

  // Calculate totals
  const subtotal =
    items && items.length > 0
      ? items.reduce((total, item) => {
          const rawPrice = item?.price ?? '0';
          const price = parseFloat(rawPrice.replace(/[^0-9.]/g, '')) || 0;
          const quantity = Number(item?.quantity) || 1;
          return total + price * quantity;
        }, 0)
      : 0;

  const total = subtotal;

  return (
    <div className={styles.summaryBox}>
      <h3 className={styles.summaryTitle}>Order Summary</h3>

      {/* Products List */}
      <div className={styles.productsList}>
        {items && items.length > 0 ? (
          items.map((item, index) => (
            <div key={index} className={styles.product}>
              <div
                className={styles.productImage}
                style={{ backgroundImage: `url(${item.image})` }}
              ></div>
              <div className={styles.productDetails}>
                <p className={styles.productTitle}>{item.name}</p>
                <p className={styles.productVariants}>
                  {item.size && <span>Size: {item.size}</span>}
                  {item.displayColor && (
                    item.displayColor.startsWith('linear-gradient') ? (
                    <span
                      style={{
                        display: 'inline-block',
                          width: '16px',
                          height: '16px',
                        background: item.displayColor,
                        marginLeft: '5px',
                        borderRadius: '50%',
                          border: '1px solid #ccc',
                          verticalAlign: 'middle',
                        }}
                        title={item.color}
                      />
                    ) : (
                      <span
                        style={{
                          display: 'inline-block',
                          width: '16px',
                          height: '16px',
                          backgroundColor: item.displayColor,
                          marginLeft: '5px',
                          borderRadius: '50%',
                          border: '1px solid #ccc',
                          verticalAlign: 'middle',
                        }}
                        title={item.color}
                      />
                    )
                  )}
                </p>
                <div className={styles.quantityControl}>
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
                    <FaMinus size={12} />
                  </button>
                  <span className={styles.quantityValue}>{item.quantity}</span>
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
                    <FaPlus size={12} />
                  </button>
                  <button
                    className={styles.removeBtn}
                    onClick={() =>
                      handleRemoveItem(item.id, item.size, item.color)
                    }
                    aria-label='Remove item'
                  >
                    <FaTrashAlt size={14} />
                  </button>
                </div>
                <p className={styles.productPrice}>{item.price}</p>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyCart}>No items in cart</div>
        )}
      </div>

      {/* Pricing Details */}
      <div className={styles.pricingDetails}>
        <div className={styles.row}>
          <span>Subtotal</span>
          <span className={styles.amount}>AED {subtotal.toFixed(2)}</span>
        </div>

        <div className={styles.row}>
          <span>Shipping</span>
          <span className={styles.amount}>FREE</span>
        </div>

        <hr className={styles.divider} />

        <div className={styles.totalRow}>
          <span>Total</span>
          <span className={styles.totalAmount}>AED {total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
