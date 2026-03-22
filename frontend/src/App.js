import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import OwnerLogin from "./pages/OwnerLogin"
import OwnerSignup from "./pages/OwnerSignup"
import Profile from "./pages/Profile"
import EditProfile from "./pages/EditProfile"
import Preferences from "./pages/Preferences"
import EditPreferences from "./pages/EditPreferences"
import Favorites from "./pages/Favorites"
import History from "./pages/History"
import RestaurantDetails from "./pages/RestaurantDetails"
import AddRestaurant from "./pages/AddRestaurant"
import WriteReview from "./pages/WriteReview"
import EditReview from "./pages/EditReview"
import OwnerDashboard from "./pages/OwnerDashboard"
import OwnerRestaurants from "./pages/OwnerRestaurants"
import OwnerRestaurantReviews from "./pages/OwnerRestaurantReviews"
import EditRestaurant from "./pages/EditRestaurant"
import Chatbot from "./components/Chatbot"
import ProtectedRoute from "./components/ProtectedRoute"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/owner/login" element={<OwnerLogin />} />
        <Route path="/owner/signup" element={<OwnerSignup />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute role="user">
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute role="user">
              <EditProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/preferences"
          element={
            <ProtectedRoute role="user">
              <Preferences />
            </ProtectedRoute>
          }
        />
        <Route
          path="/preferences/edit"
          element={
            <ProtectedRoute role="user">
              <EditPreferences />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute role="user">
              <Favorites />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute role="user">
              <History />
            </ProtectedRoute>
          }
        />
        <Route path="/restaurant/:id" element={<RestaurantDetails />} />
        <Route
          path="/add-restaurant"
          element={
            <ProtectedRoute role="user">
              <AddRestaurant />
            </ProtectedRoute>
          }
        />
        <Route
          path="/review/:id"
          element={
            <ProtectedRoute role="user">
              <WriteReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-review/:reviewId"
          element={
            <ProtectedRoute role="user">
              <EditReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/dashboard"
          element={
            <ProtectedRoute role="owner">
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/restaurants"
          element={
            <ProtectedRoute role="owner">
              <OwnerRestaurants />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/restaurants/:id/reviews"
          element={
            <ProtectedRoute role="owner">
              <OwnerRestaurantReviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/restaurants/:id/edit"
          element={
            <ProtectedRoute role="owner">
              <EditRestaurant />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Chatbot />
    </BrowserRouter>
  )
}