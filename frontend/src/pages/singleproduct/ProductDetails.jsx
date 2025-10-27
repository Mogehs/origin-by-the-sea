import React, { useState, useEffect, useCallback } from 'react';
import styles from './css/ProductPage.module.css';
import { useParams, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addToCart } from '../../features/product/cartSlice';
import {
  addFavorite,
  removeFavorite,
  addProductToFavorites,
  removeProductFromFavorites,
} from '../../features/product/favoritesSlice';
import { GrPrevious } from 'react-icons/gr';
import { GrNext } from 'react-icons/gr';
import { IoClose } from 'react-icons/io5';
import { FaPlay, FaPause } from 'react-icons/fa';
import { HeartIcon } from '../../components/Icons';
import { toast } from 'react-toastify';
import ReactImageMagnify from 'react-image-magnify';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import ProductTabs from './ProductTabs';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../../components/auth/AuthModal';
import { isProductFavorite } from '../../services/favoriteService';
import CartSidebar from '../cart/CartSidebar';
import OptimizedImage from '../../components/OptimizedImage/OptimizedImage';
import { useImageCache } from '../../context/ImageCacheContext';

const ProductDetails = ({ onBuyNow }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const productId = queryParams.get('id');
  const auth = useAuth() || {};
  const { isAuthenticated = false, currentUser = null } = auth;
  const favorites = useSelector((state) => state.favorites.favorites);
  const { isCached, addToCache, preloadImages } = useImageCache();

  // Initialize state with default values
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [product, setProduct] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [autoSlide, setAutoSlide] = useState(false);
  const [slideInterval, setSlideInterval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // Check if device is mobile
  const checkIfMobile = useCallback(() => {
    const mobileCheck = window.innerWidth <= 768;
    setIsMobile(mobileCheck);
  }, []);

  useEffect(() => {
    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);

    // Clean up event listener
    return () => window.removeEventListener('resize', checkIfMobile);
  }, [checkIfMobile]);

  // Fetch product from Firestore
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productDoc = await getDoc(doc(db, 'products', productId));

        if (productDoc.exists()) {
          const productData = {
            id: productDoc.id,
            ...productDoc.data(),
            price: productDoc.data().price
              ? `AED ${productDoc.data().price}`
              : 'Price not available',
            images: productDoc.data().images || ['/images/placeholder.jpg'],
            sizes: productDoc.data().sizes || ['S', 'M', 'L'],
            colors: productDoc.data().colors || ['4293673269'],
            description: productDoc.data().description || '',
            features: productDoc.data().features || '',
            image_descriptions: productDoc.data().image_descriptions || [
              'Product Image',
            ],
            color_palettes: productDoc.data().color_palettes
              ? productDoc
                  .data()
                  .color_palettes.map((palette) =>
                    palette.split(',').map((color) => parseInt(color.trim()))
                  )
              : [],
          };

          // Preload all product images
          if (productData.images && productData.images.length > 0) {
            preloadImages(productData.images);
          }

          setProduct(productData);
          setSelectedImage(productData.images[0]);
          setSelectedSize(productData.sizes[0]);
          if (productData.colors.length > 0) {
            setSelectedColor(productData.colors[0]);
          }
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Auto slide functionality
  useEffect(() => {
    if (autoSlide && product && product.images && product.images.length > 1) {
      const interval = setInterval(() => {
        const currentIndex = product.images.indexOf(selectedImage);
        const nextIndex = (currentIndex + 1) % product.images.length;
        setSelectedImage(product.images[nextIndex]);
      }, 3000);

      setSlideInterval(interval);

      return () => clearInterval(interval);
    } else if (slideInterval) {
      clearInterval(slideInterval);
      setSlideInterval(null);
    }
  }, [autoSlide, product, selectedImage, slideInterval]);

  // Clear slide interval when component unmounts
  useEffect(() => {
    return () => {
      if (slideInterval) {
        clearInterval(slideInterval);
      }
    };
  }, [slideInterval]);

  // Check if the current product is in favorites
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (productId) {
        if (isAuthenticated && currentUser) {
          // For authenticated users, check in Firestore
          const { isFavorite } = await isProductFavorite(
            currentUser.uid,
            productId
          );
          setIsFavorite(isFavorite);
        } else {
          // For non-authenticated users, check in Redux store
          const isInFavorites = favorites.some(
            (item) => item.id === productId || item.productId === productId
          );
          setIsFavorite(isInFavorites);
        }
      }
    };

    checkFavoriteStatus();
  }, [productId, isAuthenticated, currentUser, favorites]);

  // Add effect to handle post-auth navigation - this was likely conditionally rendered before
  useEffect(() => {
    const pendingProduct = localStorage.getItem('pendingBuyProduct');
    if (
      pendingProduct &&
      (isAuthenticated || localStorage.getItem('isGuestUser') === 'true')
    ) {
      const productData = JSON.parse(pendingProduct);
      onBuyNow(productData);
      localStorage.removeItem('pendingBuyProduct');
      localStorage.removeItem('isGuestUser');
    }
  }, [isAuthenticated, onBuyNow]);

  const [cartSidebarOpen, setCartSidebarOpen] = React.useState(false);

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      toast.error('Please select both size and color', {
        style: {
          fontWeight: 500,
        },
      });
      return;
    }

    // Convert color code for display in cart if it's a number or palette
    let displayColor = selectedColor;
    const colorStr = String(selectedColor); // Convert to string for safe handling

    if (colorStr.startsWith('[')) {
      // It's a palette (stringified array)
      try {
        const paletteArr = JSON.parse(colorStr).map(String);
        const hexColors = paletteArr.map((color) => {
          const cStr = String(color);
          if (cStr.startsWith('#')) return cStr;
          const intColor = parseInt(cStr);
          const r = (intColor >> 16) & 0xff;
          const g = (intColor >> 8) & 0xff;
          const b = intColor & 0xff;
          return `#${r.toString(16).padStart(2, '0')}${g
            .toString(16)
            .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        });
        displayColor = `linear-gradient(90deg, ${hexColors.join(', ')})`;
      } catch (e) {
        displayColor = '#000000';
      }
    } else if (!colorStr.startsWith('#')) {
      try {
        const intColor = parseInt(colorStr);
        const r = (intColor >> 16) & 0xff;
        const g = (intColor >> 8) & 0xff;
        const b = intColor & 0xff;
        displayColor = `#${r.toString(16).padStart(2, '0')}${g
          .toString(16)
          .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      } catch (e) {
        // Keep original if parsing fails
        console.error('Error parsing color code', e);
      }
    }

    const newItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: selectedImage,
      size: selectedSize,
      color: selectedColor,
      displayColor: displayColor,
      quantity,
    };

    dispatch(addToCart(newItem));

    setCartSidebarOpen(true);

    toast.success(
      `${product.name} has been added to your cart${
        quantity > 1 ? ` (×${quantity})` : ''
      }`,
      {
        style: {
          fontWeight: 500,
        },
      }
    );
  };

  const closeCartSidebar = () => {
    setCartSidebarOpen(false);
  };

  const handleToggleFavorite = () => {
    if (!product) return;

    if (isAuthenticated && currentUser) {
      // For authenticated users
      if (isFavorite) {
        dispatch(
          removeProductFromFavorites({
            userId: currentUser.uid,
            productId: productId,
          })
        );
        toast.success('Removed from favorites');
        console.log(`Removed product ${productId} from favorites`);
      } else {
        dispatch(
          addProductToFavorites({
            userId: currentUser.uid,
            product: {
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.images[0],
            },
          })
        );
        toast.success('Added to favorites');
        console.log('Added product to favorites:', product);
      }
    } else {
      // For non-authenticated users
      if (isFavorite) {
        dispatch(removeFavorite(productId));
        toast.success('Removed from favorites');
        console.log(`Removed product ${productId} from favorites`);
      } else {
        dispatch(
          addFavorite({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images[0],
            productId: product.id,
          })
        );
        toast.success('Added to favorites');
        console.log('Added product to favorites:', product);
      }
    }

    // Log current favorites
    console.log('Current favorites:', favorites);

    // Toggle favorite state locally for immediate UI feedback
    setIsFavorite(!isFavorite);
  };

  const openCarousel = (index) => {
    setCarouselIndex(index);
    setIsCarouselOpen(true);
    setAutoSlide(false); // Pause auto slide when opening fullscreen carousel
  };

  const closeCarousel = () => {
    setIsCarouselOpen(false);
  };

  const prevImage = () => {
    setCarouselIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const nextImage = () => {
    setCarouselIndex((prev) =>
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleMagnifierClick = () => {
    openCarousel(product.images.indexOf(selectedImage));
  };

  const toggleAutoSlide = () => {
    setAutoSlide((prev) => !prev);
  };

  const manuallyChangeImage = (img) => {
    setSelectedImage(img);
    if (autoSlide) {
      setAutoSlide(false);
    }
  };

  // Separate the rendering logic based on loading state
  if (loading) {
    return (
      <>
        <div className={styles.container}>
          <div className={styles.imageSection}>
            <div className={styles.thumbnailContainer}>
              {[1, 2, 3, 4].map((_, index) => (
                <div
                  key={index}
                  className={`${styles.thumbnail} ${styles.shimmer}`}
                />
              ))}
            </div>
            <div className={styles.mainImageContainer}>
              <div className={`${styles.mainImage} ${styles.shimmer}`} />
            </div>
          </div>
          <div className={styles.detailsSection}>
            <div
              className={`${styles.title} ${styles.shimmer}`}
              style={{ width: '70%', height: '32px' }}
            />
            <div
              className={`${styles.price} ${styles.shimmer}`}
              style={{ width: '30%', height: '24px', marginTop: '10px' }}
            />

            <div className={styles.optionGroup} style={{ marginTop: '20px' }}>
              <div
                className={`${styles.shimmer}`}
                style={{ width: '40%', height: '18px' }}
              />
              <div className={styles.sizes} style={{ marginTop: '10px' }}>
                {[1, 2, 3, 4].map((_, index) => (
                  <div
                    key={index}
                    className={`${styles.shimmer}`}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      display: 'inline-block',
                      margin: '0 5px',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className={styles.optionGroup} style={{ marginTop: '20px' }}>
              <div
                className={`${styles.shimmer}`}
                style={{ width: '40%', height: '18px' }}
              />
              <div className={styles.colors} style={{ marginTop: '10px' }}>
                {[1, 2, 3].map((_, index) => (
                  <div
                    key={index}
                    className={`${styles.shimmer}`}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      display: 'inline-block',
                      margin: '0 5px',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className={styles.optionGroup} style={{ marginTop: '20px' }}>
              <div
                className={`${styles.shimmer}`}
                style={{ width: '40%', height: '18px' }}
              />
              <div
                className={`${styles.shimmer}`}
                style={{ width: '120px', height: '25px', marginTop: '10px' }}
              />
            </div>

            <div className={styles.actionButtons}>
              <div
                className={`${styles.shimmer}`}
                style={{ width: '100%', height: '50px', marginTop: '20px' }}
              />
              <div
                className={`${styles.shimmer}`}
                style={{ width: '100%', height: '50px', marginTop: '10px' }}
              />
            </div>
          </div>
        </div>
        {/* Loading state for ProductTabs */}
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            width: '90%',
            padding: '20px 0',
          }}
        >
          <div
            className={styles.shimmer}
            style={{ width: '100%', height: '200px', borderRadius: '4px' }}
          />
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2>Product Not Found</h2>
          <p>The product you are looking for does not exist.</p>
          <button
            className={styles.backButton}
            onClick={() => navigate('/shop')}
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.container}>
        <div className={styles.imageSection}>
          <div className={styles.thumbnailContainer}>
            {product.images.map((img, index) => (
              <OptimizedImage
                key={index}
                src={img}
                alt={product.image_descriptions[index] ?? product.name}
                className={`${styles.thumbnail} ${
                  selectedImage === img ? styles.active : ''
                }`}
                onClick={() => manuallyChangeImage(img)}
                onError={(e) => {
                  e.target.src = '/images/placeholder.jpg';
                }}
                lazy={true}
                quality='medium'
              />
            ))}
          </div>
          <div className={styles.mainImageContainer}>
            {isMobile ? (
              <img
                src={selectedImage}
                alt={
                  product.image_descriptions[
                    product.images.indexOf(selectedImage)
                  ] ?? product.name
                }
                className={styles.mainImage}
                onClick={() =>
                  openCarousel(product.images.indexOf(selectedImage))
                }
                onError={(e) => {
                  e.target.src = '/images/placeholder.jpg';
                }}
              />
            ) : (
              <div
                onClick={handleMagnifierClick}
                style={{ width: '120%', height: '100%' }}
              >
                <ReactImageMagnify
                  {...{
                    smallImage: {
                      alt:
                        product.image_descriptions[
                          product.images.indexOf(selectedImage)
                        ] ?? product.name,
                      isFluidWidth: true,
                      src: selectedImage,
                      className: 'magnifyImage',
                      onError: (e) => {
                        console.error(
                          `Error loading small image: ${selectedImage}`
                        );
                        e.target.src = '/images/placeholder.jpg';
                      },
                      onLoad: () => {
                        if (!isCached(selectedImage)) {
                          addToCache(selectedImage);
                        }
                      },
                      crossOrigin: 'anonymous',
                    },
                    largeImage: {
                      src: selectedImage,
                      width: 1800,
                      height: 2400,
                      crossOrigin: 'anonymous',
                    },
                    enlargedImageContainerDimensions: {
                      width: '120%',
                      height: '100%',
                    },
                    enlargedImageContainerStyle: {
                      zIndex: 999,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    },
                    enlargedImagePosition: 'over',
                    hoverDelayInMs: 0,
                    hoverOffDelayInMs: 0,
                    shouldHideHintAfterFirstActivation: true,
                    isHintEnabled: true,
                    hintTextMouse: 'Hover to zoom',
                    style: {
                      cursor: 'crosshair',
                      width: '100%',
                      height: '100%',
                    },
                    className: styles.imageZoom,
                    enlargedImageClassName: styles.enlargedImage,
                    lensStyle: {
                      border: '1px solid #E6994B',
                      backgroundColor: 'rgba(230, 153, 75, 0.15)',
                    },
                    pressDuration: 0, // Prevents issues on touch devices
                    // Handles errors on magnified image load
                    enlargedImageContainerClassName:
                      styles.enlargedImageContainer,
                  }}
                />
              </div>
            )}
            <button
              className={styles.slideControlButton}
              onClick={toggleAutoSlide}
              title={autoSlide ? 'Pause slideshow' : 'Play slideshow'}
            >
              {autoSlide ? <FaPause /> : <FaPlay />}
            </button>
          </div>
        </div>
        <div className={styles.detailsSection}>
          <h1 className={styles.title}>{product?.name}</h1>
          <p className={styles.price}>{product?.price}</p>

          <div className={styles.optionGroup}>
            <p>Size:</p>
            <div className={styles.sizes}>
              {product.sizes.map((size) => (
                <button
                  key={size}
                  className={`${styles.sizeButton} ${
                    selectedSize === size ? styles.selected : ''
                  }`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.optionGroup}>
            <p>Colors:</p>
            <div className={styles.colors}>
              {product.colors.map((color) => {
                // Convert numeric color code to hex
                let colorValue;
                const colorStr = String(color); // Convert to string to safely use string methods

                if (colorStr.startsWith('#')) {
                  colorValue = colorStr;
                } else {
                  try {
                    // Parse the numeric color code and convert it to hex
                    const intColor = parseInt(colorStr);

                    // Extract RGB components (assuming ARGB format with 8 bits per channel)
                    const r = (intColor >> 16) & 0xff;
                    const g = (intColor >> 8) & 0xff;
                    const b = intColor & 0xff;

                    colorValue = `#${r.toString(16).padStart(2, '0')}${g
                      .toString(16)
                      .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                  } catch (e) {
                    // Fallback to default color if parsing fails
                    colorValue = '#000000';
                    console.error('Error parsing color code:', e);
                  }
                }

                return (
                  <button
                    key={color}
                    className={`${styles.colorButton} ${
                      selectedColor === color ? styles.selected : ''
                    }`}
                    style={{ backgroundColor: colorValue }}
                    onClick={() => setSelectedColor(color)}
                  ></button>
                );
              })}
              {/* Render color palettes as gradient buttons */}
              {product.color_palettes &&
                product.color_palettes.length > 0 &&
                product.color_palettes.map((palette, idx) => {
                  // Convert palette colors to hex
                  const hexColors = palette.map((color) => {
                    const colorStr = String(color);
                    if (colorStr.startsWith('#')) return colorStr;
                    try {
                      const intColor = parseInt(colorStr);
                      const r = (intColor >> 16) & 0xff;
                      const g = (intColor >> 8) & 0xff;
                      const b = intColor & 0xff;
                      return `#${r.toString(16).padStart(2, '0')}${g
                        .toString(16)
                        .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                    } catch {
                      return '#000000';
                    }
                  });
                  const gradient = `linear-gradient(90deg, ${hexColors.join(
                    ', '
                  )})`;
                  // For selection, use a stringified version of the palette as array of strings
                  const paletteKey = JSON.stringify(palette.map(String));
                  return (
                    <button
                      key={paletteKey}
                      className={`${styles.colorButton} ${
                        selectedColor === paletteKey ? styles.selected : ''
                      }`}
                      style={{ background: gradient }}
                      onClick={() => setSelectedColor(paletteKey)}
                    ></button>
                  );
                })}
            </div>
          </div>

          <div className={styles.optionGroup}>
            <p>Quantity:</p>
            <div className={styles.quantitySelector}>
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                -
              </button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)}>+</button>
            </div>
          </div>

          <div className={styles.actionButtons}>
            <button className={styles.addToCart} onClick={handleAddToCart}>
              ADD TO CART
            </button>
            <button
              onClick={handleToggleFavorite}
              className={`${styles.favoriteButton}`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <HeartIcon
                size={18}
                filled={isFavorite}
                color={isFavorite ? '#e6994b' : 'currentColor'}
              />
              <span>{isFavorite ? 'REMOVE FAVORITE' : 'ADD TO FAVORITE'}</span>
            </button>
          </div>
        </div>

        {isCarouselOpen && (
          <div className={styles.carouselOverlay}>
            <button className={styles.closeButton} onClick={closeCarousel}>
              <IoClose size={40} />
            </button>
            <button
              className={`${styles.navButton} ${styles.prevButton}`}
              onClick={prevImage}
            >
              <GrPrevious size={40} />
            </button>
            <div className={styles.carouselImageContainer}>
              <img
                src={product.images[carouselIndex]}
                alt={product.image_descriptions[carouselIndex] ?? product.name}
                className={styles.carouselImage}
                onError={(e) => {
                  e.target.src = '/images/placeholder.jpg';
                }}
                priority={true}
                quality='high'
                blur={false}
                style={{
                  maxHeight: '90vh',
                  width: 'auto',
                  objectFit: 'contain',
                  margin: '0 auto',
                  display: 'block',
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                  border: 'none',
                }}
              />
            </div>
            <button
              className={`${styles.navButton} ${styles.nextButton}`}
              onClick={nextImage}
            >
              <GrNext size={40} />
            </button>
          </div>
        )}
      </div>
      <ProductTabs
        descriptionText={product.description || ''}
        featuresText={product.features || ''}
      />
      <CartSidebar isOpen={cartSidebarOpen} onClose={closeCartSidebar} />
    </>
  );
};

export default ProductDetails;
