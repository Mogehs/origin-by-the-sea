import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  syncFavoritesWithFirebase,
} from '../../services/favoriteService';

// Load favorites from localStorage if available (for non-authenticated users)
const loadFavoritesFromLocalStorage = () => {
  try {
    const serializedFavorites = localStorage.getItem('favorites');
    return serializedFavorites ? JSON.parse(serializedFavorites) : [];
  } catch (error) {
    console.error('Error loading favorites from localStorage:', error);
    return [];
  }
};

// Save favorites to localStorage (for non-authenticated users)
const saveFavoritesToLocalStorage = (favorites) => {
  localStorage.setItem('favorites', JSON.stringify(favorites));
};

// Async thunk for fetching favorites
export const fetchUserFavorites = createAsyncThunk(
  'favorites/fetchUserFavorites',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await getFavorites(userId);
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return response.favorites;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for adding a product to favorites
export const addProductToFavorites = createAsyncThunk(
  'favorites/addProductToFavorites',
  async ({ userId, product }, { rejectWithValue }) => {
    try {
      const response = await addToFavorites(userId, product);
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return { ...product, favoriteId: response.favoriteId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for removing a product from favorites
export const removeProductFromFavorites = createAsyncThunk(
  'favorites/removeProductFromFavorites',
  async ({ userId, productId }, { rejectWithValue }) => {
    try {
      const response = await removeFromFavorites(userId, productId);
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return productId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to sync localStorage favorites with Firebase
export const syncFavoritesThunk = createAsyncThunk(
  'favorites/syncFavorites',
  async ({ userId, localFavorites }, { rejectWithValue }) => {
    try {
      const response = await syncFavoritesWithFirebase(userId, localFavorites);
      if (response.error) {
        return rejectWithValue(response.error);
      }

      // After syncing, get the updated favorites from Firebase
      const favoritesResponse = await getFavorites(userId);
      if (favoritesResponse.error) {
        return rejectWithValue(favoritesResponse.error);
      }

      return favoritesResponse.favorites;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice definition
const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: {
    favorites: loadFavoritesFromLocalStorage(),
    loading: false,
    error: null,
    isFirebaseFavorites: false,
  },
  reducers: {
    // For non-authenticated users
    addFavorite: (state, action) => {
      // Check if product is already in favorites
      const existingIndex = state.favorites.findIndex(
        (item) => item.id === action.payload.id
      );

      if (existingIndex === -1) {
        state.favorites.push(action.payload);

        // Only save to localStorage if not using Firebase
        if (!state.isFirebaseFavorites) {
          saveFavoritesToLocalStorage(state.favorites);
        }
      }
    },
    removeFavorite: (state, action) => {
      state.favorites = state.favorites.filter(
        (item) => item.id !== action.payload
      );

      // Only save to localStorage if not using Firebase
      if (!state.isFirebaseFavorites) {
        saveFavoritesToLocalStorage(state.favorites);
      }
    },
    clearFavorites: (state) => {
      state.favorites = [];

      // Only remove from localStorage if not using Firebase
      if (!state.isFirebaseFavorites) {
        localStorage.removeItem('favorites');
      }
    },
    // Set Firebase favorites status
    setFirebaseFavoritesStatus: (state, action) => {
      state.isFirebaseFavorites = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch favorites
      .addCase(fetchUserFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload;
        state.isFirebaseFavorites = true;
        // Clear localStorage when switching to Firebase
        localStorage.removeItem('favorites');
      })
      .addCase(fetchUserFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add to favorites
      .addCase(addProductToFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addProductToFavorites.fulfilled, (state, action) => {
        state.loading = false;
        const existingIndex = state.favorites.findIndex(
          (item) => item.id === action.payload.id
        );

        if (existingIndex === -1) {
          state.favorites.push(action.payload);
        }
      })
      .addCase(addProductToFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Remove from favorites
      .addCase(removeProductFromFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeProductFromFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = state.favorites.filter(
          (item) => item.productId !== action.payload
        );
      })
      .addCase(removeProductFromFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Sync favorites
      .addCase(syncFavoritesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(syncFavoritesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload;
        state.isFirebaseFavorites = true;
        localStorage.removeItem('favorites'); // Clear localStorage after sync
      })
      .addCase(syncFavoritesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  addFavorite,
  removeFavorite,
  clearFavorites,
  setFirebaseFavoritesStatus,
} = favoritesSlice.actions;

export default favoritesSlice.reducer;
