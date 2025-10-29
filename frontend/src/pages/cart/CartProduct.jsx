import React, { useState, useEffect } from "react";
import styles from "./css/CartProduct.module.css";
import { useSelector, useDispatch } from "react-redux";
import {
  clearCart,
  clearSelectedCart,
  removeFromCart,
  updateQuantity,
} from "../../features/product/cartSlice"; // Adjust the import path if needed
import { FaShoppingCart, FaPlus, FaMinus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { IoIosDesktop } from "react-icons/io";
import { addToSelectedCart } from "../../features/product/cartSlice";
import OptimizedImage from "../../components/OptimizedImage/OptimizedImage";
import { useImageCache } from "../../context/ImageCacheContext";

const CartProduct = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cartItems } = useSelector((state) => state.cart);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 920);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 920);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleRemove = (id, size, color) => {
    dispatch(removeFromCart({ id, size, color }));
  };

  const handleQuantityChange = (id, size, color, newQuantity) => {
    if (newQuantity >= 1) {
      dispatch(updateQuantity({ id, size, color, quantity: newQuantity }));
    }
  };

  const totalPrice = cartItems.reduce(
    (acc, item) =>
      acc +
      Number(item?.price.replace(/AED\s?|,/g, "")) * Number(item?.quantity),
    0
  );

  const handleCheckout = (item) => {
    console.log(`this is the item ${JSON.stringify(item)}`);
    dispatch(clearSelectedCart());

    dispatch(addToSelectedCart(item));

    navigate("/buy");
    window.scrollTo(0, 0);
  };

  const handleCheckoutAll = () => {
    dispatch(clearSelectedCart());

    cartItems.forEach((item) => {
      dispatch(addToSelectedCart(item));
    });

    navigate("/buy");
    window.scrollTo(0, 0);
  };

  const { selectedCartItems } = useSelector((state) => state.cart);

  console.log(`this is the selectedCartItems ${selectedCartItems}`);

  const renderMobileCartItem = (item) => (
    <div
      key={`${item.id}-${item.size}-${item.color}-mobile`}
      className={styles.mobileCartProduct}
    >
      <div className={styles.mobileImageContainer}>
        <OptimizedImage
          src={item.image}
          alt={item.name}
          className={styles.mobileProductImage}
          lazy={true}
          quality="medium"
        />
      </div>

      <div className={styles.mobileProductHeader}>
        <h3 className={styles.mobileProductName}>{item.name}</h3>
        <button
          className={styles.mobileRemoveButton}
          onClick={() => handleRemove(item.id, item.size, item.color)}
        >
          <img
            className={styles.removeButtonIcon}
            src="/images/delete-icon.png"
            alt="Remove"
          />
        </button>
      </div>

      <hr className={styles.mobileDivider} />

      <div className={styles.mobileProductDetails}>
        <div className={styles.mobileSpecRow}>
          <span>
            Color:
            {item.displayColor &&
            item.displayColor.startsWith("linear-gradient") ? (
              <span
                style={{
                  display: "inline-block",
                  width: "18px",
                  height: "18px",
                  marginLeft: "5px",
                  borderRadius: "50%",
                  background: item.displayColor,
                  border: "1px solid #ccc",
                  verticalAlign: "middle",
                }}
                title={item.color}
              />
            ) : item.displayColor ? (
              <span
                style={{
                  display: "inline-block",
                  width: "18px",
                  height: "18px",
                  marginLeft: "5px",
                  borderRadius: "50%",
                  backgroundColor: item.displayColor,
                  border: "1px solid #ccc",
                  verticalAlign: "middle",
                }}
                title={item.color}
              />
            ) : (
              item.color || "Blue"
            )}
          </span>
          <span>Size: {item.size}</span>
        </div>

        <div className={styles.mobileQuantityRow}>
          <span>Quantity:</span>
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
              aria-label="Decrease quantity"
            >
              <FaMinus size={8} />
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
              aria-label="Increase quantity"
            >
              <FaPlus size={8} />
            </button>
          </div>
        </div>

        <div className={styles.mobilePriceRow}>
          <span>Price: AED {item?.price.toLocaleString()}</span>
        </div>

        <div className={styles.mobileTotalRow}>
          <span>
            Total: AED{" "}
            {(
              Number(item?.price.replace(/AED\s?|,/g, "")) *
              Number(item?.quantity)
            ).toLocaleString()}
          </span>
        </div>
      </div>

      <hr className={styles.mobileDivider} />

      <div className={styles.mobileCartActions}>
        <button
          className={styles.mobileCheckoutBtn}
          onClick={() => handleCheckout(item)}
        >
          Checkout
        </button>
      </div>
    </div>
  );

  const renderDesktopCartItem = (item) => (
    <div
      key={`${item.id}-${item.size}-${item.color}-desktop`}
      className={styles.cartProduct}
    >
      <div className={styles.imagePlaceholder}>
        <OptimizedImage
          src={item.image}
          alt={item.name}
          className={styles.productImage}
          lazy={true}
          quality="medium"
        />
      </div>

      <div className={styles.productDetailsContainer}>
        <div className={styles.productDetails}>
          <p className={styles.productName}>{item.name}</p>
          <div className={styles.productInfo}>
            <p>
              Color:
              {item.displayColor &&
              item.displayColor.startsWith("linear-gradient") ? (
                <span
                  style={{
                    display: "inline-block",
                    width: "18px",
                    height: "18px",
                    marginLeft: "5px",
                    borderRadius: "50%",
                    background: item.displayColor,
                    border: "1px solid #ccc",
                    verticalAlign: "middle",
                  }}
                  title={item.color}
                />
              ) : item.displayColor ? (
                <span
                  style={{
                    display: "inline-block",
                    width: "18px",
                    height: "18px",
                    marginLeft: "5px",
                    borderRadius: "50%",
                    backgroundColor: item.displayColor,
                    border: "1px solid #ccc",
                    verticalAlign: "middle",
                  }}
                  title={item.color}
                />
              ) : (
                item.color || "Blue"
              )}
            </p>
            <p>Size: {item.size}</p>
          </div>
        </div>

        <div className={styles.priceInfo}>
          <div className={styles.priceDetails}>
            <p className={styles.priceLabel}>Price</p>
            <p className={styles.price}>AED {item?.price}</p>
            <div className={styles.quantityControl}>
              <p className={styles.quantityLabel}>Quantity</p>
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
                  aria-label="Decrease quantity"
                >
                  <FaMinus size={10} />
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
                  aria-label="Increase quantity"
                >
                  <FaPlus size={10} />
                </button>
              </div>
            </div>
          </div>

          <div className={styles.totalDetails}>
            <p className={styles.totalLabel}>Total</p>
            <p className={styles.total}>
              AED{" "}
              {(
                Number(item?.price.replace(/AED\s?|,/g, "")) *
                Number(item?.quantity)
              ).toLocaleString()}
            </p>
          </div>

          <div className={styles.checkoutButtonContainer}>
            <button
              className={styles.itemCheckoutButton}
              onClick={() => handleCheckout(item)}
            >
              Checkout
            </button>
          </div>
        </div>
      </div>

      <button
        className={styles.removeButton}
        onClick={() => handleRemove(item.id, item.size, item.color)}
      >
        <img
          className={styles.removeButtonIcon}
          src="/images/delete-icon.png"
          alt="Remove"
        />
      </button>
    </div>
  );

  return (
    <div className={styles.cartProductContainer}>
      {cartItems.length > 0 ? (
        <>
          {isDesktop ? (
            cartItems.map((item) => renderDesktopCartItem(item))
          ) : (
            <div className={styles.mobileCartGrid}>
              {cartItems.map((item) => renderMobileCartItem(item))}
            </div>
          )}
        </>
      ) : (
        <div className={styles.emptyCartContainer}>
          <FaShoppingCart className={styles.emptyCartIcon} />
          <h2 className={styles.emptyCartText}>Your Cart is Empty</h2>
          <p className={styles.emptyCartSubText}>
            Discover our collection of handcrafted products and add your
            favorites to cart.
          </p>
          <button
            className={styles.shopNowButton}
            onClick={() => {
              navigate("/shop");
              window.scrollTo(0, 0);
            }}
          >
            Browse Collection
          </button>
        </div>
      )}

      {cartItems.length > 0 && (
        <>
          <div className={styles.cartFooter}>
            <div className={styles.cartTotal}>
              <p>Subtotal</p>
              <p>AED {totalPrice.toLocaleString()}</p>
            </div>
            <div className={styles.cartCheckout}>
              <button
                className={styles.checkoutBtn}
                onClick={() => handleCheckoutAll()}
              >
                Checkout All
              </button>

              <button
                onClick={() => {
                  dispatch(clearCart());
                }}
                className={styles.delBtn}
              >
                Delete All
              </button>
            </div>
          </div>

          <hr className={styles.cartFooterDivider} />

          <div className={styles.cartCheckout}>
            <button
              onClick={() => {
                navigate("/shop");
                window.scrollTo(0, 0);
              }}
              className={styles.continueShopping}
            >
              Continue Shopping
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartProduct;
