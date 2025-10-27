import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  favourites: [],
};

const favouritesSlice = createSlice({
  name: 'favourites',
  initialState,
  reducers: {
    addFavourite: (state, action) => {
      // Add product to favourites if not already present
      const productId = action.payload;
      if (!state.favourites.includes(productId)) {
        state.favourites.push(productId);
      }
    },
    removeFavourite: (state, action) => {
      // Remove product from favourites
      const productId = action.payload;
      state.favourites = state.favourites.filter((id) => id !== productId);
    },
    clearFavourites: (state) => {
      // Clear all favourites
      state.favourites = [];
    },
  },
});

export const { addFavourite, removeFavourite, clearFavourites } =
  favouritesSlice.actions;

export default favouritesSlice.reducer;
