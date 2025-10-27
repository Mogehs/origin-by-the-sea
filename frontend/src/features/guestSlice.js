import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isGuestCheckout: false,
};

const guestSlice = createSlice({
  name: 'guest',
  initialState,
  reducers: {
    setGuestCheckout: (state, action) => {
      state.isGuestCheckout = action.payload;
    },
    resetGuestCheckout: (state) => {
      state.isGuestCheckout = false;
    },
  },
});

export const { setGuestCheckout, resetGuestCheckout } = guestSlice.actions;
export default guestSlice.reducer;
