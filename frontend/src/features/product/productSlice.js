import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const productsRef = collection(db, 'products');
      const snapshot = await getDocs(productsRef);

      console.log('Fetched products from Firebase:', snapshot.docs.length);

      const productsData = snapshot.docs.map((doc) => {
        const data = doc.data();

        // Extract collection ID from data
        let collectionId = data.collection_id || null;

        // Ensure it's a string for comparison purposes
        if (collectionId !== null && typeof collectionId !== 'string') {
          collectionId = String(collectionId);
        }

        return {
          id: doc.id,
          ...data,
          image:
            data.images && data.images.length > 0
              ? data.images[0]
              : '/images/placeholder.jpg',
          hoverImage:
            data.images && data.images.length > 1
              ? data.images[1]
              : data.images && data.images.length > 0
              ? data.images[0]
              : '/images/placeholder.jpg',
          price: data.price ? `AED ${data.price}` : 'Price not available',
          rawPrice: data.price || 0, // Store raw price for easier sorting
          name: data.name || 'Product Name',
          sizes: data.sizes || ['S', 'M', 'L'],
          colors: data.colors || [],
          collection_id: collectionId,
          categories: data.categories || [],
          created_at: data.created_at
            ? // Convert Firestore timestamp to ISO string
              data.created_at.toDate
              ? data.created_at.toDate().toISOString()
              : // If it's already a Date object
              data.created_at instanceof Date
              ? data.created_at.toISOString()
              : // If it's a string already or any other format
                data.created_at
            : new Date().toISOString(),
        };
      });

      console.log('Processed products data:', productsData.length);
      return productsData;
    } catch (error) {
      console.error('Error fetching products:', error);
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  products: [],
  currentPage: 1,
  productsPerPage: 8,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setPage: (state, action) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { setPage } = productSlice.actions;
export default productSlice.reducer;
