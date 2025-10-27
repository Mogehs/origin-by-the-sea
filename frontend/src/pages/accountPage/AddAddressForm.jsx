import { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-toastify';
import styles from './css/AddAddressForm.module.css';

const AddAddressForm = ({ onClose, userId, address, onAddressAdded, onAddressUpdated }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United Arab Emirates',
    phone: '',
    isDefault: false
  });
  
  const [loading, setLoading] = useState(false);
  const isEditing = !!address;
  
  useEffect(() => {
    if (address) {
      setFormData({
        firstName: address.firstName || '',
        lastName: address.lastName || '',
        company: address.company || '',
        address1: address.address1 || '',
        address2: address.address2 || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zipCode || '',
        country: address.country || 'United Arab Emirates',
        phone: address.phone || '',
        isDefault: address.isDefault || false
      });
    }
  }, [address]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      toast.error('You must be logged in to save an address');
      return;
    }
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.address1 || 
        !formData.city || !formData.country || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      if (isEditing) {
        // Update existing address
        const addressRef = doc(db, 'users', userId, 'addresses', address.id);
        await updateDoc(addressRef, {
          ...formData,
          updatedAt: serverTimestamp()
        });
        
        toast.success('Address updated successfully');
        
        if (onAddressUpdated) {
          onAddressUpdated({
            id: address.id,
            ...formData
          });
        }
      } else {
        // Add new address
        const addressesRef = collection(db, 'users', userId, 'addresses');
        const newAddressRef = await addDoc(addressesRef, {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        toast.success('Address added successfully');
        
        if (onAddressAdded) {
          onAddressAdded({
            id: newAddressRef.id,
            ...formData
          });
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>
          {isEditing ? 'Edit Address' : 'Add New Address'}
        </h2>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="First Name"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Last Name"
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="company">Company (Optional)</label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Company Name"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="address1">Address Line 1 *</label>
            <input
              type="text"
              id="address1"
              name="address1"
              value={formData.address1}
              onChange={handleChange}
              required
              placeholder="Street Address, P.O. Box"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="address2">Address Line 2 (Optional)</label>
            <input
              type="text"
              id="address2"
              name="address2"
              value={formData.address2}
              onChange={handleChange}
              placeholder="Apartment, Suite, Unit, etc."
            />
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="city">City / Town *</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                placeholder="City"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="state">State / Province</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="State/Province/Emirate"
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="zipCode">Postal / Zip Code</label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                placeholder="Postal/Zip Code"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="country">Country / Region *</label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
              >
                <option value="United Arab Emirates">United Arab Emirates</option>
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="Qatar">Qatar</option>
                <option value="Bahrain">Bahrain</option>
                <option value="Kuwait">Kuwait</option>
                <option value="Oman">Oman</option>
                <option value="Jordan">Jordan</option>
                <option value="Lebanon">Lebanon</option>
                <option value="Egypt">Egypt</option>
                <option value="India">India</option>
                <option value="Pakistan">Pakistan</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
              </select>
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="phone">Phone *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="Phone Number"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleChange}
              />
              Set as default address
            </label>
          </div>

          <div className={styles.buttonGroup}>
          <button
              type="button" 
            className={styles.cancelButton}
            onClick={onClose}
          >
            Cancel
          </button>
            
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Saving...' : isEditing ? 'Update Address' : 'Add Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAddressForm;
