import React from 'react';
import styles from './css/Buy.module.css';

const ShipmentMethod = () => {
  return (
    <div>
      <h3 className={styles.title}>Shipment Method</h3>
      <div className={styles.shipmentBox}>Free Shipping - Free</div>
    </div>
  );
};

export default ShipmentMethod;
