import { Link, useNavigate } from 'react-router-dom';
import styles from './css/ImageCollage.module.css';

const images = [
  {
    id: 1,
    src: '/images/crochet-romper.png',
    alt: 'Crochet Romper on the Beach',
  },
  {
    id: 2,
    src: '/images/coconut-bikini.png',
    alt: 'Woman Holding Coconut in Crochet Bikini',
  },
  {
    id: 3,
    src: '/images/flatlay-swimsuit.png',
    alt: 'Flatlay of Handmade Crochet Swimsuit',
  },
  {
    id: 4,
    src: '/images/boho-swimsuit.png',
    alt: 'Boho Style Crochet Swimsuit Close-up',
  },
  {
    id: 5,
    src: '/images/waves-bikini.png',
    alt: 'Woman in Crochet Bikini by the Waves',
  },
];

const columns = [[0], [1, 3], [2, 4]]; // Defines the image structure for 3 columns

const ImageCollage = () => {
  const navigate = useNavigate();

  const handleNavigation = (e, path) => {
    if (!e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      navigate(path);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div>
      <div className={styles.collageContainer}>
        {columns.map((group, index) => (
          <div key={index} className={styles[`column${index + 1}`]}>
            {group.map((i) => (
              <Link
                key={images[i].id}
                to={`/shop/${images[i].id}`}
                onClick={(e) => handleNavigation(e, `/shop/${images[i].id}`)}
              >
                <img
                  src={images[i].src}
                  alt={images[i].alt}
                  className={images[i].className}
                />
              </Link>
            ))}
          </div>
        ))}
      </div>

      <button
        className={styles.viewMoreBtn}
        onClick={() => {
          navigate('/shop');
          window.scrollTo(0, 0);
        }}
      >
        view all products
      </button>
    </div>
  );
};

export default ImageCollage;
