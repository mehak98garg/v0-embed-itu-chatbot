// =============================================================================
// Chat Agent with User & Agent Bubbles (React + Vercel)
//
// This React component renders a chat interface where users can type messages
// and receive responses from an agent via a serverless API endpoint on Vercel.
// Messages are displayed in styled chat bubbles to clearly differentiate between
// user messages (right-aligned) and agent messages (left-aligned).
//
// Key Features:
// - Maintains a conversation history.
// - Displays each message in a styled bubble.
// - Sends user messages to the API and appends the agent's response (rendered as Markdown) to the chat.
// - Automatically scrolls to the latest message in a scrollable parent container.
// - Animates the submit button while the agent is "thinking".
// - Provides detailed comments for ease of understanding.
//
// Author: Thomas J McLeish
// Date: March 2, 2025
// =============================================================================

// Import the chat configuration settings.
// includes the header title, description, and suggested prompts.
import chatConfig from "../config/config";
// Import React hooks for managing state and side effects.
import { useState, useEffect, useRef } from "react";
// Import react-markdown to render markdown content.
import ReactMarkdown from "react-markdown";
// Import UUID to generate session ID
import { v4 as uuidv4 } from "uuid";

/**
 * Retrieves or generates a session ID and stores it in sessionStorage.
 * Ensures it only runs on the client side and limits it to 32 characters.
 * @returns {string} The session ID.
 */
const getSessionId = () => {
  if (typeof window === "undefined") return ""; // Prevent SSR issues

  let sessionId = sessionStorage.getItem("sessionId");
  //if the id is greater than 32 characters, we need to generate a new one.
  sessionId = sessionId && sessionId.length <= 32 ? sessionId : null;

  if (!sessionId) {
    //the generated id is 36 characters long, so we need to remove the dashes and limit it to 32 characters.
    sessionId = uuidv4().replace(/-/g, "").slice(0, 32); // Ensure max 32 chars
    sessionStorage.setItem("sessionId", sessionId);
  }
  return sessionId;
};

/**
 * Retrieves or generates a persistent user ID and stores it in localStorage.
 * Ensures it only runs on the client side and limits it to 32 characters.
 * @returns {string} The user ID.
 */
const getUserId = () => {
  if (typeof window === "undefined") return ""; // Prevent SSR issues

  let userId = localStorage.getItem("userId");
  //if the id is greater than 32 characters, we need to generate a new one.
  userId = userId && userId.length <= 32 ? userId : null;

  if (!userId) {
    //the generated id is 36 characters long, so we need to remove the dashes and limit it to 32 characters.
    userId = uuidv4().replace(/-/g, "").slice(0, 32); // Ensure max 32 chars
    localStorage.setItem("userId", userId);
  }
  return userId;
};

/**
 * AgentComponent renders a chat interface with user and agent bubbles.
 * It manages the conversation state, handles user input and API requests,
 * and renders responses as Markdown.
 *
 * @returns {JSX.Element} The rendered chat interface.
 */
