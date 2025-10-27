import React, { useState } from 'react';
import styles from './css/ProductTabs.module.css'; // Importing CSS module

const ProductTabs = ({ descriptionText, featuresText }) => {
  const [activeTab, setActiveTab] = useState('description');
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className={styles.productTabs}>
      <div className={styles.tabButtons}>
        <button
          className={activeTab === 'description' ? styles.active : ''}
          onClick={() => {
            setActiveTab('description');
            setExpanded(false);
          }}
        >
          Description
        </button>
        <button
          className={activeTab === 'features' ? styles.active : ''}
          onClick={() => {
            setActiveTab('features');
            setExpanded(false);
          }}
        >
          Features
        </button>
      </div>
      <div className={styles.tabContent}>
        <h3 className={styles.tabTitle}>
          Product {activeTab === 'description' ? 'Description' : 'Features'}:
        </h3>
        <p className={expanded ? styles.expanded : styles.collapsed}>
          {activeTab === 'description'
            ? descriptionText
            : featuresText}
        </p>
        <div className={styles.fadeEffect}>
          <button onClick={() => setExpanded(!expanded)}>
            {expanded ? 'See less' : 'See more'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductTabs;
