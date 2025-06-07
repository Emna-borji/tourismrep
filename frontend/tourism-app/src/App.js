import React, { useEffect, useState } from "react";
import LoginPage from "./components/Auth/LoginPage";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"; // Use BrowserRouter here
import RegisterPage from "./components/Auth/RegisterPage";
// import RestaurantsPage from "./components/Restaurants/RestaurantsPage";
// import HotelDetailsPage from "./components/Hotels/HotelDetailsPage";
// import HotelsPage from "./components/Hotels/HotelsPage";
// import MuseumsPage from "./components/Museums/MuseumsPage";
// import FestivalDetailsPage from "./components/Festivals/FestivalDetailsPage";
// import FestivalsPage from "./components/Festivals/FestivalsPage";
// import GuestHousesPage from "./components/GuestHouses/GuestHousesPage";
// import GuestHouseDetailsPage from "./components/GuestHouses/GuestHouseDetailsPage";
// import Search from "./components/Shared/Search";
// import RestaurantDetailsPage from "./components/Restaurants/RestaurantDetailsPage";



import AccountSettings from "./components/profile/AccountSettings";
import ChangePassword from "./components/profile/ChangePassword";
import { checkAuthStatus } from "./redux/actions/authActions";
import { useDispatch } from "react-redux";
import RestaurantsPage from "./components/pages/RestaurantsPage";
import HotelsPage from "./components/pages/HotelsPage";
import GuestHousesPage from "./components/pages/GuestHousesPage";
import FestivalsPage from "./components/pages/FestivalsPage";
import ArchaeologicalSitesPage from "./components/pages/ArchaeologicalSitesPage";
import ActivitiesPage from "./components/pages/ActivitiesPage";
import MuseumsPage from "./components/pages/MuseumsPage";
import EntityDetailPage from "./components/pages/EntityDetailPage";
import AdminDashboard from "./components/AdminDashboard";
import FavoritesPage from "./components/pages/FavoritesPage";
import CircuitComposer from "./components/CircuitComposer";
import CircuitWizard from "./components/CircuitWizard";
import CircuitSummary from "./components/CircuitSummary";
import GuidesPage from "./components/pages/GuidesPage";
import RecommendationsPage from "./components/RecommendationsPage";
import CircuitList from "./components/CircuitList";
import CircuitDetail from "./components/CircuitDetail";
import Navbar from "./components/Shared/Navbar";
import CircuitHistory from "./components/pages/CircuitHistory";
import TouristMap from "./components/TouristMap";
// import EntityDetailPage from "./components/pages/EntityDetailPage";

const App = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);
  return (
    
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar /> {/* Navbar placée en haut de la page */}
        <div className="flex-1 mt-0"> {/* Ajustement de la marge pour éviter le chevauchement avec la Navbar */}
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/restaurants" element={<RestaurantsPage />} />
            <Route path="/hotels" element={<HotelsPage />} />
            <Route path="/guest_houses" element={<GuestHousesPage />} />
            <Route path="/festivals" element={<FestivalsPage />} />
            <Route path="/archaeological_sites" element={<ArchaeologicalSitesPage />} />
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/museums" element={<MuseumsPage />} />
            <Route path="/:entityType/:id" element={<EntityDetailPage />} />
            <Route path="/account-settings" element={<AccountSettings />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/circuit-wizard" element={<CircuitWizard />} />
            <Route path="/circuit/summary/:id" element={<CircuitSummary />} />
            <Route path="/guides" element={<GuidesPage />} />
            <Route path="/" element={<RecommendationsPage />} />
            <Route path="/predefined-circuits" element={<CircuitList />} />
            <Route path="/circuit/:id" element={<CircuitDetail />} />
            <Route path="/circuit-history" element={<CircuitHistory />} />
            <Route path="/tourist-map" element={<TouristMap />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