export default function AgentComponent() {
  // State to store the user's current input from the text field.
  const [message, setMessage] = useState("");

  // State to store the conversation as an array of message objects.
  // Each message object has a role ("user" or "agent") and the message content.
  const [conversation, setConversation] = useState([]);

  // State to capture any errors during the API request.
  const [error, setError] = useState(null);

  // State to track if the agent is processing (loading state).
  const [isLoading, setIsLoading] = useState(false);

  // Create a ref to track the end of the messages container.
  const messagesEndRef = useRef(null);

  // Initialize session ID and user ID states.
  const [sessionId, setSessionId] = useState("");
  const [userId, setUserId] = useState("");

  // Initialize the hovered index state for suggested prompts.
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // State to track if the submit button is hovered.
  const [isSubmitHovered, setIsSubmitHovered] = useState(false);

  // Initialize session ID and user ID on the client side
  useEffect(() => {
    setSessionId(getSessionId());
    setUserId(getUserId());
  }, []);

  /**
   * Scrolls the chat container to the bottom to ensure the latest message is visible.
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to the latest message whenever the conversation updates.
  useEffect(() => {
    if (document.querySelector(".chat-container")) {
      scrollToBottom();
    }
  }, [conversation]);

  /**
   * Handles the form submission event.
   * @param {Event} e - The form submission event.
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    submitMessage(message);
  };

  /**
   * Handles the submission of the chat input form.
   *
   * Prevents the default form submission behavior, updates the conversation
   * with the user's message, sends the message to the API, and appends the agent's
   * response to the conversation.
   *
   * @param {Event} e - The form submission event.
   * @returns {Promise<void>} A promise that resolves when the submission is complete.
   */
  const submitMessage = async (userInput) => {
    // If the message is empty, do nothing.
    if (!userInput.trim()) return;

    // Clear the input immediately after user submits
    setMessage("");

    // Clear any previous errors.
    setError(null);

    // Create a new conversation entry for the user's message.
    const userMessage = {
      role: "user",
      content: userInput.trim(),
    };

    // Update the conversation state by adding the user's message.
    setConversation((prev) => [...prev, userMessage]);

    // Prepare the payload for the API call.
    // Note: In production, user_id and session_id should be uniquely generated.
    const payload = {
      data: {
        message: userMessage,
      },
      stateful: true,
      stream: false,
      user_id: userId,
      session_id: sessionId,
      verbose: false,
    };

    try {
      // Set loading state to true to trigger the animation.
      setIsLoading(true);

      // Send a POST request to the serverless API endpoint on Vercel.
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // If the server response is not OK, throw an error.
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      // Parse the JSON response from the API.
      const data = await res.json();

      // Extract the agent's reply from output_data.content.
      // If output_data or content is missing, fall back to a default message.
      const agentReply =
        data.output_data && data.output_data.content
          ? data.output_data.content
          : "No valid response received from agent.";

      // Create a new conversation entry for the agent's response.
      const agentMessage = {
        role: "agent",
        content: agentReply,
      };

      // Update the conversation state by adding the agent's message.
      setConversation((prev) => [...prev, agentMessage]);

      // Clear the user input field.
      setMessage("");
    } catch (err) {
      // Log the error to the console for debugging.
      console.error("Error fetching agent response:", err);
      // Update the error state so that the user is informed.
      setError(err.message);
    } finally {
      // Reset the loading state regardless of success or error.
      setIsLoading(false);
    }
  };

  /**
   * Inline styles for chat bubbles based on the message role.
   *
   * @type {Object}
   * @property {Object} user - Styles for user messages (right-aligned, light green background).
   * @property {Object} agent - Styles for agent messages (left-aligned, light gray background).
   */
  const bubbleStyles = {
  user: {
    alignSelf: "flex-end",
    backgroundColor: "#D1D1EB",       // light purple
    color: "#000",
    padding: "10px 14px",
    borderRadius: "18px 18px 0 18px", // Rounded shape
    margin: "4px 8px",
    maxWidth: "75%",
    fontSize: "14px",
  },
  agent: {
    alignSelf: "flex-start",
    backgroundColor: "#C3EBDA",          // green bubble
    color: "#000",
    padding: "10px 14px",
    borderRadius: "18px 18px 18px 0",
    margin: "4px 8px",
    maxWidth: "75%",
    fontSize: "14px",
    border: "1px solid #ddd" ,
    overflowWrap: "break-word",   // ✅ Add this
    wordBreak: "break-word",      // ✅ Add this
    whiteSpace: "pre-wrap",       // ✅ Optional: keeps line breaks
  }
};

  /**
   * Handles the click event on a suggested prompt.
   *
   * Sets the chat input to the prompt text when clicked.
   * Submit the prompt to the chat
   *
   * @param {Object} prompt - The prompt object containing text and autoSubmit flag.
   */
  const handlePromptClick = async (prompt) => {
    // Set the chat input to the prompt text.
    setMessage(prompt);
    // Submit the prompt to the chat.
    setTimeout(() => {
      submitMessage(prompt);
    }, 0); // Ensures the state has been updated before calling submitMessage
  };

  /**
   * Handles the mouseover event on a suggested prompt.
   * @param {*} index
   */
  const handlePromptMouseOver = (index) => {
    if (!isLoading) {
      setHoveredIndex(index);
    }
  };

  /**
   * Handles the mouseout event on a suggested prompt.
   */
  const handlePromptMouseOut = () => {
    setHoveredIndex(null);
  };

  return (
    <div
      style={{
  backgroundColor: "#F8F5E6",       // Light beige background
  width: "100vw",
  maxWidth: "400px",                // Phone width
  height: "95vh",                   // Full height like a phone
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  border: "1px solid #ddd",
  borderRadius: "20px",
  overflow: "hidden",
  fontFamily: "'Helvetica Neue', sans-serif",
}}
    >
      {/* Descriptive header for the chat application */}
      <div
        className="chat-header"
        style={{
          marginBottom: "0px",
          userSelect: "none",
          boxSizing: "border-box", // ✅ Add this to contain padding/margin
          padding: 0                // ✅ Ensures edge alignment
        }}
      >
        <div
  className="chat-title"
  style={{
    backgroundColor: "#558E55",
    color: "#fff",
    padding: "20px",
    borderTopLeftRadius: "20px",
    borderTopRightRadius: "20px",
    fontSize: "16px",
    fontWeight: "bold",
    width: "100%",                 // ensure full width
    boxSizing: "border-box",       // padding won't overflow width
    margin: "0", // ✅ Add this line
  }}
>
  {chatConfig.header.title}
</div>
        <div
          className="chat-description"
          style={{
            padding: "12px 20px",
            borderRadius: "0px",
            fontSize: "12px",
            fontWeight: "normal",
            boxSizing: "border-box", // ✅ Add this line
          }}
        >
          {chatConfig.header.description}
        </div>
      </div>

      {/* Chat conversation container displaying messages in bubbles */}
      <div
  className="chat-container"
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    flexGrow: 1,                         // 🟢 Add this line
    overflowY: "auto",
    padding: "0px",
    backgroundColor: "#fff",
    width: "100%",
    border: "2px solid #558E55",
    borderRadius: "0px 0px 0 0",
  }}
