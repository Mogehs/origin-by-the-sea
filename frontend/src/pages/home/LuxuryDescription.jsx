import styles from './css/LuxuryDescription.module.css';

const LuxuryDescription = ({subtitle,description}) => {

  console.log(`this is subtitle ${subtitle} and descrition ${description}`);
  return (
    <section className={styles.luxurySection}>
      <h2 className={styles.heading}>{subtitle}</h2>
      <div className={styles.container}>
        <p className={styles.description}>{description}</p>
        
      </div>
    </section>
  );
};

export default LuxuryDescription;
