import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const fetchHeroData = createAsyncThunk('hero/fetchHeroData', async () => {
  const heroDoc = await getDoc(doc(db, 'settings', 'hero_section'));
  if (heroDoc.exists()) {
    const data = heroDoc.data();
    return {
      title: data.title || 'Designed by Hands, Loved by Hearts.',
      buttonText: data.buttonText || 'SHOP NOW',
      subtitle: data.subtitle || 'Designed by Hands, Loved by Hearts.',
      description: data.description || 'SHOP NOW',
      backgroundVideo: data.backgroundVideo || '',
      backgroundImage: data.backgroundImage || '/images/hero-banner.jpg',
    };
  } else {
    throw new Error('Hero section data not found');
  }
});

const heroSlice = createSlice({
  name: 'hero',
  initialState: {
    data: null,
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHeroData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchHeroData.fulfilled, (state, action) => {
        state.data = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchHeroData.rejected, (state, action) => {
        state.error = action.error.message;
        state.isLoading = false;
      });
  },
});

export default heroSlice.reducer;
