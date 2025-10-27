import React from 'react';
import styles from './css/Buy.module.css';

const AccountInput = () => {
  return (
    <div>
      <label className={styles.inputLabel}>Account</label>
      <input type='text' className={styles.inputField} placeholder='Account' />
    </div>
  );
};

export default AccountInput;
