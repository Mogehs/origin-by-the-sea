import React from 'react';
import styles from './css/Modal.module.css';
import { Link, useNavigate } from 'react-router-dom';

const Modal = ({ isOpen, onClose, onSignUp, onContinueAsGuest }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLoginClick = (e) => {
    if (!e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      onClose();
      navigate('/login');
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>
          Create an Account and Secure Your Shopping History!
        </h2>
        <div className={styles.imageContainer}>
          <img src='/images/popup-modal-image.png' alt='Secure Shopping' />
        </div>
        <p className={styles.description}>
          Sign up now to save your order history, track purchases, and get
          exclusive offers. Already have an account? Just &nbsp;
          <Link
            to='/login'
            className={styles.loginLink}
            onClick={handleLoginClick}
          >
            Log In
          </Link>
        </p>
        <p className={styles.subText}>
          Or, continue as a guest to proceed with your purchase without saving
          your order history.
        </p>

        <div className={styles.actions}>
          <button className={styles.signUpBtn} onClick={onSignUp}>
            Sign Up & Save
          </button>
          <button className={styles.guestBtn} onClick={onContinueAsGuest}>
            Continue as Guest
          </button>
        </div>
      </div>
      <div className={styles.backdrop} onClick={onClose}></div>
    </div>
  );
};

export default Modal;
