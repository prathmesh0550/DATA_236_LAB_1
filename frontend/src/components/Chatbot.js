import { useState } from "react"

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi, I can help you find restaurants by cuisine, city, and dining preferences."
    }
  ])

  const getReply = (text) => {
    const value = text.toLowerCase()

    if (value.includes("pizza")) return "You can search for pizza in the search bar to discover top-rated pizza restaurants."
    if (value.includes("indian")) return "Try searching for Indian restaurants to find highly rated places near your selected city."
    if (value.includes("chinese")) return "Search Chinese restaurants from the homepage to explore popular options."
    if (value.includes("mexican")) return "Mexican restaurants can be found quickly by typing Mexican in the restaurant or cuisine field."
    if (value.includes("italian")) return "Type Italian in the search bar to see available Italian restaurants."
    if (value.includes("city")) return "You can filter restaurants by entering a city in the city field on the homepage."
    if (value.includes("rating")) return "Restaurant cards show ratings and review counts so you can compare options easily."
    if (value.includes("favorite")) return "You can save restaurants in Favorites after logging in."
    if (value.includes("review")) return "Open a restaurant and go to the review page to add your review."
    return "I can help with cuisines, cities, favorites, and restaurant search. Try asking for pizza, Indian food, or restaurants in a city."
  }

  const sendMessage = () => {
    if (!message.trim()) return

    const userMessage = {
      role: "user",
      text: message
    }

    const botMessage = {
      role: "assistant",
      text: getReply(message)
    }

    setMessages((prev) => [...prev, userMessage, botMessage])
    setMessage("")
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage()
    }
  }

  return (
    <div className={`chatbot-shell ${open ? "chatbot-open" : ""}`}>
      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div>
              <h3>Restaurant Assistant</h3>
              <span>Online</span>
            </div>
            <button className="chatbot-close" onClick={() => setOpen(false)}>×</button>
          </div>

          <div className="chatbot-body">
            {messages.map((item, index) => (
              <div
                key={index}
                className={`chatbot-message ${item.role === "user" ? "chatbot-user" : "chatbot-assistant"}`}
              >
                {item.text}
              </div>
            ))}
          </div>

          <div className="chatbot-footer">
            <input
              type="text"
              placeholder="Ask about restaurants..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}

      {!open && (
        <button className="chatbot-toggle" onClick={() => setOpen(true)}>
          Chat
        </button>
      )}
    </div>
  )
}