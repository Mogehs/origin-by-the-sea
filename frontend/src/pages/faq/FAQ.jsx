import React, { useState } from 'react';
import styles from './FAQ.module.css';
import SEO from '../../components/SEO';

const FAQ = () => {
  const [openItems, setOpenItems] = useState(new Set());

  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const faqData = [
    {
      question: "Are your garments really handmade?",
      answer: "Absolutely. Every piece is 100% handmade by skilled Latin American artisans using traditional techniques such as macramé, crochet, and hand-weaving. Each item is truly one of a kind."
    },
    {
      question: "What materials do you use?",
      answer: "We use premium, breathable cotton blends and natural fibers for comfort, durability, and an eco-conscious footprint. Some pieces also incorporate high-quality swimwear fabric in combination with cotton-blend macramé for added function and style."
    },
    {
      question: "How do I know which size to order?",
      answer: "Each product page includes a detailed size guide. If you're between sizes or unsure, feel free to contact us—we'll gladly assist you and can offer custom sizing for select items."
    },
    {
      question: "Can I request a custom size or design?",
      answer: "Yes! We offer limited customization on selected garments. You can request adjustments at checkout or by contacting us directly. Please note that custom orders may require additional fees and longer production times."
    },
    {
      question: "How long will my order take to ship?",
      answer: "As all items are handmade to order, please allow 7–14 business days for production. Delivery usually takes approximately 20 days total after order confirmation."
    },
    {
      question: "Can I expedite my order?",
      answer: "If you need your item by a specific date or for an event, contact us before placing your order. Rush requests may be accommodated depending on current production capacity (rush fees may apply)."
    },
    {
      question: "Do you ship internationally?",
      answer: "Yes, we offer worldwide shipping. Delivery times and shipping fees vary by destination. Please note that customs duties or import taxes may apply based on your country's regulations."
    },
    {
      question: "What is your return and exchange policy?",
      answer: "We accept returns within 7 days of delivery for unworn, unused items returned in original condition and packaging. Please note: • Custom orders (including sizing, color, or design modifications) are non-returnable and non-refundable. • Final sale items are not eligible for return or exchange. • Refunds on customized pieces are considered only in exceptional cases, at the discretion of ORIGINS management."
    },
    {
      question: "How should I care for my garment?",
      answer: "Hand wash gently in cold water with mild soap and lay flat to dry. Avoid wringing, bleaching, or machine washing to maintain the integrity of the fabric and hand-knotted details."
    },
    {
      question: "Are your garments lined?",
      answer: "Many of our swim tops are lined. However, several garments are intentionally unlined to preserve their lightweight and semi-sheer aesthetic. Please refer to the \"Description & Features\" section on each product page for specific details."
    },
    {
      question: "Are your products sustainably and ethically made?",
      answer: "Yes. We follow slow fashion principles and partner only with artisan communities that ensure ethical, fair-trade practices. Your purchase helps support women-led groups and preserve ancestral craftsmanship."
    },
    {
      question: "Do you offer wholesale or collaborations?",
      answer: "We do! We collaborate with select boutiques, stylists, and editors. For wholesale inquiries or partnership opportunities, please contact us at hello@originsbythesea.com."
    },
    {
      question: "Can I request a different color for a garment?",
      answer: "In some cases, yes. Contact us before placing your order to discuss alternative color options and fiber availability. Custom colors may extend the lead time."
    },
    {
      question: "Do you offer matching sets or family looks?",
      answer: "We occasionally create matching looks for bridal parties, mother-daughter sets, and special occasions. For group orders or bespoke designs, reach out to us directly."
    },
    {
      question: "What if my piece has a slight variation or irregularity?",
      answer: "Slight differences in stitching, pattern, or shade are a natural result of handmade craftsmanship and part of what makes each piece unique. These are not considered defects."
    },
    {
      question: "Can I swim in your garments?",
      answer: "Our bikinis and swimsuits are suitable for swimming. However, our macramé dresses and cover-ups are designed primarily for lounging, festivals, or beachside wear—not prolonged exposure to chlorinated or salt water, which may affect durability over time."
    },
    {
      question: "Where are you based, and where are your products made?",
      answer: "Our creative studio is based in the United Arab Emirates, while our garments are handcrafted in Colombia and other Latin American countries by our artisan collaborators."
    },
    {
      question: "Do you offer styling support?",
      answer: "Yes! Whether you're shopping for a beach wedding, tropical trip, or editorial shoot, we're happy to assist with styling advice. Reach us via our contact form or DM us on Instagram @originsbythesea."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept major credit cards, and cash on delivery. Customers in the UAE may request local bank transfer—contact us for arrangements"
    },
    {
      question: "How can I stay updated on new drops and collections?",
      answer: "Subscribe to our newsletter and follow us on Instagram @originsbythesea to be the first to know about new releases, restocks, behind-the-scenes stories, and exclusive offers."
    }
  ];

  const seoData = {
    title: 'Frequently Asked Questions | Origin By The Sea',
    description: 'Find answers to common questions about our handmade garments, sizing, shipping, returns, and more. Get all the information you need about Origin By The Sea.',
    canonicalUrl: 'https://originsbythesea.com/faq',
    keywords: 'FAQ, frequently asked questions, origin by the sea, handmade garments, sizing guide, shipping, returns, custom orders',
    type: 'website',
    pageType: 'FAQPage',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      name: 'Frequently Asked Questions - Origin By The Sea',
      description: 'Common questions and answers about our handmade sustainable fashion',
      publisher: {
        '@type': 'Organization',
        name: 'Origin By The Sea',
        logo: {
          '@type': 'ImageObject',
          url: 'https://originsbythesea.com/images/logo.png'
        }
      },
      url: 'https://originsbythesea.com/faq',
      mainEntity: faqData.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer
        }
      }))
    }
  };

  return (
    <div className={styles.faqContainer}>
      <SEO {...seoData} />
      
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Frequently Asked Questions</h1>
          <p className={styles.heroSubtitle}>
            Find answers to common questions about our handmade garments, sizing, shipping, and more.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <div className={styles.faqContainer}>
          <div className={styles.faqList}>
            {faqData.map((item, index) => (
              <div key={index} className={styles.faqItem}>
                <button
                  className={`${styles.faqQuestion} ${openItems.has(index) ? styles.open : ''}`}
                  onClick={() => toggleItem(index)}
                >
                  <span className={styles.questionText}>{item.question}</span>
                  <span className={styles.toggleIcon}>
                    {openItems.has(index) ? '−' : '+'}
                  </span>
                </button>
                <div className={`${styles.faqAnswer} ${openItems.has(index) ? styles.open : ''}`}>
                  <div className={styles.answerContent}>
                    <p>{item.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

     
    </div>
  );
};

export default FAQ;
