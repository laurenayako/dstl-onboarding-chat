# DSTL Onboarding - Chatbot

See the onboarding docs for instructions on how to use this repo:
<https://dstl.ucsd.edu/onboarding/>

## Features to Implement

Implement the following features in order.

### 1. View Conversation Messages

**Goal:** When a user clicks on an existing conversation in the sidebar, the
application should fetch and display all messages associated with that
conversation in the main chat area.

**Check your work:**

1. Click on a conversation title in the left sidebar.
1. Verify that the main chat window updates to show the messages from that conversation.
1. Verify that switching between different conversations updates the message view accordingly.

### 2. New Chat & Sending Messages

**Goal:**
Implement the functionality to start a new conversation and send messages.

- Clicking the "New Chat" button should clear the current message view and
  deselect any active conversation.
- When a user types a message and sends it (via "Send" button or Enter key):
  - If currently in a "New Chat" state: Create a new conversation in the
    backend, then add the message to it. The new conversation should appear in
    the sidebar. DON'T create a new conversation until the user sends the first
    message.
  - If currently viewing an existing conversation: Add the message to the
    current conversation.
- The conversation title should be updated to "Conversation <ID>" after
  creation.

**Check your work:**

1. Click the "+ New Chat" button. Verify the main window is empty.
1. Type "Hello world" and send.
1. Verify a new conversation appears in the sidebar.
1. Verify "Hello world" appears in the chat window as a user message.
1. Refresh the page and verify the conversation and message persist.

### 3. Connect LLM Backend

**Goal:**
Integrate the backend with the NRP LLM API so that the chatbot responds to user messages.

- When a user sends a message, the backend should send the conversation history to the LLM API.
- The LLM's response should be saved to the database as an "assistant" message.
- The response should be returned to the frontend and displayed in the chat.

**Implementation Notes:**

- You should start by copying this file into your backend:
  <https://gist.github.com/SamLau95/fbbe13328658bd3be6dbc203f440f42f>. Then, see
  if you can get it to work. You will need to set the `NRP_API_KEY` environment
  variable in a `.env` file, get the NRP API key from Sam, and install the
  `openai` package.

**Check your work:**

1. Send a message like "What is the capital of France?".
2. Verify that after a brief delay, an assistant message appears saying "Paris".
3. Send a follow-up question like "What is its population?".
4. Verify the assistant answers with context from the previous message.

### 4. Markdown Rendering

**Goal:** Render message content using Markdown so that code blocks, bold text,
lists, etc., are displayed correctly.

**Check your work:**

1. Send a message containing Markdown syntax, e.g.:

   ```markdown
   Here is some **bold** text and a list:

   - item 1
   - item 2
   ```

2. Verify that the text renders with the correct formatting (bolding, bullet
   points) instead of showing the raw symbols.

### Bonus Features (Optional)

Here are a few ideas for extending this app. Feel free to implement any of
these, or come up with your own ideas!

- Allow the user to change the model used for the LLM.
  <https://nrp.ai/documentation/userdocs/ai/llm-managed/> has the complete list
  of models.
- After starting a conversation, use an LLM call in the background to
  automatically set the conversation title to something descriptive (e.g.,
  "Conversation about <topic>") after creation.
- When a user sends a message, display it in the chat interface immediately and
  show a loading indicator until the LLM response is received.
- Stream responses from the LLM to the user as they are generated, rather than
  waiting for the entire response to be generated before displaying it.
