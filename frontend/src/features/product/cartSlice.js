import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getUserCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart as clearFirebaseCart,
  syncCartWithFirebase,
} from '../../services/cartService';

// Load cart from localStorage
const loadCartFromLocalStorage = () => {
  try {
    const serializedCart = localStorage.getItem('cartItems');
    return serializedCart ? JSON.parse(serializedCart) : [];
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    return [];
  }
};

// Save cart to localStorage
const saveCartToLocalStorage = (cartItems) => {
  localStorage.setItem('cartItems', JSON.stringify(cartItems));
};

// Async thunk to fetch cart from Firebase
export const fetchUserCart = createAsyncThunk(
  'cart/fetchUserCart',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await getUserCart(userId);
      if (response.error) {
        return rejectWithValue(response.error);
      }

      // Transform cart items to match the expected structure
      const cartItems = response.cartItems.map((item) => ({
        id: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        size: item.size,
        color: item.color,
        displayColor: item.displayColor,
        quantity: item.quantity,
        firebaseId: item.id, // Keep track of the Firebase document ID
      }));

      return cartItems;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to add an item to Firebase cart
export const addToFirebaseCart = createAsyncThunk(
  'cart/addToFirebaseCart',
  async ({ userId, item }, { rejectWithValue }) => {
    try {
      const response = await addItemToCart(userId, item);
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return item;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to update quantity in Firebase cart
export const updateFirebaseQuantity = createAsyncThunk(
  'cart/updateFirebaseQuantity',
  async ({ userId, id, size, color, quantity }, { rejectWithValue }) => {
    try {
      const response = await updateCartItemQuantity(
        userId,
        id,
        size,
        color,
        quantity
      );
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return { id, size, color, quantity };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to remove an item from Firebase cart
export const removeFromFirebaseCart = createAsyncThunk(
  'cart/removeFromFirebaseCart',
  async ({ userId, id, size, color }, { rejectWithValue }) => {
    try {
      const response = await removeCartItem(userId, id, size, color);
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return { id, size, color };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to clear the Firebase cart
export const clearFirebaseCartThunk = createAsyncThunk(
  'cart/clearFirebaseCart',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await clearFirebaseCart(userId);
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to sync localStorage cart with Firebase
export const syncCartThunk = createAsyncThunk(
  'cart/syncCart',
  async ({ userId, localCartItems }, { rejectWithValue }) => {
    try {
      const response = await syncCartWithFirebase(userId, localCartItems);
      if (response.error) {
        return rejectWithValue(response.error);
      }

      // After syncing, get the updated cart from Firebase
      const cartResponse = await getUserCart(userId);
      if (cartResponse.error) {
        return rejectWithValue(cartResponse.error);
      }

      // Transform cart items to match the expected structure
      const cartItems = cartResponse.cartItems.map((item) => ({
        id: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        size: item.size,
        color: item.color,
        displayColor: item.displayColor,
        quantity: item.quantity,
        firebaseId: item.id,
      }));

      return cartItems;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  cartItems: loadCartFromLocalStorage(),
  loading: false,
  error: null,
  isFirebaseCart: false,
  selectedCartItems: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // For non-authenticated users (localStorage)
    addToCart: (state, action) => {
      const { id, size, color } = action.payload;
      const existingItem = state.cartItems.find(
        (item) => item.id === id && item.size === size && item.color === color
      );

      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.cartItems.push(action.payload);
      }

      // Only save to localStorage if not using Firebase
      if (!state.isFirebaseCart) {
        saveCartToLocalStorage(state.cartItems);
      }
    },

    removeFromCart: (state, action) => {
      const { id, size, color } = action.payload;
      state.cartItems = state.cartItems.filter(
        (item) =>
          !(item.id === id && item.size === size && item.color === color)
      );

      // Only save to localStorage if not using Firebase
      if (!state.isFirebaseCart) {
        saveCartToLocalStorage(state.cartItems);
      }
    },

    updateQuantity: (state, action) => {
      const { id, size, color, quantity } = action.payload;
      const item = state.cartItems.find(
        (item) => item.id === id && item.size === size && item.color === color
      );

      if (item) {
        item.quantity = quantity;
      }

      // Only save to localStorage if not using Firebase
      if (!state.isFirebaseCart) {
        saveCartToLocalStorage(state.cartItems);
      }
    },

    clearCart: (state) => {
      state.cartItems = [];
      // Only remove from localStorage if not using Firebase
      if (!state.isFirebaseCart) {
        localStorage.removeItem('cartItems');
      }
    },

    // Set Firebase cart status
    setFirebaseCartStatus: (state, action) => {
      state.isFirebaseCart = action.payload;
    },

    addToSelectedCart: (state, action) => {
      state.selectedCartItems.push(action.payload);
    },

    removeFromSelectedCart: (state, action) => {
      const { id, size, color } = action.payload;
      state.selectedCartItems = state.selectedCartItems.filter(
        (item) =>
          !(item.id === id && item.size === size && item.color === color)
      );
    },

    updateSelectedQuantity: (state, action) => {
      const { id, size, color, quantity } = action.payload;
      // Update in selectedCartItems
      const selectedItem = state.selectedCartItems.find(
        (item) => item.id === id && item.size === size && item.color === color
      );

      if (selectedItem) {
        selectedItem.quantity = quantity;
      }

      // Also update in cartItems to keep them in sync
      const cartItem = state.cartItems.find(
        (item) => item.id === id && item.size === size && item.color === color
      );

      if (cartItem) {
        cartItem.quantity = quantity;
        // Save updated cart to localStorage if not using Firebase
        if (!state.isFirebaseCart) {
          saveCartToLocalStorage(state.cartItems);
        }
      }
    },

    clearSelectedCart: (state) => {
      state.selectedCartItems = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart
      .addCase(fetchUserCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cartItems = action.payload;
        state.isFirebaseCart = true;
        // Clear localStorage when switching to Firebase
        localStorage.removeItem('cartItems');
      })
      .addCase(fetchUserCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add to cart
      .addCase(addToFirebaseCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToFirebaseCart.fulfilled, (state) => {
        state.loading = false;
        // No need to update state here as we'll refetch the cart after modifications
      })
      .addCase(addToFirebaseCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update quantity
      .addCase(updateFirebaseQuantity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFirebaseQuantity.fulfilled, (state) => {
        state.loading = false;
        // No need to update state here as we'll refetch the cart after modifications
      })
      .addCase(updateFirebaseQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Remove from cart
      .addCase(removeFromFirebaseCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromFirebaseCart.fulfilled, (state) => {
        state.loading = false;
        // No need to update state here as we'll refetch the cart after modifications
      })
      .addCase(removeFromFirebaseCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Clear cart
      .addCase(clearFirebaseCartThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearFirebaseCartThunk.fulfilled, (state) => {
        state.loading = false;
        state.cartItems = [];
      })
      .addCase(clearFirebaseCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Sync cart
      .addCase(syncCartThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(syncCartThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.cartItems = action.payload;
        state.isFirebaseCart = true;
        localStorage.removeItem('cartItems'); // Clear localStorage after sync
      })
      .addCase(syncCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  setFirebaseCartStatus,
  addToSelectedCart,
  removeFromSelectedCart,
  updateSelectedQuantity,
  clearSelectedCart,
} = cartSlice.actions;

export default cartSlice.reducer;
