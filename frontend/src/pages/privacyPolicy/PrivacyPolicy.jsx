import React, { useState, useEffect } from 'react';
import styles from './Policy.module.css';
import { getPrivacyContent } from '../../services/privacyService';
import { PrivacyShimmer } from '../../components/shimmerLoaders/PrivacyShimmer';

const PrivacyPolicy = () => {
  const [privacyContent, setPrivacyContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrivacyContent = async () => {
      try {
        const content = await getPrivacyContent();
        setPrivacyContent(content);
      } catch (error) {
        console.error('Error loading privacy content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacyContent();
  }, []);

  if (loading) {
    return <PrivacyShimmer />;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.mainTitle}>{privacyContent?.title || 'Privacy Policy'}</h1>

      <div className={styles.contentWrapper}>
        <p className={styles.date}>
          Last Updated: {privacyContent?.effectiveDate ? 
            new Date(privacyContent.effectiveDate.seconds * 1000).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 
            privacyContent?.createdAt ? 
            new Date(privacyContent.createdAt.seconds * 1000).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : ''}</p>        {privacyContent?.sections?.map((section, index) => (
          <div key={index} className={styles.section}>
            <h2 className={styles.title}>{section.heading}</h2>
            <div className={styles.text}>
              {section.description.split('\\n').map((paragraph, pIndex) => (
                <p key={pIndex} className={styles.text}>{paragraph}</p>
              ))}
              {section.bulletPoints && section.bulletPoints.length > 0 && (
                <ul className={styles.bulletList}>
                  {section.bulletPoints.map((point, pointIndex) => (
                    <li key={pointIndex} dangerouslySetInnerHTML={{ __html: point }} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrivacyPolicy;
