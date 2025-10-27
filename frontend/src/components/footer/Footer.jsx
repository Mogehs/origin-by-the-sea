import React, { useEffect, useState } from 'react';
import styles from './Footer.module.css';
import { FaFacebookF, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase'; // adjust path as needed
import { doc, getDoc } from 'firebase/firestore';

const Footer = () => {
  const navigate = useNavigate();
  const [contactInfo, setContactInfo] = useState({});
  const [socialLinks, setSocialLinks] = useState({});

  useEffect(() => {
    const fetchFooterContent = async () => {
      try {
        const docRef = doc(db, 'settings', 'footer_section');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setContactInfo(data.contact || {});
          setSocialLinks(data.social || {});
        } else {
          console.warn('No footer content found!');
        }
      } catch (error) {
        console.error('Error fetching footer content:', error);
      }
    };

    fetchFooterContent();
  }, []);

  const handleNavigation = (e, path) => {
    if (!e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      navigate(path);
      window.scrollTo(0, 0);
    }
  };

  return (
    <footer className={styles.footerContainer}>
      <div className={styles.footer}>
        {/* Stay Updated Section */}
        <div className={`${styles.getInTouch} ${styles.footerContent}`}>
          <h4 className={styles.footerTitle}>STAY UPDATE</h4>
          <div className={styles.inputContainer}>
            <input type='email' placeholder='Email' />
            <button className={styles.subscribeButton}>SUBSCRIBE</button>
          </div>
        </div>

        {/* Quick Links Section */}
        <div className={`${styles.quickLinks} ${styles.footerContent}`}>
          <h4 className={styles.footerTitle}>QUICK LINKS</h4>
          <ul>
            <li>
              <Link
                to='/privacy-policy'
                className={styles.quickLink}
                onClick={(e) => handleNavigation(e, '/privacy-policy')}
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                to='/terms-and-conditions'
                className={styles.quickLink}
                onClick={(e) => handleNavigation(e, '/terms-and-conditions')}
              >
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link
                to='/faq'
                className={styles.quickLink}
                onClick={(e) => handleNavigation(e, '/faq')}
              >
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Section */}
        <div className={`${styles.contactInfo} ${styles.footerContent}`}>
          <h4 className={styles.footerTitle}>CONTACT US</h4>
          <ul>
            {/* <li>{contactInfo.phone || 'Loading...'}</li> */}
            <li>{contactInfo.email1 || 'Loading...'}</li>
            {/* <li>{contactInfo.email2 || 'Loading...'}</li> */}
          </ul>
        </div>

        {/* Social Media Links */}
        <div className={styles.footerContent}>
          <h4 className={styles.footerTitle}>SOCIAL MEDIA LINKS</h4>
          <div className={styles.socialIcons}>
            {socialLinks.facebook && (
              <a
                href={socialLinks.facebook}
                target='_blank'
                rel='noopener noreferrer'
              >
                <FaFacebookF size={40} className={styles.icon} />
              </a>
            )}
            {socialLinks.instagram && (
              <a
                href={socialLinks.instagram}
                target='_blank'
                rel='noopener noreferrer'
              >
                <FaInstagram size={40} className={styles.icon} />
              </a>
            )}
            {socialLinks.linkedin && (
              <a
                href={socialLinks.linkedin}
                target='_blank'
                rel='noopener noreferrer'
              >
                <FaLinkedinIn size={40} className={styles.icon} />
              </a>
            )}
          </div>
        </div>
      </div>

      <hr className={styles.footerDivider} />

      <div className={`${styles.bottomText} ${styles.footerContent}`}>
        © {new Date().getFullYear()} Origins by the Sea. All rights reserved.
      </div>
      <div className={`${styles.company} ${styles.footerContent}`}>
        Businesses by Infinite Market Solutions
      </div>
    </footer>
  );
};

export default Footer;
