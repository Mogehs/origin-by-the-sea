import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import styles from './StripePaymentForm.module.css';

const cardStyle = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: 'Arial, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

const StripePaymentForm = ({ 
  amount, 
  clientSecret,
  billingDetails,
  onPaymentSuccess, 
  onPaymentError 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [succeeded, setSucceeded] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Reset state if clientSecret changes (like for a new payment)
    if (clientSecret) {
      setError(null);
      setSucceeded(false);
      setProcessing(false);
    }
  }, [clientSecret]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe hasn't loaded yet
      return;
    }
    
    if (!clientSecret) {
      setError("Payment not initialized. Please try again.");
      return;
    }

    setProcessing(true);
    
    const cardElement = elements.getElement(CardElement);
    
    try {
      // Process payment with Stripe
      const payload = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: billingDetails
        }
      });

      if (payload.error) {
        setError(`Payment failed: ${payload.error.message}`);
        setProcessing(false);
        if (onPaymentError) onPaymentError(payload.error);
      } else {
        setError(null);
        setSucceeded(true);
        setProcessing(false);
        if (onPaymentSuccess) onPaymentSuccess(payload.paymentIntent);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('An unexpected error occurred. Please try again.');
      setProcessing(false);
      if (onPaymentError) onPaymentError(error);
    }
  };

  const handleCardChange = (event) => {
    // Listen for changes in the card details
    setError(event.error ? event.error.message : '');
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.paymentForm}>
        <div className={styles.formGroup}>
          <label htmlFor="card-element">Credit or debit card</label>
          <div className={styles.cardElementWrapper}>
            <CardElement 
              id="card-element" 
              options={cardStyle} 
              onChange={handleCardChange} 
            />
          </div>
        </div>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        <button 
          disabled={processing || !stripe || succeeded}
          className={styles.payButton}
        >
          {processing ? 'Processing...' : `Pay ${(amount/100).toFixed(2)}`}
        </button>
        
        {succeeded && (
          <div className={styles.successMessage}>
            Payment succeeded! Thank you for your purchase.
          </div>
        )}
      </form>
    </div>
  );
};

export default StripePaymentForm; 