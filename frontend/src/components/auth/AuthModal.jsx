import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setGuestCheckout } from '../../features/guestSlice';
import { FcGoogle } from 'react-icons/fc';
import { toast } from 'react-toastify';
import styles from './AuthModal.module.css';
import { signInWithEmail, signInWithGoogle } from '../../services/authService';

const AuthModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Import from services instead of context to match the login page implementation

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const { user, error } = await signInWithGoogle();

      if (error) {
        setError(error.message);
        toast.error(
          error.message || 'Failed to sign in with Google. Please try again.'
        );
      } else if (user) {
        onClose();
      }
    } catch (error) {
      const errorMessage = 'Failed to sign in with Google. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const { user, error } = await signInWithEmail(email, password);

      if (error) {
        setError(error.message);
        toast.error(
          error.message || 'Failed to sign in. Please check your credentials.'
        );
      } else if (user) {
        onClose();
      }
    } catch (error) {
      const errorMessage =
        'Failed to sign in. Please check your credentials and try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestCheckout = () => {
    localStorage.setItem('isGuestUser', 'true');
    dispatch(setGuestCheckout(true));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        <h2>Sign In to Continue</h2>
        <p>Please sign in to complete your purchase</p>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <button
          className={styles.googleButton}
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <FcGoogle size={20} />
          <span>Continue with Google</span>
        </button>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <form onSubmit={handleEmailSignIn}>
          <input
            type='email'
            name='email'
            placeholder='Email'
            required
            disabled={loading}
          />
          <input
            type='password'
            name='password'
            placeholder='Password'
            required
            disabled={loading}
          />
          <button
            type='submit'
            className={styles.emailButton}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In with Email'}
          </button>
        </form>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <button
          className={styles.guestButton}
          onClick={handleGuestCheckout}
          disabled={loading}
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
