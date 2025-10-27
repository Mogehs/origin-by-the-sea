import { collection, getDocs, query, doc, getDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Fetches about page content from Firebase
 * @returns {Promise<Object>} The about page content data
 */
export const getAboutContent = async () => {
  try {
    const contentDocRef = doc(db, 'AboutUs', 'content');
    const contentDocSnap = await getDoc(contentDocRef);
    
    if (contentDocSnap.exists()) {
      const data = contentDocSnap.data();
      console.log('Fetched about content data:', data);
      return data;
    }
    
    console.log('No about content found');
    return null;
  } catch (error) {
    console.error('Error fetching about content:', error);
    throw new Error(`Failed to fetch about content: ${error.message}`);
  }
};
