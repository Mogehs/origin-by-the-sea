import React from 'react';
import { ShimmerText } from '../ShimmerLoading/ShimmerLoading';
import styles from '../../pages/privacyPolicy/Policy.module.css';

export const TermsShimmer = () => {
  return (
    <div className={styles.container}>
      <div className={styles.mainTitle}>
        <ShimmerText width="300px" height="40px" />
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.date}>
          <ShimmerText width="200px" />
        </div>

        {[...Array(11)].map((_, index) => (
          <div key={index} className={styles.section}>
            <div className={styles.title}>
              <ShimmerText width="250px" height="28px" />
            </div>
            <div className={styles.text}>
              <ShimmerText lines={3} width="100%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
