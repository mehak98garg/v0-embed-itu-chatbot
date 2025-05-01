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
    "https://api.zerowidth.ai/v1/process/qFqA9s2hBRoabFli3QEn/lWxNqDLQxsQBApVgJJs5",
  header: {
    title: "Itu Chatbot",
    description:
      "Itu Didi is here to help you gain financial independancy",
  },
  suggestedPromptsTitle: "Here are some suggested prompts.",
  suggestedPrompts: [
    "I want insurance for my kids",
    "How can I take a loan from the bank to start a business?",
    "Is there a pension scheme I can look into?",
  ],
  chatInputPlaceholder: "Chat with this agent...",
  maxChatHeight: 400,
};

export default chatConfig;
