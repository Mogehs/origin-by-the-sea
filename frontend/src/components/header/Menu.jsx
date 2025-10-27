import { Link, useNavigate } from 'react-router-dom';
import { AiOutlineClose } from 'react-icons/ai';
import styles from './css/Menu.module.css';

const menuItems = [
  { name: 'Dresses', path: '/shop?id=3' ,category: ''},
  { name: 'Swimwear', path: '/shop?id=1' ,category: ''},
  { name: 'Crop Top', path: '/shop?id=2' ,category: ''},
  { name: 'Shop', path: '/shop', category: '' },
  { name: 'About', path: '/about', category: '' },
  { name: 'Favorites', path: '/favorites', category: '' },
];

const Menu = ({ isOpen, toggleMenu }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleMenuItemClick = (path, category) => {
    const url = category ? `${path}?category=${category}` : path;
    toggleMenu();
    navigate(url);
    window.scrollTo(0, 0);
  };

  return (
    <div className={styles.overlay} onClick={toggleMenu}>
      <div className={styles.menu} onClick={(e) => e.stopPropagation()}>
        <div className={styles.menuHeader}>
          {/* Logo */}
          <Link
            to='/'
            onClick={() => {
              toggleMenu();
              window.scrollTo(0, 0);
            }}
          >
            <img
              className={styles.menuLogo}
              src='/images/logo.png'
              alt='Origin by the Sea'
            />
          </Link>

          {/* Close Button */}
          <div className={styles.closeButton} onClick={toggleMenu}>
            {/* <span>Close</span> */}
            <AiOutlineClose size={24} />
          </div>
        </div>
        <hr className={styles.menuDivider} />

        {/* Navigation Links */}
        <nav>
          <ul className={styles.menuList}>
            {menuItems.map((item, index) => (
              <li key={index}>
                <div
                  className={styles.menuLink}
                  onClick={() => handleMenuItemClick(item.path, item.category)}
                >
                  {item.name} <span>&#8250;</span>
                </div>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Menu;