>
        {conversation.map((msg, index) => (
          <div
            key={index}
            style={msg.role === "user" ? bubbleStyles.user : bubbleStyles.agent}
          >
            {msg.role === "agent" ? (
              // Render the agent's response as Markdown.
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            ) : (
              // Display user messages as plain text.
              msg.content
            )}
          </div>
        ))}
        {/* Dummy element to ensure the latest message is scrolled into view */}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Section */}
     <div
  style={{
    padding: "0 20px",           // Aligns with top section
    marginBottom: "10px",
  }}
>
  <div
    style={{
      margin: "10px 0 8px 0",     // Neat spacing above and below
      fontSize: "14px",
      fontStyle: "normal",
    }}
  >
    {chatConfig.suggestedPromptsTitle}
  </div>

  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
      rowGap: "6px",
    }}
  >
    {chatConfig.suggestedPrompts.map((prompt, index) => (
      <button
        key={index}
        onClick={() => handlePromptClick(prompt)}
        onMouseOver={() => handlePromptMouseOver(index)}
        onMouseOut={handlePromptMouseOut}
        disabled={isLoading}
        style={{
          padding: "6px 10px",
          borderRadius: "5px",
          border: "1px solid #ccc",
          backgroundColor: hoveredIndex === index ? "#ddd" : "#f4f4f4",
          color: hoveredIndex === index ? "#000" : "#888",
          fontSize: "12px",
          cursor: "pointer",
        }}
      >
        {prompt}
      </button>
    ))}
  </div>
</div>


      {/* Chat input form for the user to send messages */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0px" }}>
        <div
          style={{
  display: "flex",
  alignItems: "center",
  width: "100%",
  padding: "12 20px",                 // ✅ Matches header padding
  borderBottomLeftRadius: "20px",    // ✅ Aligns with chatbox
  borderBottomRightRadius: "20px",
  backgroundColor: "#FFFFFF",
  boxSizing: "border-box",           // ✅ Prevents overflow from padding
}}
        >
          <input
            type="text"
            id="message"
            placeholder={chatConfig.chatInputPlaceholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              flexGrow: 1,
              padding: "18px 20px",
              border: "none",
              outline: "none",
              backgroundColor: "#fff",
              color: "#000",                // ⬅️ Add this line
            }}
          />
          <button
            type="submit"
              aria-label="Send prompt"
                data-testid="send-button"
                  disabled={isLoading}
                    onMouseOver={() => setIsSubmitHovered(true)}
                      onMouseOut={() => setIsSubmitHovered(false)}
style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9999px",
    transition: "opacity 0.2s ease",
    backgroundColor: isSubmitHovered ? "#446C44" : "#558E55", // ✅ Match header, darker on hover
    color: "#fff",
    padding: "10px",                  // ✅ Increased top/bottom padding
    height: "40px",                   // ✅ Slightly taller button
    width: "40px",
    border: "3px solid #fff",
    cursor: isLoading ? "default" : "pointer",
  }}
          >
            {!isLoading ? (
              <svg
                width="36px"
                height="36px"
                viewBox="8 8 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M15.1918 8.90615C15.6381 8.45983 16.3618 8.45983 16.8081 8.90615L21.9509 14.049C22.3972 14.4953 22.3972 15.2189 21.9509 15.6652C21.5046 16.1116 20.781 16.1116 20.3347 15.6652L17.1428 12.4734V22.2857C17.1428 22.9169 16.6311 23.4286 15.9999 23.4286C15.3688 23.4286 14.8571 22.9169 14.8571 22.2857V12.4734L11.6652 15.6652C11.2189 16.1116 10.4953 16.1116 10.049 15.6652C9.60265 15.2189 9.60265 14.4953 10.049 14.049L15.1918 8.90615Z"
                  fill="currentColor"
                ></path>
              </svg>
            ) : (
              <svg
                width="36px"
                height="36px"
                viewBox="0 0 50 50"
                style={{ animation: "spin 1s linear infinite" }}
              >
                <circle
                  cx="25"
                  cy="25"
                  r="20"
                  stroke="#888"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="25"
                  cy="25"
                  r="20"
                  stroke="#fff"
                  strokeWidth="12"
                  strokeDasharray="31.4 31.4"
                  fill="none"
                />
              </svg>
            )}
          </button>
        </div>
      </form>

      {/* Display error message if one occurs */}
      {error && (
        <div style={{ color: "red", marginTop: "20px" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Define keyframes for the spin animation */}
      <style jsx>{`
        .chat-container::-webkit-scrollbar {
          width: 8px; /* Make scrollbar thinner */
        }
        .chat-container::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 5px; /* Ensures the track has rounded corners */
        }
        .chat-container::-webkit-scrollbar-thumb {
          background-color: #ccc;
          border-radius: 5px;
        }
        /* Firefox scrollbar styling */
        .chat-container {
          scrollbar-width: thin;
          scrollbar-color: #ccc transparent;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
