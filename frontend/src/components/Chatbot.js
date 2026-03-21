import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import API from "../api/axios"

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [restaurants, setRestaurants] = useState([])
  const [preferences, setPreferences] = useState(null)
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi, ask me about cuisines, cities, ratings, or restaurant recommendations."
    }
  ])

  useEffect(() => {
    API.get("/restaurants").then((res) => setRestaurants(res.data || [])).catch(() => setRestaurants([]))

    if (localStorage.getItem("role") === "user") {
      API.get("/users/me/preferences")
        .then((res) => setPreferences(res.data || {}))
        .catch(() => setPreferences(null))
    }
  }, [])

  const buildReply = (text) => {
    const q = text.toLowerCase().trim()

    const matchedByName = restaurants.filter((r) => (r.name || "").toLowerCase().includes(q))
    if (matchedByName.length > 0) {
      const r = matchedByName[0]
      return {
        text: `${r.name} has an average rating of ${Number(r.avg_rating || 0).toFixed(1)} and ${r.review_count || 0} reviews.`,
        cards: [r]
      }
    }

    const cuisineKeywords = ["italian", "indian", "chinese", "mexican", "japanese", "american"]
    const cityWords = q.split(" ").filter(Boolean)

    let cuisine = cuisineKeywords.find((item) => q.includes(item)) || ""
    let city = ""

    restaurants.forEach((r) => {
      const c = (r.city || "").toLowerCase()
      if (!city && c && cityWords.some((word) => c.includes(word))) {
        city = r.city
      }
    })

    let filtered = restaurants

    if (cuisine) {
      filtered = filtered.filter((r) => (r.cuisine_type || "").toLowerCase().includes(cuisine))
    }

    if (city) {
      filtered = filtered.filter((r) => (r.city || "").toLowerCase().includes(city.toLowerCase()))
    }

    if (!cuisine && preferences?.cuisines?.length) {
      const preferred = preferences.cuisines[0].toLowerCase()
      filtered = filtered.filter((r) => (r.cuisine_type || "").toLowerCase().includes(preferred))
    }

    filtered = [...filtered].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0)).slice(0, 3)

    if (filtered.length > 0) {
      const reasonBits = []
      if (cuisine) reasonBits.push(`${cuisine} cuisine`)
      if (city) reasonBits.push(`in ${city}`)
      if (!cuisine && preferences?.cuisines?.length) reasonBits.push(`your saved preference for ${preferences.cuisines[0]}`)

      const reasonText = reasonBits.length ? ` based on ${reasonBits.join(" and ")}` : ""
      return {
        text: `Here are some recommendations${reasonText}.`,
        cards: filtered
      }
    }

    return {
      text: "I could not find a strong match. Try asking for a cuisine, a city, or a restaurant name.",
      cards: []
    }
  }

  const sendMessage = () => {
    if (!message.trim()) return

    const userMessage = { role: "user", text: message }
    setMessages((prev) => [...prev, userMessage])
    setLoading(true)

    setTimeout(() => {
      const reply = buildReply(message)
      setMessages((prev) => [...prev, { role: "assistant", text: reply.text, cards: reply.cards }])
      setLoading(false)
      setMessage("")
    }, 500)
  }

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        text: "Hi, ask me about cuisines, cities, ratings, or restaurant recommendations."
      }
    ])
  }

  return (
    <div className="chatbot-shell">
      {open ? (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div>
              <h3>Restaurant Assistant</h3>
              <span>Online</span>
            </div>
            <div className="chatbot-header-actions">
              <button className="chatbot-clear" onClick={clearChat}>New</button>
              <button className="chatbot-close" onClick={() => setOpen(false)}>×</button>
            </div>
          </div>

          <div className="chatbot-body">
            {messages.map((item, index) => (
              <div key={index} className={`chatbot-bubble-wrap ${item.role === "user" ? "chatbot-bubble-user-wrap" : ""}`}>
                <div className={`chatbot-message ${item.role === "user" ? "chatbot-user" : "chatbot-assistant"}`}>
                  {item.text}
                </div>

                {item.cards && item.cards.length > 0 && (
                  <div className="chatbot-cards">
                    {item.cards.map((r) => (
                      <Link key={r.restaurant_id} to={`/restaurant/${r.restaurant_id}`} className="chatbot-card-link">
                        <div className="chatbot-card">
                          <strong>{r.name}</strong>
                          <span>{r.cuisine_type || "Restaurant"} • {r.city || "City"}</span>
                          <span>{Number(r.avg_rating || 0).toFixed(1)} ★</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && <div className="chatbot-thinking">Thinking...</div>}
          </div>

          <div className="chatbot-footer">
            <input
              type="text"
              placeholder="Ask about restaurants..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      ) : (
        <button className="chatbot-toggle" onClick={() => setOpen(true)}>Chat</button>
      )}
    </div>
  )
}