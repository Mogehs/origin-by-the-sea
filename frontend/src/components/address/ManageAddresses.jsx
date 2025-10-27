import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faHome, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import AddAddressForm from './AddAddressForm';
import styles from './css/ManageAddresses.module.css';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const ManageAddresses = () => {
  const { currentUser } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data().addresses) {
          setAddresses(userDoc.data().addresses);
        } else {
          setAddresses([]);
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
        toast.error("Failed to load addresses. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddresses();
  }, [currentUser]);

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setShowAddressForm(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressToDelete) => {
    if (!currentUser) return;
    
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        
        // Remove the address from Firestore
        await updateDoc(userDocRef, {
          addresses: arrayRemove(addressToDelete)
        });
        
        // Update local state
        setAddresses(addresses.filter(addr => 
          addr.id !== addressToDelete.id
        ));
        
        toast.success("Address deleted successfully");
      } catch (error) {
        console.error("Error deleting address:", error);
        toast.error("Failed to delete address. Please try again.");
      }
    }
  };

  const handleSubmitAddress = async (addressData) => {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      
      if (editingAddress) {
        // For editing, remove old address and add updated one
        const updatedAddresses = addresses.map(addr => 
          addr.id === editingAddress.id ? addressData : addr
        );
        
        await updateDoc(userDocRef, {
          addresses: updatedAddresses
        });
        
        setAddresses(updatedAddresses);
        toast.success("Address updated successfully");
      } else {
        // For adding a new address
        // Generate a unique ID for the new address
        const newAddress = {
          ...addressData,
          id: `addr_${Date.now()}`
        };
        
        // If this is set as default and there are other addresses,
        // ensure only this one is marked as default
        if (newAddress.isDefault && addresses.length > 0) {
          const updatedAddresses = addresses.map(addr => ({
            ...addr,
            isDefault: false
          }));
          
          updatedAddresses.push(newAddress);
          
          await updateDoc(userDocRef, {
            addresses: updatedAddresses
          });
          
          setAddresses(updatedAddresses);
        } else {
          // Just add the new address
          await updateDoc(userDocRef, {
            addresses: arrayUnion(newAddress)
          });
          
          setAddresses([...addresses, newAddress]);
        }
        
        toast.success("Address added successfully");
      }
      
      // Close the form
      setShowAddressForm(false);
      setEditingAddress(null);
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address. Please try again.");
    }
  };

  const handleCancelAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  const handleSetDefaultAddress = async (addressToSetDefault) => {
    if (!currentUser) return;
    
    try {
      // Update all addresses, setting isDefault to true only for the selected address
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressToSetDefault.id
      }));
      
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        addresses: updatedAddresses
      });
      
      setAddresses(updatedAddresses);
      toast.success("Default address updated");
    } catch (error) {
      console.error("Error setting default address:", error);
      toast.error("Failed to update default address. Please try again.");
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading your addresses...</div>;
  }

  if (!currentUser) {
    return (
      <div className={styles.notLoggedIn}>
        <p>Please log in to manage your addresses.</p>
      </div>
    );
  }

  return (
    <div className={styles.manageAddressesContainer}>
      <div className={styles.addressHeader}>
        <h2>Manage Addresses</h2>
        <button 
          className={styles.addAddressButton}
          onClick={handleAddNewAddress}
        >
          <FontAwesomeIcon icon={faPlus} /> Add New Address
        </button>
      </div>
      
      {addresses.length === 0 ? (
        <div className={styles.noAddresses}>
          <FontAwesomeIcon icon={faMapMarkerAlt} className={styles.noAddressesIcon} />
          <p>You don't have any saved addresses yet.</p>
          <p>Add an address to make checkout faster.</p>
        </div>
      ) : (
        <div className={styles.addressesGrid}>
          {addresses.map((address, index) => (
            <div 
              key={address.id || index} 
              className={`${styles.addressCard} ${address.isDefault ? styles.defaultAddress : ''}`}
            >
              {address.isDefault && (
                <div className={styles.defaultBadge}>
                  <FontAwesomeIcon icon={faHome} /> Default
                </div>
              )}
              <div className={styles.addressDetails}>
                <h3>{address.fullName}</h3>
                <p>{address.street}</p>
                <p>{address.city}, {address.state} {address.zipCode}</p>
                <p>{address.country}</p>
                <p>Phone: {address.phone}</p>
              </div>
              <div className={styles.addressActions}>
                <button 
                  onClick={() => handleEditAddress(address)}
                  className={styles.editButton}
                >
                  <FontAwesomeIcon icon={faEdit} /> Edit
                </button>
                <button 
                  onClick={() => handleDeleteAddress(address)}
                  className={styles.deleteButton}
                >
                  <FontAwesomeIcon icon={faTrash} /> Delete
                </button>
                {!address.isDefault && (
                  <button 
                    onClick={() => handleSetDefaultAddress(address)}
                    className={styles.setDefaultButton}
                  >
                    Set as Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showAddressForm && (
        <div className={styles.addressFormOverlay}>
          <AddAddressForm 
            existingAddress={editingAddress}
            onSubmit={handleSubmitAddress}
            onCancel={handleCancelAddressForm}
          />
        </div>
      )}
    </div>
  );
};

export default ManageAddresses; 