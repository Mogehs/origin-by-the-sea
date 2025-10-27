import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../../config/firebase';
import { collection, getDocs, doc, getDoc, query, orderBy, limit } from 'firebase/firestore';

// Thunk to fetch all home page data at once
export const fetchHomePageData = createAsyncThunk(
  'home/fetchHomePageData',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🚀 Starting centralized home page data fetch');
      
      // Create an object to store all the data
      const homeData = {
        hero: null,
        collections: [],
        featuredProducts: [],
      };

      // 1. Fetch Hero Data
      console.log('📱 Fetching hero section data');
      const heroDoc = await getDoc(doc(db, 'settings', 'hero_section'));
      if (heroDoc.exists()) {
        const data = heroDoc.data();
        homeData.hero = {
          title: data.title || 'Designed by Hands, Loved by Hearts.',
          buttonText: data.buttonText || 'SHOP NOW',
          subtitle: data.subtitle || 'Designed by Hands, Loved by Hearts.',
          description: data.description || 'SHOP NOW',
          backgroundVideo: data.backgroundVideo || '',
          backgroundImage: data.backgroundImage || '/images/hero-banner.jpg',
        };
      }
      console.log('✅ Hero data fetched successfully');

      // 2. Fetch Collections
      console.log('👗 Fetching collections data');
      const collectionsRef = collection(db, 'collections');
      const collectionsSnapshot = await getDocs(collectionsRef);
      homeData.collections = collectionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`✅ Fetched ${homeData.collections.length} collections`);

      // 3. Fetch Featured Products
      console.log('🛍️ Fetching featured products');
      const productsRef = collection(db, 'products');
      const q = query(productsRef, orderBy('created_at', 'desc'), limit(8));
      const productsSnapshot = await getDocs(q);
      
      homeData.featuredProducts = productsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          image: data.images && data.images.length > 0 ? 
                 data.images[0] : '/images/placeholder.jpg',
          hoverImage: data.images && data.images.length > 1 ? 
                     data.images[1] : data.images && data.images.length > 0 ? 
                     data.images[0] : '/images/placeholder.jpg',
          price: data.price ? `AED ${data.price}` : 'Price not available',
          rawPrice: data.price || 0,
          name: data.name || 'Product Name'
        };
      });
      console.log(`✅ Fetched ${homeData.featuredProducts.length} featured products`);
      
      console.log('🎉 All home page data fetched successfully!');
      return homeData;
    } catch (error) {
      console.error('❌ Error fetching home page data:', error);
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  hero: null,
  collections: [],
  featuredProducts: [],
  status: 'idle', // 'idle', 'loading', 'succeeded', 'failed'
  error: null,
};

const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomePageData.pending, (state) => {
        state.status = 'loading';
        console.log('🔄 Home page data loading...');
      })
      .addCase(fetchHomePageData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.hero = action.payload.hero;
        state.collections = action.payload.collections;
        state.featuredProducts = action.payload.featuredProducts;
        console.log('✅ Home page data loaded into Redux store');
      })
      .addCase(fetchHomePageData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        console.error('❌ Failed to load home page data:', action.payload);
      });
  },
});


export default homeSlice.reducer;
