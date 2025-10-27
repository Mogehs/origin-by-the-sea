import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BiMenuAltRight } from 'react-icons/bi';
import { CiUser } from 'react-icons/ci';
import { BsCart2 } from 'react-icons/bs';
import { IoMdClose } from 'react-icons/io';
import { HeartIcon } from '../Icons';
import { useSelector } from 'react-redux';
import Menu from './Menu';
import styles from './css/Header.module.css';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Shop', path: '/shop' },
  { name: 'About', path: '/about' },
  { name: 'Dresses', path: '/shop?id=3' },
  { name: 'Swimwear', path: '/shop?id=1' },
  { name: 'Crop Top', path: '/shop?id=2' },
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Get favorites count from Redux store
  const favorites = useSelector((state) => state.favorites.favorites);
  const favoritesCount = favorites.length;

  // Get cart items count from Redux store
  const cartItems = useSelector((state) => state.cart.cartItems);
  const cartItemsCount = cartItems.length;

  // Toggle Menu
  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Handle navigation with scroll to top
  const handleNavigation = (e, path) => {
    if (!e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      navigate(path);
      window.scrollTo(0, 0);
    }
  };

  // Badge style to reuse for both favorites and cart
  const badgeStyle = {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    backgroundColor: '#e6994b',
    color: 'white',
    borderRadius: '50%',
    width: '16px',
    height: '16px',
    fontSize: '10px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 'bold',
  };

  return (
    <>
      <header className={styles.container}>
        <div className={styles.navbarContainer}>
          {/* Icons Container */}
          <div className={styles.searchContainer}>
            <Link
              to='/favorites'
              className={styles.favoriteIcon}
              onClick={(e) => handleNavigation(e, '/favorites')}
              aria-label='Favorites'
            >
              <div style={{ position: 'relative' }}>
                <HeartIcon size={22} color='currentColor' />
                {favoritesCount > 0 && (
                  <span style={badgeStyle}>
                    {favoritesCount > 99 ? '99+' : favoritesCount}
                  </span>
                )}
              </div>
            </Link>
            <Link
              to='/account'
              className={styles.loginIcon}
              onClick={(e) => handleNavigation(e, '/account')}
              aria-label='Account'
            >
              <CiUser size={22} />
            </Link>
            <Link
              to='/cart'
              className={styles.cartIcon}
              onClick={(e) => handleNavigation(e, '/cart')}
              aria-label='Cart'
            >
              <div style={{ position: 'relative' }}>
                <BsCart2 size={22} />
                {cartItemsCount > 0 && (
                  <span style={badgeStyle}>
                    {cartItemsCount > 99 ? '99+' : cartItemsCount}
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* Logo */}
          <Link
            to='/'
            className={styles.logoContainer}
            onClick={(e) => handleNavigation(e, '/')}
          >
            <img
              className={styles.logo}
              src='/images/logo.png'
              alt='Website Logo'
            />
          </Link>

          {/* Menu Button - now on right for mobile */}
          <div className={styles.menuButton} onClick={toggleMenu}>
            <BiMenuAltRight size={28} />
          </div>

          {/* Navigation Links */}
          <ul className={styles.navList}>
            {navLinks.map((link, index) => (
              <li key={index} className={styles.navItem}>
                <NavLink
                  to={link.path}
                  end={link.path === '/'} // Ensures exact matching for the home link only
                  className={styles.navLink}
                  onClick={(e) => handleNavigation(e, link.path)}
                >
                  {link.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <Menu isOpen={menuOpen} toggleMenu={toggleMenu} />
    </>
  );
};

export default Header;
