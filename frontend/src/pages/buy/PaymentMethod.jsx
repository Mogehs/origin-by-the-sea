import React, { useState } from 'react';
import styles from './css/Buy.module.css';

const PaymentMethod = () => {
  const [selected, setSelected] = useState('card');

  return (
    <div>
      <h3 className={styles.title}>Payment</h3>
      <div className={styles.paymentContainer}>
        <div
          className={`${styles.paymentBox} ${
            selected === 'card' ? styles.selected : ''
          }`}
          onClick={() => setSelected('card')}
        >
          <div className={styles.radioContainer}>
            <span className={styles.radio}></span>
            <span>Debit - Credit Card</span>
          </div>
          {selected === 'card' && (
            <div className={styles.paymentDetails}>
              <img
                src='/images/credit-card.png'
                alt='Credit Card'
                className={styles.icon}
              />
              <p className={styles.description}>
                After clicking “Pay now”, you will be redirected Debit-Credit
                <br />
                Card to complete your purchase securely.
              </p>
            </div>
          )}
        </div>

        <div
          className={`${styles.paymentBox} ${
            selected === 'cod' ? styles.selected : ''
          }`}
          onClick={() => setSelected('cod')}
        >
          <div className={styles.radioContainer}>
            <span className={styles.radio}></span>
            <span>Cash on Delivery</span>
          </div>
        </div>

        <div
          className={`${styles.paymentBox} ${
            selected === 'bank' ? styles.selected : ''
          }`}
          onClick={() => setSelected('bank')}
        >
          <div className={styles.radioContainer}>
            <span className={styles.radio}></span>
            <span>Bank Deposit</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethod;
