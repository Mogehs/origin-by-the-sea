import React from 'react';
import styles from './CustomerInfoForm.module.css';

const CustomerInfoForm = ({ formData, setFormData, errors = {} }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Shipping Information</h3>

      <div className={styles.formGroup}>
        <div className={styles.nameRow}>
          <div className={styles.inputGroup}>
            <label htmlFor='firstName'>First Name*</label>
            <input
              type='text'
              id='firstName'
              name='firstName'
              value={formData.firstName || ''}
              onChange={handleChange}
              className={`${styles.input} ${
                errors.firstName ? styles.inputError : ''
              }`}
            />
            {errors.firstName && (
              <span className={styles.errorText}>{errors.firstName}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor='lastName'>Last Name*</label>
            <input
              type='text'
              id='lastName'
              name='lastName'
              value={formData.lastName || ''}
              onChange={handleChange}
              className={`${styles.input} ${
                errors.lastName ? styles.inputError : ''
              }`}
            />
            {errors.lastName && (
              <span className={styles.errorText}>{errors.lastName}</span>
            )}
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor='email'>Email Address*</label>
          <input
            type='email'
            id='email'
            name='email'
            value={formData.email || ''}
            onChange={handleChange}
            className={`${styles.input} ${
              errors.email ? styles.inputError : ''
            }`}
          />
          {errors.email && (
            <span className={styles.errorText}>{errors.email}</span>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor='phone'>Phone Number*</label>
          <input
            type='tel'
            id='phone'
            name='phone'
            value={formData.phone || ''}
            onChange={handleChange}
            className={`${styles.input} ${
              errors.phone ? styles.inputError : ''
            }`}
          />
          {errors.phone && (
            <span className={styles.errorText}>{errors.phone}</span>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor='address'>Street Address*</label>
          <input
            type='text'
            id='address'
            name='address'
            value={formData.address || ''}
            onChange={handleChange}
            className={`${styles.input} ${
              errors.address ? styles.inputError : ''
            }`}
          />
          {errors.address && (
            <span className={styles.errorText}>{errors.address}</span>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor='apartment'>Apartment, suite, etc.*</label>
          <input
            type='text'
            id='apartment'
            name='apartment'
            value={formData.apartment || ''}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        <div className={styles.locationRow}>
          <div className={styles.inputGroup}>
            <label htmlFor='city'>City*</label>
            <input
              type='text'
              id='city'
              name='city'
              value={formData.city || ''}
              onChange={handleChange}
              className={`${styles.input} ${
                errors.city ? styles.inputError : ''
              }`}
            />
            {errors.city && (
              <span className={styles.errorText}>{errors.city}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor='state'>State*</label>
            <input
              type='text'
              id='state'
              name='state'
              value={formData.state || ''}
              onChange={handleChange}
              className={`${styles.input} ${
                errors.state ? styles.inputError : ''
              }`}
            />
            {errors.state && (
              <span className={styles.errorText}>{errors.state}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor='zipCode'>ZIP Code*</label>
            <input
              type='text'
              id='zipCode'
              name='zipCode'
              value={formData.zipCode || ''}
              onChange={handleChange}
              className={`${styles.input} ${
                errors.zipCode ? styles.inputError : ''
              }`}
            />
            {errors.zipCode && (
              <span className={styles.errorText}>{errors.zipCode}</span>
            )}
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor='country'>Country*</label>
          <select
            id='country'
            name='country'
            value={formData.country || 'United Arab Emirates'}
            onChange={handleChange}
            className={`${styles.select} ${
              errors.country ? styles.inputError : ''
            }`}
          >
            <option value='United Arab Emirates'>United Arab Emirates</option>
            <option value='Saudi Arabia'>Saudi Arabia</option>
            <option value='Qatar'>Qatar</option>
            <option value='Kuwait'>Kuwait</option>
            <option value='Bahrain'>Bahrain</option>
            <option value='Oman'>Oman</option>
            <option value='India'>India</option>
            <option value='United States'>United States</option>
            <option value='United Kingdom'>United Kingdom</option>
          </select>
          {errors.country && (
            <span className={styles.errorText}>{errors.country}</span>
          )}
        </div>
      </div>

      <div className={styles.noteGroup}>
        <label htmlFor='orderNotes'>Order Notes (optional)</label>
        <textarea
          id='orderNotes'
          name='orderNotes'
          rows='3'
          value={formData.orderNotes || ''}
          onChange={handleChange}
          className={styles.textarea}
          placeholder='Special instructions for delivery'
        ></textarea>
      </div>
    </div>
  );
};

export default CustomerInfoForm;
