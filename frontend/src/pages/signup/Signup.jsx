import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerWithEmailAndPassword, signInWithGoogle } from '../../services/authService';
import styles from './Signup.module.css';
import { FcGoogle } from 'react-icons/fc';
import { AuthHeader } from '../../components';
import { useAuth } from '../../context/AuthContext';

const SignupForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { user, error } = await signInWithGoogle();
      
      if (error) {
        setError(error.message || 'Failed to sign in with Google');
      } else if (user) {
        navigate('/');
      }
    } catch (err) {
      setError('An error occurred during Google sign in');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const { user, error } = await registerWithEmailAndPassword(
        formData.email,
        formData.password,
        {
          displayName: `${formData.firstName} ${formData.lastName}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          createdMethod: 'email'
        }
      );

      if (error) {
        setError(error.message || 'Failed to create account');
      } else if (user) {
        navigate('/');
      }
    } catch (err) {
      setError('An error occurred during signup');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.authContainer}>
      <div>
        <form className={styles.authForm} onSubmit={handleSubmit}>
          <h1 className={styles.authTitle}>Create Account</h1>
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <div className={styles.nameFields}>
            <div className={styles.authFormInputContainer}>
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                placeholder="First Name"
                className={styles.authFormInput}
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className={styles.authFormInputContainer}>
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Last Name"
                className={styles.authFormInput}
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className={styles.authFormInputContainer}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Email"
              className={styles.authFormInput}
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.authFormInputContainer}>
            <label htmlFor="phoneNumber">Phone Number (Optional)</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              placeholder="Phone Number"
              className={styles.authFormInput}
              value={formData.phoneNumber}
              onChange={handleChange}
            />
          </div>

          <div className={styles.authFormInputContainer}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              className={styles.authFormInput}
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <div className={styles.authFormInputContainer}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm Password"
              className={styles.authFormInput}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button 
            type="submit" 
            className={styles.loginBtn}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
          
          <button 
            type="button"
            onClick={handleGoogleSignIn}
            className={styles.googleBtn}
            disabled={loading}
          >
            <FcGoogle size={20} />
            <span>Sign up with Google</span>
          </button>
        </form>
      </div>
      <button
        onClick={() => navigate('/login')}
        className={styles.registerBtn}
        disabled={loading}
      >
        already have an account?
      </button>
    </section>
  );
};

const Signup = () => {
  const navigate = useNavigate();
  const auth = useAuth() || {};
  const { isAuthenticated = false, loading = false } = auth;
  
  // Redirect to home if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, loading, navigate]);
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }
  
  // If not authenticated, show signup form
  return (
    <div>
      <AuthHeader />
      <SignupForm />
    </div>
  );
};

export default Signup;
