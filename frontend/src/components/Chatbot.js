import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import API from "../api/axios"

const WELCOME_MESSAGE = {
  role: "assistant",
  text: "Hi! Ask me about cuisines, cities, ratings, or restaurant recommendations.",
  cards: [],
}

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const buildHistory = (msgs) =>
    msgs.slice(-8).map((m) => ({
      role: m.role,
      content: m.text,
    }))

  const sendMessage = async (text) => {
    const query = (text || message).trim()
    if (!query || loading) return

    const updatedMessages = [...messages, { role: "user", text: query, cards: [] }]
    setMessages(updatedMessages)
    setMessage("")
    setLoading(true)

    try {
      const { data } = await API.post("/ai-assistant/chat", {
        message: query,
        conversation_history: buildHistory(updatedMessages),
      })

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply || "Here are some suggestions.",
          cards: data.restaurants || [],
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            err.response?.data?.detail ||
            "Sorry, I ran into an error. Please try again.",
          cards: [],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE])
    setMessage("")
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
              <div
                key={index}
                className={`chatbot-bubble-wrap ${item.role === "user" ? "chatbot-bubble-user-wrap" : ""}`}
              >
                <div className={`chatbot-message ${item.role === "user" ? "chatbot-user" : "chatbot-assistant"}`}>
                  {item.text}
                </div>

                {item.cards && item.cards.length > 0 && (
                  <div className="chatbot-cards">
                    {item.cards.map((r) => (
                      <Link
                        key={r.restaurant_id}
                        to={`/restaurant/${r.restaurant_id}`}
                        className="chatbot-card-link"
                      >
                        <div className="chatbot-card">
                          <strong>{r.name}</strong>
                          <span>
                            {r.cuisine_type || "Restaurant"} • {r.city || "City"}
                          </span>
                          <span>
                            {Number(r.avg_rating || 0).toFixed(1)} ★
                            {r.price_tier ? ` • ${r.price_tier}` : ""}
                            {typeof r.review_count === "number" ? ` • ${r.review_count} reviews` : ""}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && <div className="chatbot-thinking">Thinking...</div>}
            <div ref={bottomRef} />
          </div>

          <div className="chatbot-footer">
            <input
              type="text"
              placeholder="Ask about restaurants..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
              disabled={loading}
            />
            <button onClick={() => sendMessage()} disabled={loading}>
              Send
            </button>
          </div>
        </div>
      ) : (
        <button className="chatbot-toggle" onClick={() => setOpen(true)}>
          Chat
        </button>
      )}
    </div>
  )
}