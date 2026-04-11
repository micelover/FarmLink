import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";
import { useAuth } from "./lib/AuthContext";
import { CartProvider } from "./lib/CartContext";
import AddressModal from "./components/AddressModal";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Account from "./pages/Account";
import Marketplace from "./pages/Marketplace";
import ProductDetail from "./pages/ProductDetail";
import FarmMap from "./pages/FarmMap";
import FarmProfile from "./pages/FarmProfile";

// Auth pages where we should NOT show the address gate
const AUTH_ROUTES = ["/login", "/signup"];

function AddressGate() {
  const { user, profile, loading } = useAuth();
  const { pathname } = useLocation();

  const needsAddress =
    !loading &&
    user != null &&
    profile != null &&
    !profile.address &&
    !AUTH_ROUTES.includes(pathname);

  return (
    <AddressModal
      isOpen={needsAddress}
      onClose={() => {}}
      onSave={() => {}}
      required
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AddressGate />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/account" element={<Account />} />
            <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/farms" element={<FarmMap />} />
          <Route path="/farm/:farmerId" element={<FarmProfile />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
