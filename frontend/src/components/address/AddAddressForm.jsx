import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import styles from './css/AddAddressForm.module.css';

const AddAddressForm = ({ onSubmit, onCancel, editAddress = null }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    isDefault: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    // If an address is provided for editing, populate the form
    if (editAddress) {
      setFormData({
        fullName: editAddress.fullName || '',
        phoneNumber: editAddress.phoneNumber || '',
        streetAddress: editAddress.streetAddress || '',
        city: editAddress.city || '',
        state: editAddress.state || '',
        zipCode: editAddress.zipCode || '',
        country: editAddress.country || 'United States',
        isDefault: editAddress.isDefault || false
      });
    }
  }, [editAddress]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when field is being edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber.replace(/[^0-9]/g, ''))) {
      newErrors.phoneNumber = 'Valid phone number is required';
    }
    
    if (!formData.streetAddress.trim()) {
      newErrors.streetAddress = 'Street address is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = 'Valid ZIP code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        ...formData,
        phoneNumber: formData.phoneNumber.replace(/[^0-9]/g, '')
      });
    }
  };

  // List of US states for dropdown
  const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
    'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 
    'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 
    'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 
    'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 
    'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h3>{editAddress ? 'Edit Address' : 'Add New Address'}</h3>
        <button 
          type="button" 
          className={styles.closeButton} 
          onClick={onCancel}
          aria-label="Close form"
        >
          <FaTimes />
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.addressForm}>
        <div className={styles.formGroup}>
          <label htmlFor="fullName">Full Name*</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className={errors.fullName ? styles.inputError : ''}
          />
          {errors.fullName && <span className={styles.errorText}>{errors.fullName}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="phoneNumber">Phone Number*</label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="(123) 456-7890"
            className={errors.phoneNumber ? styles.inputError : ''}
          />
          {errors.phoneNumber && <span className={styles.errorText}>{errors.phoneNumber}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="streetAddress">Street Address*</label>
          <input
            type="text"
            id="streetAddress"
            name="streetAddress"
            value={formData.streetAddress}
            onChange={handleChange}
            className={errors.streetAddress ? styles.inputError : ''}
          />
          {errors.streetAddress && <span className={styles.errorText}>{errors.streetAddress}</span>}
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="city">City*</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className={errors.city ? styles.inputError : ''}
            />
            {errors.city && <span className={styles.errorText}>{errors.city}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="state">State*</label>
            <select
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className={errors.state ? styles.inputError : ''}
            >
              <option value="">Select State</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            {errors.state && <span className={styles.errorText}>{errors.state}</span>}
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="zipCode">ZIP Code*</label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              placeholder="12345"
              className={errors.zipCode ? styles.inputError : ''}
            />
            {errors.zipCode && <span className={styles.errorText}>{errors.zipCode}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="country">Country</label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              disabled
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="isDefault"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleChange}
            />
            <label htmlFor="isDefault">Set as default shipping address</label>
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className={styles.submitButton}>
            {editAddress ? 'Update Address' : 'Save Address'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAddressForm; 