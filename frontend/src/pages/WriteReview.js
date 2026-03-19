import Navbar from "../components/Navbar"

export default function WriteReview() {
  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>
      <div className="container">
        <div className="simple-card">
          <h2>Write Review</h2>
          <p>Share your dining experience here.</p>
        </div>
      </div>
    </div>
  )
}