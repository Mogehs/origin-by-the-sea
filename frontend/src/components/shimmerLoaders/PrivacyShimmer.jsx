import React from 'react';
import { ShimmerText } from '../ShimmerLoading/ShimmerLoading';
import styles from '../../pages/privacyPolicy/Policy.module.css';

export const PrivacyShimmer = () => {
  return (
    <div className={styles.container}>
      <div className={styles.mainTitle}>
        <ShimmerText width="250px" height="40px" />
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.date}>
          <ShimmerText width="200px" />
        </div>

        {[...Array(9)].map((_, index) => (
          <div key={index} className={styles.section}>
            <div className={styles.title}>
              <ShimmerText width="250px" height="28px" />
            </div>
            <div className={styles.text}>
              <ShimmerText lines={3} width="100%" />
              {index === 2 || index === 3 || index === 5 ? (
                <div className={styles.bulletList}>
                  {[...Array(6)].map((_, i) => (
                    <ShimmerText key={i} width="80%" />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
