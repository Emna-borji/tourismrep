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
// import EntityDetailPage from "./components/pages/EntityDetailPage";

const App = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);
  return (
    
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} /> 
        {/* <Route path="/restaurants" element={<RestaurantsPage />} /> */}
        {/* <Route path="/restaurant/:id" element={<RestaurantDetailsPage />} /> */}
        {/* <Route path="/hotels" element={<HotelsPage />} />
        <Route path="/hotel/:id" element={<HotelDetailsPage />} />
        <Route path="/museums" element={<MuseumsPage />} />
        <Route path="/festivals" element={<FestivalsPage />} /> */}
        {/* <Route path="/festival/:festivalId" element={<FestivalDetailsPage />} /> */}
        {/* <Route path="/guest-houses" element={<GuestHousesPage />} /> */}
        {/* <Route path="/guest-house/:guestHouseId" element={<GuestHouseDetailsPage />} /> */}

        <Route path="/restaurants" element={<RestaurantsPage />} />
        <Route path="/hotels" element={<HotelsPage />} />
        <Route path="/guest_houses" element={<GuestHousesPage />} />
        <Route path="/festivals" element={<FestivalsPage />} />
        <Route path="/archaeological_sites" element={<ArchaeologicalSitesPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/museums" element={<MuseumsPage />} />
        {/* <Route path="/:entityType/:id" element={<EntityDetailPage />} /> */}
        <Route path="/:entityType/:id" element={<EntityDetailPage />} />


        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/circuit-composer" element={<CircuitComposer />} />
        <Route path="/circuit-wizard" element={<CircuitWizard />} />
        <Route path="/circuit/summary/:id" element={<CircuitSummary />} />

      </Routes>
    </Router>
  );
};

export default App;
