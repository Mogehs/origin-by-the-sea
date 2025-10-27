import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import styles from "./css/AccountPage.module.css";
import AddAddressForm from "./AddAddressForm";
import OrderCard from "./OrderCard";
import { getOrderById } from "../../services/orderService";
import {
  FaMapMarkerAlt,
  FaBox,
  FaHistory,
  FaSearch,
  FaSpinner,
} from "react-icons/fa";
import { MdEdit, MdDelete } from "react-icons/md";

const AccountPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userData, logout } = useAuth();
  const { isGuestCheckout } = useSelector((state) => state.guest);

  // Get the tab from URL query parameters
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get("tab");

  // Set initial tab based on URL parameter or default to 'orders'
  const [activeTab, setActiveTab] = useState(
    tabParam === "addresses" ? "addresses" : "orders"
  );
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [orderStatus, setOrderStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState("");
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  // Add logging to verify guest status
  useEffect(() => {
    console.log("AccountPage - Guest Checkout Status:", isGuestCheckout);

    // Load recent orders for guest users from localStorage
    if (isGuestCheckout) {
      try {
        const recentOrdersString = localStorage.getItem("guestRecentOrders");
        if (recentOrdersString) {
          const recentOrders = JSON.parse(recentOrdersString);
          // Add to location state to make them accessible in the component
          if (recentOrders && recentOrders.length > 0) {
            navigate("/account", {
              state: { recentOrders },
              replace: true,
            });
          }
        }
      } catch (error) {
        console.error("Error loading guest orders from localStorage:", error);
      }
    }
  }, [isGuestCheckout, navigate]);

  useEffect(() => {
    // Redirect if not logged in and not a guest user
    if (!currentUser && !isGuestCheckout) {
      navigate("/login");
    }
  }, [currentUser, isGuestCheckout, navigate, loading]);

  // Update URL when tab changes (only for authenticated users)
  useEffect(() => {
    if (currentUser) {
      navigate(`/account?tab=${activeTab}`, { replace: true });
    }
  }, [activeTab, navigate, currentUser]);

  // Fetch user orders (only for authenticated users)
  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const orderRef = collection(db, "orders");
        const q = query(orderRef, where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);

        const orderData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        }));

        // Sort orders by date (newest first)
        orderData.sort((a, b) => b.createdAt - a.createdAt);

        setOrders(orderData);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load your orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser]);

  // Fetch user addresses (only for authenticated users)
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!currentUser?.uid) return;

      try {
        const addressesRef = collection(
          db,
          "users",
          currentUser.uid,
          "addresses"
        );
        const querySnapshot = await getDocs(addressesRef);

        const addressData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAddresses(addressData);
      } catch (error) {
        console.error("Error fetching addresses:", error);
        toast.error("Failed to load your addresses");
      }
    };

    fetchAddresses();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
      toast.success("Successfully logged out");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;

    try {
      await deleteDoc(
        doc(db, "users", currentUser.uid, "addresses", addressId)
      );
      setAddresses(addresses.filter((addr) => addr.id !== addressId));
      toast.success("Address deleted successfully");
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address");
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      // First, remove default from all addresses
      const addressesToUpdate = addresses.filter((addr) => addr.isDefault);

      for (const addr of addressesToUpdate) {
        await updateDoc(
          doc(db, "users", currentUser.uid, "addresses", addr.id),
          {
            isDefault: false,
          }
        );
      }

      // Then set the new default
      await updateDoc(
        doc(db, "users", currentUser.uid, "addresses", addressId),
        {
          isDefault: true,
        }
      );

      // Update state
      setAddresses(
        addresses.map((addr) => ({
          ...addr,
          isDefault: addr.id === addressId,
        }))
      );

      toast.success("Default address updated");
    } catch (error) {
      console.error("Error updating default address:", error);
      toast.error("Failed to update default address");
    }
  };

  const handleAddressAdded = (newAddress) => {
    setAddresses([...addresses, newAddress]);
    setShowForm(false);
    setEditingAddress(null);
  };

  const handleAddressUpdated = (updatedAddress) => {
    setAddresses(
      addresses.map((addr) =>
        addr.id === updatedAddress.id ? updatedAddress : addr
      )
    );
    setShowForm(false);
    setEditingAddress(null);
  };

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) {
      setTrackingError("Please enter an order ID");
      return;
    }

    setTrackingLoading(true);
    setTrackingError("");
    setTrackingOrder(null);

    try {
      // Use the getOrderById service function instead of directly querying Firestore
      const { order, error } = await getOrderById(orderId);

      if (error) {
        setTrackingError(
          "Order not found. Please check your order ID and try again."
        );
        return;
      }

      setTrackingOrder(order);

      // Store recent orders for guests in localStorage to provide history
      if (isGuestCheckout) {
        try {
          // Get existing recent orders
          const recentOrdersString = localStorage.getItem("guestRecentOrders");
          let recentOrders = recentOrdersString
            ? JSON.parse(recentOrdersString)
            : [];

          // Check if this order is already in the list
          const orderExists = recentOrders.some((o) => o.id === order.id);

          if (!orderExists) {
            // Add the new order at the beginning
            recentOrders.unshift({
              id: order.id,
              createdAt: order.createdAt,
              total: order.total,
              status: order.status,
              paymentMethod: order.paymentMethod,
              paymentStatus: order.paymentStatus,
            });

            // Keep only the last 5 orders
            recentOrders = recentOrders.slice(0, 5);

            // Save back to localStorage
            localStorage.setItem(
              "guestRecentOrders",
              JSON.stringify(recentOrders)
            );
          }
        } catch (storageError) {
          console.error(
            "Error saving recent orders to localStorage:",
            storageError
          );
          // Non-critical error, continue without storing
        }
      }
    } catch (err) {
      console.error("Error fetching order:", err);
      setTrackingError("Failed to fetch order details. Please try again.");
    } finally {
      setTrackingLoading(false);
    }
  };

  // Filter orders by status
  const filteredOrders =
    orderStatus === "all"
      ? orders
      : orders.filter((order) => order.status === orderStatus);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}>Loading...</div>
      </div>
    );
  }

  // If user is not authenticated and not a guest, show login prompt
  if (!currentUser && !isGuestCheckout) {
    return (
      <div className={styles.container}>
        <div className={styles.loginPrompt}>
          <h2>Please log in to access your account</h2>
          <button
            className={styles.loginButton}
            onClick={() => navigate("/login")}
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  // If user is a guest, show track order form and display guest order history
  if (isGuestCheckout) {
    return (
      <div className={styles.container}>
        <div className={styles.guestTrackOrder}>
          <div className={styles.guestHeader}>
            <h2>Track Your Order</h2>
            <p className={styles.guestSubtitle}>
              Enter your order ID to track your order status. Don't have an
              account?{" "}
              <button
                className={styles.inlineLink}
                onClick={() => navigate("/signup")}
              >
                Create one to access more features!
              </button>
            </p>
          </div>

          <div className={styles.trackOrderSection}>
            <form onSubmit={handleTrackOrder} className={styles.trackForm}>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Enter your order ID"
                  className={styles.orderInput}
                />
                <button
                  type="submit"
                  className={styles.trackButton}
                  disabled={trackingLoading}
                >
                  {trackingLoading ? (
                    <FaSpinner className={styles.spinner} />
                  ) : (
                    <FaSearch />
                  )}
                  Track Order
                </button>
              </div>
              {trackingError && <p className={styles.error}>{trackingError}</p>}
            </form>
          </div>

          {trackingOrder && (
            <div className={styles.orderDetails}>
              <h3>Order Found</h3>
              <OrderCard order={trackingOrder} />
            </div>
          )}

          {/* Recent orders section - Show if any guest orders have been tracked */}
          {location.state?.recentOrders &&
            location.state.recentOrders.length > 0 && (
              <div className={styles.recentOrdersSection}>
                <h3>Recent Orders</h3>
                <p>Here are your recently tracked orders:</p>
                <div className={styles.ordersList}>
                  {location.state.recentOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}

          <div className={styles.guestActions}>
            <div className={styles.guestInfo}>
              <div className={styles.infoCard}>
                <h3>Why Create an Account?</h3>
                <div className={styles.benefitsList}>
                  <div className={styles.benefitItem}>
                    <div className={styles.benefitIcon}>📦</div>
                    <div className={styles.benefitText}>
                      <h4>Complete Order History</h4>
                      <p>
                        Access all your past and current orders in one place
                      </p>
                    </div>
                  </div>
                  <div className={styles.benefitItem}>
                    <div className={styles.benefitIcon}>📍</div>
                    <div className={styles.benefitText}>
                      <h4>Saved Addresses</h4>
                      <p>
                        Store multiple shipping addresses for faster checkout
                      </p>
                    </div>
                  </div>
                  <div className={styles.benefitItem}>
                    <div className={styles.benefitIcon}>⚡</div>
                    <div className={styles.benefitText}>
                      <h4>Faster Checkout</h4>
                      <p>Skip the form filling with saved information</p>
                    </div>
                  </div>
                  <div className={styles.benefitItem}>
                    <div className={styles.benefitIcon}>🔔</div>
                    <div className={styles.benefitText}>
                      <h4>Order Updates</h4>
                      <p>Get real-time notifications about your orders</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.actionButtons}>
              <button
                className={styles.loginButton}
                onClick={() => navigate("/login")}
              >
                Log In to Your Account
              </button>
              <button
                className={styles.signupButton}
                onClick={() => navigate("/signup")}
              >
                Create New Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular account page for authenticated users
  return (
    <div className={styles.accountContainer}>
      <div className={styles.sidebar}>
        <h3 className={styles.welcomeText}>
          Welcome,{" "}
          {userData?.firstName || currentUser?.email?.split("@")[0] || "User"}
        </h3>

        <div className={styles.menuItems}>
          <button
            className={`${styles.menuItem} ${
              activeTab === "orders" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("orders")}
          >
            <FaBox /> Orders
          </button>

          <button
            className={`${styles.menuItem} ${
              activeTab === "addresses" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("addresses")}
          >
            <FaMapMarkerAlt /> Addresses
          </button>
        </div>

        <button className={styles.logoutButton} onClick={handleLogout}>
          LOG OUT
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === "orders" && (
          <div className={styles.ordersSection}>
            <h2 className={styles.sectionTitle}>My Orders</h2>

            <div className={styles.orderFilters}>
              <button
                className={`${styles.filterButton} ${
                  orderStatus === "all" ? styles.activeFilter : ""
                }`}
                onClick={() => setOrderStatus("all")}
              >
                All
              </button>
              <button
                className={`${styles.filterButton} ${
                  orderStatus === "pending" ? styles.activeFilter : ""
                }`}
                onClick={() => setOrderStatus("pending")}
              >
                Pending
              </button>
              <button
                className={`${styles.filterButton} ${
                  orderStatus === "processing" ? styles.activeFilter : ""
                }`}
                onClick={() => setOrderStatus("processing")}
              >
                Processing
              </button>
              <button
                className={`${styles.filterButton} ${
                  orderStatus === "shipped" ? styles.activeFilter : ""
                }`}
                onClick={() => setOrderStatus("shipped")}
              >
                Shipped
              </button>
              <button
                className={`${styles.filterButton} ${
                  orderStatus === "delivered" ? styles.activeFilter : ""
                }`}
                onClick={() => setOrderStatus("delivered")}
              >
                Delivered
              </button>
            </div>

            <div className={styles.trackOrderSection}>
              <form onSubmit={handleTrackOrder} className={styles.trackForm}>
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="Enter order ID to track"
                    className={styles.orderInput}
                  />
                  <button
                    type="submit"
                    className={styles.trackButton}
                    disabled={trackingLoading}
                  >
                    {trackingLoading ? (
                      <FaSpinner className={styles.spinner} />
                    ) : (
                      <FaSearch />
                    )}
                    Track Order
                  </button>
                </div>
                {trackingError && (
                  <p className={styles.error}>{trackingError}</p>
                )}
              </form>
            </div>

            {trackingOrder && (
              <div className={styles.orderDetails}>
                <OrderCard order={trackingOrder} />
              </div>
            )}

            {filteredOrders.length === 0 ? (
              <div className={styles.emptyState}>
                <FaHistory className={styles.emptyStateIcon} />
                <p className={styles.emptyStateText}>
                  {orders.length === 0
                    ? "You haven't placed any orders yet."
                    : `No ${orderStatus} orders found.`}
                </p>
                <button
                  className={styles.shopNowButton}
                  onClick={() => navigate("/shop")}
                >
                  Browse Collection
                </button>
              </div>
            ) : (
              <div className={styles.ordersList}>
                {filteredOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "addresses" && (
          <div className={styles.addressesSection} id="addresses-section">
            <h2 className={styles.sectionTitle}>My Addresses</h2>

            <button
              className={styles.addAddressButton}
              onClick={() => {
                setEditingAddress(null);
                setShowForm(true);
              }}
            >
              + Add New Address
            </button>

            {addresses.length === 0 ? (
              <div className={styles.emptyState}>
                <FaMapMarkerAlt className={styles.emptyStateIcon} />
                <p className={styles.emptyStateText}>
                  You haven't saved any addresses yet.
                </p>
              </div>
            ) : (
              <div className={styles.addressGrid}>
                {addresses.map((address) => (
                  <div key={address.id} className={styles.addressCard}>
                    {address.isDefault && (
                      <span className={styles.defaultBadge}>Default</span>
                    )}
                    <div className={styles.addressHeader}>
                      <h3>
                        {address.firstName} {address.lastName}
                      </h3>
                    </div>
                    <p>{address.address1}</p>
                    {address.address2 && <p>{address.address2}</p>}
                    <p>
                      {address.city}, {address.state} {address.zipCode}
                    </p>
                    <p>{address.country}</p>
                    <p>{address.phone}</p>

                    <div className={styles.addressActions}>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEditAddress(address)}
                      >
                        <MdEdit /> Edit
                      </button>

                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteAddress(address.id)}
                      >
                        <MdDelete /> Delete
                      </button>

                      {!address.isDefault && (
                        <button
                          className={styles.defaultButton}
                          onClick={() => handleSetDefaultAddress(address.id)}
                        >
                          Set as Default
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <AddAddressForm
          onClose={() => {
            setShowForm(false);
            setEditingAddress(null);
          }}
          userId={currentUser?.uid}
          address={editingAddress}
          onAddressAdded={handleAddressAdded}
          onAddressUpdated={handleAddressUpdated}
        />
      )}
    </div>
  );
};

export default AccountPage;
