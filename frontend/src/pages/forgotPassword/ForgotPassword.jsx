import React, { useState } from 'react';
import styles from './ForgotPassword.module.css';
import { useNavigate } from 'react-router-dom';
import { AuthHeader } from '../../components';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email) {
      setMessage('Please enter your email address.');
      return;
    }

    // Simulate sending a password reset email
    setMessage(`A password reset link has been sent to ${email}`);
  };

  return (
    <div>
      <AuthHeader />
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Forgot Password</h2>
          <p className={styles.description}>
            Enter your email address below, and we’ll send you a link to reset
            your password.
          </p>
          {message && <p className={styles.message}>{message}</p>}
          <form onSubmit={handleSubmit}>
            <input
              type='email'
              placeholder='Enter your email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
            />
            <button type='submit' className={styles.submitButton}>
              Send Reset Link
            </button>
          </form>
          <button
            className={styles.backButton}
            onClick={() => navigate('/login')}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
