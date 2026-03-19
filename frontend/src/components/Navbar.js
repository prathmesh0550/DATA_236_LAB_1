import { Link } from "react-router-dom"

export default function Navbar() {
  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link to="/" className="brand">yelp</Link>

        <div className="topbar-links">
          <a href="#activity">Popular Restaurants</a>
          <a href="#cities">Cities</a>
          <Link to="/favorites">Favorites</Link>
        </div>

        <div className="topbar-actions">
          <Link to="/login" className="btn btn-ghost">Log In</Link>
          <Link to="/signup" className="btn btn-primary">Sign Up</Link>
        </div>
      </div>
    </header>
  )
}