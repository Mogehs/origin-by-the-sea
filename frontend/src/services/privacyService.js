import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Fetches privacy policy content from Firebase
 * @returns {Promise<Object>} The privacy policy content data
 */
export const getPrivacyContent = async () => {
  try {
    const contentDocRef = doc(db, 'PrivacyPolicy', 'content');
    const contentDocSnap = await getDoc(contentDocRef);
    
    if (contentDocSnap.exists()) {
      return contentDocSnap.data();
    }
    
    console.log('No privacy policy content found');
    return null;
  } catch (error) {
    console.error('Error fetching privacy policy content:', error);
    throw new Error(`Failed to fetch privacy policy content: ${error.message}`);
  }
};