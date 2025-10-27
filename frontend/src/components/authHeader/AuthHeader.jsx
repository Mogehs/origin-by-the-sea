import { Link, useNavigate } from 'react-router-dom';
import styles from './AuthHeader.module.css';
import { BsCart2 } from 'react-icons/bs';
import { CiUser } from 'react-icons/ci';
import { HeartIcon } from '../Icons';

const AuthHeader = () => {
  const navigate = useNavigate();

  const handleNavigation = (e, path) => {
    if (!e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      navigate(path);
      window.scrollTo(0, 0);
    }
  };

  return (
    <nav className={styles.container}>
      <div className={styles.navbarContainer}>
        <Link to='/' onClick={(e) => handleNavigation(e, '/')}>
          <img className={styles.logo} src='/images/logo.png' alt='logo' />
        </Link>
        <ul className={styles.navList}>
          <li className={styles.navItem}>
            <Link
              to='/account'
              className={styles.navLink}
              onClick={(e) => handleNavigation(e, '/account')}
            >
              <CiUser size={20} />
              <span>Account</span>
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link
              to='/favorites'
              className={styles.navLink}
              onClick={(e) => handleNavigation(e, '/favorites')}
            >
              <HeartIcon size={20} />
              <span>Favorites</span>
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link
              to='/cart'
              className={styles.navLink}
              onClick={(e) => handleNavigation(e, '/cart')}
            >
              <BsCart2 size={20} />
              <span>Cart</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default AuthHeader;
