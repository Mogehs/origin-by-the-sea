import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Fetches terms and conditions content from Firebase
 * @returns {Promise<Object>} The terms and conditions content data
 */
export const getTermsContent = async () => {
  try {
    const contentDocRef = doc(db, 'TermsConditions', 'content');
    const contentDocSnap = await getDoc(contentDocRef);
    
    if (contentDocSnap.exists()) {
      return contentDocSnap.data();
    }
    
    console.log('No terms and conditions content found');
    return null;
  } catch (error) {
    console.error('Error fetching terms content:', error);
    throw new Error(`Failed to fetch terms content: ${error.message}`);
  }
};
