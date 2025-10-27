import { useState, useEffect } from 'react';
import styles from './About.module.css';
import { MdOutlineHandshake, MdOutlineEnergySavingsLeaf } from 'react-icons/md';
import { GiSewingNeedle } from 'react-icons/gi';
import { getAboutContent } from '../../services/aboutService';
import { ShimmerText, ShimmerImage, ShimmerCard, ShimmerSection } from '../../components/ShimmerLoading/ShimmerLoading';
import SEO from '../../components/SEO';
import OptimizedImage from '../../components/OptimizedImage/OptimizedImage';

const About = () => {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchContent = async () => {
      try {
        const content = await getAboutContent();
        console.log('Fetched about content:', content);
        
        if (!content) {
          throw new Error('No content received from Firebase');
        }
        
        setAboutData(content);
      } catch (err) {
        console.error('Failed to fetch about content:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Oops!</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  const seoData = {
    title: aboutData?.heroTitle ? `${aboutData.heroTitle} | Origin By The Sea` : 'About Us | Origin By The Sea',
    description: aboutData?.heroSubtitle || 'Learn about our passion for sustainable fashion, our commitment to craftsmanship, and our journey to create beautiful, ethical clothing.',
    ogImage: aboutData?.heroBackgroundImage || 'https://originsbythesea.com/images/hero-banner.jpg',
    canonicalUrl: 'https://originsbythesea.com/about',
    keywords: 'sustainable fashion, ethical clothing, handcrafted fashion, about origin by the sea, fashion craftsmanship, eco-friendly fashion',
    type: 'website',
    pageType: 'AboutPage',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: aboutData?.heroTitle || 'About Origin By The Sea',
      description: aboutData?.heroSubtitle || 'Learn about our sustainable fashion journey',
      publisher: {
        '@type': 'Organization',
        name: 'Origin By The Sea',
        logo: {
          '@type': 'ImageObject',
          url: 'https://originsbythesea.com/images/logo.png'
        }
      },
      image: aboutData?.heroBackgroundImage || 'https://originsbythesea.com/images/hero-banner.jpg',
      url: 'https://originsbythesea.com/about',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://originsbythesea.com/about'
      }
    }
  };

  return (
    <div className={styles.aboutContainer}>
      <SEO {...seoData} />
      
      {/* Hero Section */}
      <section 
        className={styles.heroSection}
        style={aboutData?.heroBackgroundImage ? {
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${aboutData.heroBackgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        } : {}}
      >
        <div className={styles.overlay}>
          <div className={styles.heroContent}>
            {loading ? (
              <ShimmerSection type="hero" />
            ) : (
              <>
                {aboutData?.heroTitle && <h1>{aboutData.heroTitle}</h1>}
                {aboutData?.heroSubtitle && (
                  <p className={styles.tagline}>{aboutData.heroSubtitle}</p>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className={styles.storySection}>
        <div className={styles.storyContainer}>
          {loading ? (
            <ShimmerSection type="story" />
          ) : (
            <>
              {aboutData?.storyTitle && (
                <h2 className={styles.sectionTitle}>{aboutData.storyTitle}</h2>
              )}
              <div className={styles.storyContent}>
                {aboutData?.story && (
                  <div className={styles.storyText}>
                    <div dangerouslySetInnerHTML={{ __html: aboutData.story }} />
                  </div>
                )}
                {aboutData?.storyImage && (
                  <div className={styles.storyImage}>
                    <img 
                      src={aboutData.storyImage}
                      alt="Our Story"
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        display: 'block',
                        maxHeight: '500px'
                      }}
                      onError={(e) => {
                        console.error('Error loading story image:', aboutData.storyImage);
                        e.target.src = '/images/brand-intro.png';
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Values Section */}
      <section className={styles.valuesSection}>
        <div className={styles.valuesContainer}>
          {loading ? (
            <ShimmerSection type="values" />
          ) : (
            <>
              <h2 className={styles.sectionTitle}>Our Values</h2>
              <div className={styles.valuesGrid}>
                {aboutData?.values?.map((value, index) => {
                  let Icon = GiSewingNeedle;
                  if (value.title?.toLowerCase().includes('sustainability')) {
                    Icon = MdOutlineEnergySavingsLeaf;
                  } else if (value.title?.toLowerCase().includes('community')) {
                    Icon = MdOutlineHandshake;
                  }
                  
                  return (
                    <div className={styles.valueCard} key={index}>
                      <div className={styles.iconContainer}>
                        <Icon size={40} />
                      </div>
                      <h3>{value.title}</h3>
                      <p>{value.description}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Craftsmanship Section */}
      <section className={styles.craftSection}>
        <div className={styles.craftContainer}>
          {loading ? (
            <ShimmerSection type="craftsmanship" />
          ) : (
            <>
              <div className={styles.craftText}>
                {aboutData?.craftsmanshipTitle && (
                  <h2 className={styles.sectionTitle}>{aboutData.craftsmanshipTitle}</h2>
                )}
                {aboutData?.craftsmanship && (
                  <div dangerouslySetInnerHTML={{ __html: aboutData.craftsmanship }} />
                )}
                <button className={styles.shopButton} onClick={() => window.location.href = '/shop'}>
                  View all Collections
                </button>
              </div>
              {aboutData?.craftsmanshipImage && (
                <div className={styles.craftImageContainer}>
                  <img 
                    className={styles.craftGallery}
                    src={aboutData.craftsmanshipImage}
                    alt="Craftsmanship"
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      display: 'block',
                      maxHeight: '600px'
                    }}
                    onError={(e) => {
                      console.error('Error loading craftsmanship image:', aboutData.craftsmanshipImage);
                      e.target.src = '/images/crafts-man-ship-1.png';
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Team Section */}
      <section className={styles.teamSection}>
        <div className={styles.teamContainer}>
          {loading ? (
            <ShimmerSection type="team" />
          ) : (
            <>
              {aboutData?.teamTitle && (
                <h2 className={styles.sectionTitle}>{aboutData.teamTitle}</h2>
              )}
              <div className={styles.teamIntro}>
                <p>{aboutData.team}</p>
              </div>
              {(aboutData?.commitmentTitle || aboutData?.commitmentDescription || aboutData?.companyName) && (
                <div className={styles.commitment}>
                  {aboutData?.commitmentTitle && <h3>{aboutData.commitmentTitle}</h3>}
                  {aboutData?.commitmentDescription && (
                    <div dangerouslySetInnerHTML={{ __html: aboutData.commitmentDescription }} />
                  )}
                  {aboutData?.companyName && (
                    <p className={styles.signature}>
                      With gratitude,<br />
                      <span>{aboutData.companyName}</span>
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default About;
