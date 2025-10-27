import styles from './css/AuthLoginBody.module.css';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { signInWithEmail, signInWithGoogle } from '../../services/authService';
import { FcGoogle } from 'react-icons/fc';
import { useDispatch } from 'react-redux';
import { setGuestCheckout } from '../../features/guestSlice';

export const AuthLoginBody = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { user, error } = await signInWithGoogle();

      if (error) {
        setError(error.message);
      } else if (user) {
        navigate('/');
      }
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { user, error } = await signInWithEmail(
        formData.email,
        formData.password
      );

      if (error) {
        setError(error.message);
      } else if (user) {
        navigate('/');
      }
    } catch (err) {
      setError(
        'Failed to sign in. Please check your credentials and try again.'
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestCheckout = () => {
    // Set guest flag in localStorage
    localStorage.setItem('isGuestUser', 'true');
    // Update Redux store
    dispatch(setGuestCheckout(true));
    // Navigate to home
    navigate('/');
  };

  return (
    <section className={styles.authContainer}>
      <div>
        <form className={styles.authForm} onSubmit={handleSubmit}>
          <h1 className={styles.authTiltle}>Login</h1>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.authFormInputContainer}>
            <label htmlFor='email'>Email</label>
            <input
              type='email'
              name='email'
              placeholder='Email'
              className={styles.authFormInput}
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className={styles.authFormInputContainer}>
            <label htmlFor='password'>Password</label>
            <input
              type='password'
              name='password'
              placeholder='Password'
              className={styles.authFormInput}
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <Link to='/forgot-password' className={styles.forgotPassword}>
              forgot password?
            </Link>
          </div>

          <button type='submit' className={styles.loginBtn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <button
            type='button'
            onClick={handleGoogleSignIn}
            className={styles.googleBtn}
            disabled={loading}
          >
            <FcGoogle size={20} />
            <span>Sign in with Google</span>
          </button>

          <div className={styles.divider}>
            <span>OR</span>
          </div>

          <button
            type='button'
            onClick={handleGuestCheckout}
            className={styles.guestBtn}
            disabled={loading}
          >
            Continue as Guest
          </button>
        </form>
      </div>
      <button
        onClick={() => navigate('/signup')}
        className={styles.registerBtn}
        disabled={loading}
      >
        create account
      </button>
    </section>
  );
};
