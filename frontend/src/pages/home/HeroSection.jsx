import { useEffect, useRef, useState } from 'react';
import styles from './css/HeroSection.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHeroData } from '../../features/product/heroSlice';
import LuxuryDescription from './LuxuryDescription';
import { Link } from 'react-router-dom';
const HeroSection = () => {
  const videoRef = useRef(null);
  const imgRef = useRef(null);
  const [showContent, setShowContent] = useState(false);

  const dispatch = useDispatch();
  const { data: heroData, isLoading } = useSelector((state) => state.hero);

  useEffect(() => {
    if (!heroData) {
      dispatch(fetchHeroData());
    } else {
      // Delay for transition
      setTimeout(() => {
        setShowContent(true);
      }, 500);
    }
  }, [heroData, dispatch]);

  // Handle video error fallback
  useEffect(() => {
    const video = videoRef.current;
    const img = imgRef.current;

    const handleVideoError = () => {
      if (img) {
        img.style.display = 'block';
      }
    };

    if (video) {
      video.addEventListener('error', handleVideoError);
      video.addEventListener('stalled', handleVideoError);
    }

    return () => {
      if (video) {
        video.removeEventListener('error', handleVideoError);
        video.removeEventListener('stalled', handleVideoError);
      }
    };
  }, []);

  if (isLoading || !heroData) {
    return (
      <div className={styles.loading}>
        <div className={styles.shimmerBg} />
        <div className={styles.shimmerWrapper}>
          <div className={styles.shimmerTitle} />
          <div className={styles.shimmerButton} />
        </div>
      </div>
    );
  }

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroOverlay}></div>

        {heroData.backgroundVideo && (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload='auto'
            className={styles.heroVideo}
            style={{ opacity: showContent ? undefined : 0 }}
            onLoadedData={() => setShowContent(true)}
          >
            <source src={heroData.backgroundVideo} type='video/mp4' />
          </video>
        )}

        <img
          ref={imgRef}
          src={heroData.backgroundImage}
          alt='Hero banner'
          className={styles.heroImage}
          style={{ opacity: showContent ? undefined : 0 }}
          onLoad={() => setShowContent(true)}
        />

        <div
          className={styles.heroContent}
          style={{ opacity: showContent ? undefined : 0 }}
        >
          <h1>{heroData.title}</h1>
          <Link to='/shop' className={styles.shopNowButton}>
            {heroData.buttonText}
          </Link>
        </div>
      </section>
      <LuxuryDescription
        subtitle={heroData.subtitle}
        description={heroData.description}
      />
    </>
  );
};

export default HeroSection;
