import React, { useEffect } from 'react';
import { AuthHeader } from '../../components';
import { AuthLoginBody } from './AuthLoginBody';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './css/Login.module.css';

const Login = () => {
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
  
  // If not authenticated, show login form
  return (
    <div>
      <AuthHeader />
      <AuthLoginBody />
    </div>
  );
};

export default Login;
