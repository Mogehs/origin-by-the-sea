import React from 'react';
import styles from './css/Buy.module.css';

const DeliveryForm = () => {
  return (
    <div>
      <h3 className={styles.title}>Delivery</h3>
      <label className={styles.DeliveryFormLabel}>Country/Region:</label>
      <select className={styles.inputField}>
        <option value='Pakistan'>Pakistan</option>
        <option value='Pakistan'>UAE</option>
        <option value='Pakistan'>Egypt</option>
        <option value='Pakistan'>Saudi Arabia</option>
      </select>

      <div className={styles.flexRow}>
        <div>
          <label className={styles.DeliveryFormLabel}>First Name:</label>
          <input
            type='text'
            className={styles.inputField}
            placeholder='First Name'
          />
        </div>
        <div>
          <label className={styles.DeliveryFormLabel}>Last Name:</label>
          <input
            type='text'
            className={styles.inputField}
            placeholder='Last Name'
          />
        </div>
      </div>

      <input type='text' className={styles.inputField} placeholder='Address' />
      <input
        type='text'
        className={styles.inputField}
        placeholder='Apartment, suite (optional)'
      />
      <input type='text' className={styles.inputField} placeholder='City' />
      <input type='text' className={styles.inputField} placeholder='Phone' />

      <button className={styles.useSavedAddress}>Use saved address</button>
    </div>
  );
};

export default DeliveryForm;
