import React from 'react';
import styles from './NotFound.module.css';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  const goToHome = () => {
    navigate('/');
    window.scrollTo(0, 0);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.errorCode}>404</h1>
      <h2 className={styles.message}>
        Oops! The page you're looking for doesn't exist.
      </h2>
      <p className={styles.description}>
        The page might have been removed, renamed, or is temporarily
        unavailable.
      </p>
      <button className={styles.homeButton} onClick={goToHome}>
        Go to Homepage
      </button>
    </div>
  );
};

export default NotFound;
