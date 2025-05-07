// config.js
// =============================================================================
// Chat Application Configuration
// =============================================================================
// This configuration file stores metadata and descriptions related to the Chat Agent component.
// The goal is to keep the main component clean and maintainable.
//
// Key Features:
// - Stores the descriptive header for the chat component.
// - Provides metadata such as the author and version.
// - Can be extended for additional configuration settings in the future.
// =============================================================================

const chatConfig = {
  flowURL:
    "https://api.zerowidth.ai/v1/process/qFqA9s2hBRoabFli3QEn/lqtUXWMQlCFC1BaPWZK4",
  header: {
    title: "Itu Chatbot",
    description:
      "Itu Didi is here to help you gain financial independence",
  },
  suggestedPromptsTitle: "Here are some suggested prompts.",
  suggestedPrompts: [
    "How can I save money for my children's education?",
    "How can I get money to start my tailoring business?",
    "I want to know about getting a loan",
  ],
  chatInputPlaceholder: "Chat with this agent..",
  maxChatHeight: 400,
};

export default chatConfig;
