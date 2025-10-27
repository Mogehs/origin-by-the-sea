import { Header, Footer } from '../components';
import { Outlet } from 'react-router-dom';
import styles from './SharedLayout.module.css';
const SharedLayout = () => {
  return (
    <div className={styles.layoutContainer}>
      <Header />
      <main className={styles.mainContent}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default SharedLayout;
