import './App.css';
// Import react-toastify CSS before App.css to avoid style overrides
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AnimatePresence } from 'framer-motion';
import { HelmetProvider } from 'react-helmet-async';
import { ImageCacheProvider } from './context/ImageCacheContext';
import {
  Home,
  Signup,
  Login,
  About,
  Shop,
  SingleProduct,
  Cart,
  Buy,
  AccountPage,
  NotFound,
  ForgotPassword,
  PrivacyPolicy,
  TermsAndConditions,
  Favorites,
  FAQ,
} from './pages';

import OrderSuccess from './pages/orderSuccess';
import TrackOrder from './pages/trackOrder/TrackOrder';
import ScrollToTop from './components/ScrollToTop';
import DataSyncInitializer from './components/DataSyncInitializer';
import SharedLayout from './layout/SharedLayout';

// Page transition wrapper component
const PageTransition = ({ children }) => {
  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  const pathnameKey = location.pathname;

  return (
    <AnimatePresence mode='wait'>
      <Routes location={location} key={pathnameKey}>
        <Route element={<SharedLayout />}>
          <Route
            path='/'
            element={
              <PageTransition>
                <Home />
              </PageTransition>
            }
          />
          <Route
            path='/about'
            element={
              <PageTransition>
                <About />
              </PageTransition>
            }
          />
          <Route
            path='/shop/*'
            element={
              <PageTransition>
                <Shop />
              </PageTransition>
            }
          />
          <Route
            path='/product/*'
            element={
              <PageTransition>
                <SingleProduct />
              </PageTransition>
            }
          />
          <Route
            path='/cart'
            element={
              <PageTransition>
                <Cart />
              </PageTransition>
            }
          />
          <Route
            path='/favorites'
            element={
              <PageTransition>
                <Favorites />
              </PageTransition>
            }
          />
          <Route
            path='/buy'
            element={
              <PageTransition>
                <Buy />
              </PageTransition>
            }
          />
          <Route
            path='/order-success'
            element={
              <PageTransition>
                <OrderSuccess />
              </PageTransition>
            }
          />
          <Route
            path='/track-order'
            element={
              <PageTransition>
                <TrackOrder />
              </PageTransition>
            }
          />
          <Route
            path='/privacy-policy'
            element={
              <PageTransition>
                <PrivacyPolicy />
              </PageTransition>
            }
          />
          <Route
            path='/terms-and-conditions'
            element={
              <PageTransition>
                <TermsAndConditions />
              </PageTransition>
            }
          />
          <Route
            path='/faq'
            element={
              <PageTransition>
                <FAQ />
              </PageTransition>
            }
          />
          <Route
            path='/account'
            element={
              <PageTransition>
                <AccountPage />
              </PageTransition>
            }
          />
          <Route
            path='*'
            element={
              <PageTransition>
                <NotFound />
              </PageTransition>
            }
          />
        </Route>

        <Route
          path='/signup'
          element={
            <PageTransition>
              <Signup />
            </PageTransition>
          }
        />
        <Route
          path='/login'
          element={
            <PageTransition>
              <Login />
            </PageTransition>
          }
        />
        <Route
          path='/forgot-password'
          element={
            <PageTransition>
              <ForgotPassword />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToTop />
        <DataSyncInitializer />
        <ToastContainer
          position='top-right'
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme='light'
          toastClassName='custom-toast'
          progressClassName='custom-progress'
          icon={({ type }) => {
            return type === 'success' ? '✓' : type === 'error' ? '!' : 'i';
          }}
          limit={3}
        />
        <ImageCacheProvider>
          <AnimatedRoutes />
        </ImageCacheProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
};

export default App;
