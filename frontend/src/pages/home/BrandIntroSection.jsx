import styles from './css/BrandIntroSection.module.css';

const BrandIntroSection = () => {
  return (
    <section className={styles.brandIntro}>
      <div className={styles.overlay}>
        <div className={styles.content}>
          <h1>
            <span className={styles.highlight}>Origin by the Sea</span> - Where
            Craftsmanship Meets Elegance
          </h1>
          <p className={styles.description}>
            At Origin by the Sea, we celebrate craftsmanship, sustainability,
            and timeless style. Inspired by the ocean’s beauty, our handmade
            swimwear, crop tops, dresses, waterproof jewelry, and artisanal
            accessories are designed for every occasion.
          </p>
          <p className={styles.description}>
            Each piece reflects our passion for ethical fashion and
            individuality, ensuring you wear something truly unique.
          </p>
          <p className={styles.description}>
            Sustainably made. Elegantly crafted. Worn with purpose.
          </p>
        </div>
      </div>
    </section>
  );
};

export default BrandIntroSection;
