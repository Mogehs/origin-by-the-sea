import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, query, where, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { toast } from 'react-toastify';
import { FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi';
import AddAddressForm from './AddAddressForm';
import styles from './css/ManageAddresses.module.css';

const ManageAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;
    fetchAddresses();
  }, [userId]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const addressesRef = collection(db, 'users', userId, 'addresses');
      const addressesSnapshot = await getDocs(addressesRef);
      const addressesList = addressesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAddresses(addressesList);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await deleteDoc(doc(db, 'users', userId, 'addresses', addressId));
        setAddresses(addresses.filter(address => address.id !== addressId));
        toast.success('Address deleted successfully');
      } catch (error) {
        console.error('Error deleting address:', error);
        toast.error('Failed to delete address');
      }
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      // First, set all addresses to not default
      const updatePromises = addresses
        .filter(address => address.isDefault)
        .map(address => 
          updateDoc(doc(db, 'users', userId, 'addresses', address.id), {
            isDefault: false
          })
        );
      
      await Promise.all(updatePromises);
      
      // Then, set the selected address to default
      await updateDoc(doc(db, 'users', userId, 'addresses', addressId), {
        isDefault: true
      });
      
      // Update local state
      setAddresses(addresses.map(address => ({
        ...address,
        isDefault: address.id === addressId
      })));
      
      toast.success('Default address updated');
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to update default address');
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowAddAddressForm(true);
  };

  const handleAddressAdded = () => {
    fetchAddresses();
    setShowAddAddressForm(false);
  };

  const handleAddressUpdated = () => {
    fetchAddresses();
    setShowAddAddressForm(false);
    setEditingAddress(null);
  };

  const formatAddress = (address) => {
    const parts = [
      address.firstName + ' ' + address.lastName,
      address.company,
      address.addressLine1,
      address.addressLine2,
      `${address.city}, ${address.state} ${address.zipCode}`,
      address.country,
      address.phone
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  return (
    <div className={styles.manageAddressesContainer}>
      <div className={styles.headerRow}>
        <h2 className={styles.sectionTitle}>Manage Addresses</h2>
        <button 
          className={styles.addAddressButton}
          onClick={() => {
            setEditingAddress(null);
            setShowAddAddressForm(true);
          }}
        >
          Add New Address
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading addresses...</div>
      ) : addresses.length === 0 ? (
        <div className={styles.noAddresses}>
          <p>You haven't added any addresses yet.</p>
          <p>Add an address to make checkout faster.</p>
        </div>
      ) : (
        <div className={styles.addressesGrid}>
          {addresses.map(address => (
            <div 
              key={address.id} 
              className={`${styles.addressCard} ${address.isDefault ? styles.defaultAddress : ''}`}
            >
              {address.isDefault && (
                <div className={styles.defaultBadge}>Default</div>
              )}
              <div className={styles.addressContent}>
                <p className={styles.name}>{address.firstName} {address.lastName}</p>
                {address.company && <p>{address.company}</p>}
                <p>{address.addressLine1}</p>
                {address.addressLine2 && <p>{address.addressLine2}</p>}
                <p>{address.city}, {address.state} {address.zipCode}</p>
                <p>{address.country}</p>
                <p>{address.phone}</p>
              </div>
              <div className={styles.addressActions}>
                {!address.isDefault && (
                  <button 
                    className={styles.setDefaultButton} 
                    onClick={() => handleSetDefaultAddress(address.id)}
                    title="Set as default"
                  >
                    <FiCheck />
                  </button>
                )}
                <button 
                  className={styles.editButton} 
                  onClick={() => handleEditAddress(address)}
                  title="Edit address"
                >
                  <FiEdit2 />
                </button>
                <button 
                  className={styles.deleteButton} 
                  onClick={() => handleDeleteAddress(address.id)}
                  title="Delete address"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddAddressForm && (
        <AddAddressForm
          userId={userId}
          address={editingAddress}
          onAddressAdded={handleAddressAdded}
          onAddressUpdated={handleAddressUpdated}
          onClose={() => {
            setShowAddAddressForm(false);
            setEditingAddress(null);
          }}
        />
      )}
    </div>
  );
};

export default ManageAddresses; 