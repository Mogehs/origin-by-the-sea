import styles from './css/JewelryShowcase.module.css';

const JewelryShowcase = () => {
  return (
    <section className={styles.container}>
      <div className={styles.item}>
        <h2 className={styles.title}>
          WATERPROOF <span className={styles.highlight}>JEWELRY</span>
        </h2>
        <img
          src='/images/waterproof-jewelry.png'
          alt='Waterproof Jewelry'
          className={styles.image}
        />
      </div>

      <div className={styles.item}>
        <h2 className={styles.title}>
          ARTISANAL HANDMADE <br />
          ACCESSORIES{' '}
          <span className={styles.highlight}>FOR EVERY OCCASION</span>
        </h2>
        <img
          src='/images/handmade-accessories.png'
          alt='Handmade Accessories'
          className={styles.image}
        />
      </div>
    </section>
  );
};

export default JewelryShowcase;
