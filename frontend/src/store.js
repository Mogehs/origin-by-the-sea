import { configureStore } from '@reduxjs/toolkit';
import productReducer from './features/product/productSlice';
import cartReducer from './features/product/cartSlice';
import favoritesReducer from './features/product/favoritesSlice';
import heroReducer from './features/product/heroSlice';
import homeReducer from './features/product/homeSlice';
import guestReducer from './features/guestSlice';

export const store = configureStore({
  reducer: {
    product: productReducer,
    cart: cartReducer,
    favorites: favoritesReducer,
    hero: heroReducer,
    home: homeReducer,
    guest: guestReducer,
  },
});
