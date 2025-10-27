import React, { useState, useEffect } from 'react';
import styles from './Policy.module.css';
import { getTermsContent } from '../../services/termsService';
import { TermsShimmer } from '../../components/shimmerLoaders/TermsShimmer';

const TermsAndConditions = () => {
  const [termsContent, setTermsContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTermsContent = async () => {
      try {
        const content = await getTermsContent();
        setTermsContent(content);
        console.log('Fetched terms content:', content);
      } catch (error) {
        console.error('Error loading terms content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTermsContent();
  }, []);

  if (loading) {
    return <TermsShimmer />;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.mainTitle}>{termsContent?.title || 'Terms and Conditions'}</h1>      <div className={styles.contentWrapper}>
        <p className={styles.date}>
          Last Updated: {termsContent?.effectiveDate ? 
            new Date(termsContent.effectiveDate.seconds * 1000).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 
            termsContent?.createdAt ? 
            new Date(termsContent.createdAt.seconds * 1000).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : ''}
        </p>

        {termsContent?.sections?.map((section, index) => (
        <div key={index} className={styles.section}>
            <h2 className={styles.title}>{section.heading}</h2>
            <div className={styles.text}>
              {section.description?.split('\\n').map((paragraph, pIndex) => (
                <p key={pIndex}>{paragraph}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TermsAndConditions;
