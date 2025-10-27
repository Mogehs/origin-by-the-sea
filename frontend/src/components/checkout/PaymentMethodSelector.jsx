import React from 'react';
import styles from './PaymentMethodSelector.module.css';

const PAYMENT_METHODS = [
  {
    id: 'cod',
    name: 'Cash On Delivery',
    description: 'Pay when you receive your order',
    icon: '💵'
  },
  {
    id: 'card',
    name: 'Credit / Debit Card',
    description: 'Pay securely with your card',
    icon: '💳'
  }
];

const PaymentMethodSelector = ({ 
  selectedMethod,
  onMethodSelect 
}) => {
  const handleSelect = (methodId) => {
    console.log('🎯 Payment method selected:', methodId);
    console.log('🎯 Current selected method:', selectedMethod);
    console.log('🎯 Calling onMethodSelect with:', methodId);
    onMethodSelect(methodId);
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Payment Method</h3>
      
      <div className={styles.methodsContainer}>
        {PAYMENT_METHODS.map((method) => (
          <div 
            key={method.id}
            className={`${styles.methodCard} ${selectedMethod === method.id ? styles.selected : ''}`}
            onClick={() => handleSelect(method.id)}
          >
            <div className={styles.methodIcon}>{method.icon}</div>
            <div className={styles.methodInfo}>
              <div className={styles.methodName}>{method.name}</div>
              <div className={styles.methodDescription}>{method.description}</div>
            </div>
            <div className={styles.methodRadio}>
              <div className={styles.radio}>
                <div className={selectedMethod === method.id ? styles.radioSelected : ''}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethodSelector; 