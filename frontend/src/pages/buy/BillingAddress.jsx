import React, { useState } from 'react';
import styles from './css/Buy.module.css';

const BillingAddress = () => {
  const [selected, setSelected] = useState('same');

  return (
    <div>
      <h3 className={styles.title}>Billing Address</h3>
      <div className={styles.billingContainer}>
        <div
          className={`${styles.billingBox} ${
            selected === 'same' ? styles.selected : ''
          }`}
          onClick={() => setSelected('same')}
        >
          <span className={styles.radio}>
            {selected === 'same' && <span className={styles.innerCircle} />}
          </span>
          Same as shipping address
        </div>
        <div
          className={`${styles.billingBox} ${
            selected === 'different' ? styles.selected : ''
          }`}
          onClick={() => setSelected('different')}
        >
          <span className={styles.radio}>
            {selected === 'different' && (
              <span className={styles.innerCircle} />
            )}
          </span>
          Use a different billing address
        </div>
      </div>
    </div>
  );
};

export default BillingAddress;
