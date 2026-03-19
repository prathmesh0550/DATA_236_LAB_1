import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Favorites from "./pages/Favorites"
import Profile from "./pages/Profile"
import Preferences from "./pages/Preferences"
import AddRestaurant from "./pages/AddRestaurant"
import RestaurantDetails from "./pages/RestaurantDetails"
import WriteReview from "./pages/WriteReview"
import Chatbot from "./components/Chatbot"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/add-restaurant" element={<AddRestaurant />} />
        <Route path="/restaurant/:id" element={<RestaurantDetails />} />
        <Route path="/review/:id" element={<WriteReview />} />
      </Routes>
      <Chatbot />
    </BrowserRouter>
  )
}