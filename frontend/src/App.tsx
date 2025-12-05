import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Conversation = {
  id: number;
  title: string;
}

function App() {
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);

  const handleSend = async () => {
    if (!input.trim()) return; // trimes spaces, and if empty, returns

    let conversationId = currentConversationId

    // if no active conversation, create one
    if(!conversationId) {
      conversationId = await handleNewChat();
      setCurrentConversationId(conversationId)
      if (!conversationId) return;
      //return;
    }

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]); // adds userMessage to end of 'prev' array of messages
    setInput(''); // resets input to empty string so ready for next message

    // saves user message to backend
    try {
      const response = await fetch(`http://127.0.0.1:8100/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'user', content: userMessage.content })
      });
    
      const assistantMessage = await response.json();
      setMessages((prev) => [...prev, assistantMessage])

      // Hard-coded response -> filler before adding api response
//        const assistantMessage: Message = {
//          role: 'assistant',
//          content: assistantContent,
//        };
//        setMessages((prev) => [...prev, assistantMessage]);
      

        // saves AI response message\
    } catch (error) {
      console.error('Failed to save message: ', error)
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {   // if enter pressed without shift
      e.preventDefault();   // stops browser from default action, bc want to send message, not add new line
      handleSend();   // sends instead -> runs handleSend (adds message to state, clears input, prints response)
    }
  };

  useEffect(() => {
    async function getConversations() {
      try{
        const res = await fetch(`http://127.0.0.1:8100/conversations/`)
        const data: Conversation[] = await res.json();
        setConversations(data);
      } catch (error) {
        console.error('Failed to load messages: ', error)
      }
    }

    getConversations();
  }, [])

  // when click conversation, sets as current one
  async function handleConversationClick(conversation_id: number) {
    try {
      const res = await fetch(`http://127.0.0.1:8100/conversations/${conversation_id}/messages`)
      const data: Message[] = await res.json();
      setMessages(data);
      setCurrentConversationId(conversation_id)
    } catch (error) {
      console.error('Failed to load messages: ', error)
    }
  }

  async function createTitle(firstMessage: string) {
    const res = await fetch('http://127.0.0.1:8100/generate-title', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ content: firstMessage })
    });
    const data = await res.json()
    return data.title
  }

  async function handleNewChat() {
    try {
      const title = await createTitle(input)
      const res = await fetch('http://127.0.0.1:8100/conversations/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      });

      if (!res.ok) {
        throw new Error(`HTTP error status: ${res.status}`)
      }
      
      // after creating new conversation, sets it as current one
      const newConversation = await res.json()
      setConversations(prev => [...prev, newConversation]);

      setMessages([]);
      setCurrentConversationId(newConversation.id)
      return newConversation.id
    } catch (error) {
      console.error('Failed to load messages: ', error)
      return null;
    }
  }

  async function deleteConversation(conversationId: number) {
    try {
      const response = await fetch(`http://127.0.0.1:8100/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete conversation');
      }

      const result = await response.json()
      return result;
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }

  return (
    <div className='flex h-screen bg-gray-100'>
      {/* Sidebar */}
      <div className='w-64 bg-gray-900 text-white p-4 flex flex-col'>
        <div className='mb-4'>
          <h1 className='text-xl font-bold'>DSTL Chat App</h1>
        </div>
        <button
          className='w-full py-2 px-4 border border-gray-600 rounded hover:bg-gray-800 text-left mb-4'
          onClick={() => {setMessages([]); setCurrentConversationId(null);}}
        >
          + New Chat
        </button>
        <div className='flex-1 overflow-y-auto rounded'>
          {/* Chat history list would go here */}
          <div className='text-sm text-gray-400'>Previous chats...</div>
          {conversations.map(convo => (
            <button
              key={convo.id}
              className='w-full text-left text-sm text-gray-300 hover:bg-gray-800 p-2 rounded mb-1'
              onClick={() => handleConversationClick(convo.id)}
            >
                {convo.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className='flex-1 flex flex-col'>
        {/* Messages Area */}
        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              > 
                <div>
                  <ReactMarkdown
                    components={{
                      h1: ({node, ref, ...rest}) => <h1 className="text-2xl font-bold mb-2" {...rest} />,
                      ul: ({node, ref, ...rest}) => <ul style={{listStyleType: 'disc', paddingLeft: '20px', marginTop: '8px', marginBottom: '8px'}} {...rest} />,
                      ol: ({node, ref, ...rest}) => <ol style={{listStyleType: 'decimal', paddingLeft: '20px', marginTop: '8px', marginBottom: '8px'}} {...rest} />,
                      li: ({node, ref, ...rest}) => <li style={{display: 'list-item'}} {...rest} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className='text-center text-gray-500 mt-20'>
              <h2 className='text-2xl font-semibold'>
                Welcome to the DSTL Chat App
              </h2>
              <p>Start a conversation!</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className='p-4 border-t border-gray-200 bg-white'>
          <div className='flex gap-4 max-w-4xl mx-auto'>
            <textarea
              className='flex-1 border border-gray-300 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500'
              rows={1}
              placeholder='Type a message...'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className='bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50'
              onClick={handleSend}
              disabled={!input.trim()}
            >
              Send
            </button>
          </div>
          <div className='text-center text-xs text-gray-400 mt-2 hover:bg-gray-100'>
            <button onClick={async () => {
              if (!currentConversationId) return;
              await deleteConversation(currentConversationId);
              setConversations(prev =>
                prev.filter(convo => convo.id !== currentConversationId)
              );
              setMessages([])
              setCurrentConversationId(null);
            }}>
              Delete Conversation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
