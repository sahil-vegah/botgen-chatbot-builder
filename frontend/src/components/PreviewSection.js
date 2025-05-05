import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaEye, FaPaperPlane } from 'react-icons/fa';
import { sanitizeString, playAudio } from '../utils/helpers';
import { sendChatMessage } from '../services/api';

const Section = styled.section`
  flex: 1;
  min-width: 300px;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: var(--card-shadow);
  padding: 25px;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const PreviewHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
  
  h2 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--text-color);
  }
  
  svg {
    color: var(--primary-color);
    font-size: 1.2rem;
  }
`;

const ChatbotPreview = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  min-height: 300px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
`;

const Message = styled.div`
  max-width: 85%;
  margin-bottom: 10px;
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 0.9rem;
  line-height: 1.4;
  
  &.bot {
    align-self: flex-start;
    background-color: #f1f1f1;
    color: var(--text-color);
  }
  
  &.user {
    align-self: flex-end;
    background-color: var(--primary-color);
    color: white;
  }

  &.typing-indicator {
    background-color: #f1f1f1;
    padding: 15px;
    
    p {
      display: flex;
      align-items: center;
      gap: 5px;
      
      span {
        display: block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--text-light);
        opacity: 0.5;
        animation: typing-animation 1s infinite ease-in-out;
      }
      
      span:nth-child(1) {
        animation-delay: 0s;
      }
      
      span:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      span:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }
  
  @keyframes typing-animation {
    0%, 100% { opacity: 0.5; transform: translateY(0); }
    50% { opacity: 1; transform: translateY(-5px); }
  }
`;

const ChatInput = styled.div`
  display: flex;
  padding: 10px;
  border-top: 1px solid var(--border-color);
  
  input {
    flex: 1;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px 0 0 6px;
    font-size: 0.95rem;
    
    &:focus {
      outline: none;
      border-color: var(--primary-color);
    }
    
    &:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }
  }
`;

const SendButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0 6px 6px 0;
  cursor: pointer;
  transition: var(--transition);
  
  &:hover {
    background-color: var(--primary-light);
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  svg {
    font-size: 1rem;
  }
`;

const PreviewSection = ({ currentChatbotId, currentTemperature, showNotification }) => {
  const [messages, setMessages] = useState([
    { text: "Hi there! I'm your AI assistant. How can I help you today?", sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Selected model state from app context or parent component
  const [modelType, setModelType] = useState('Groq');
  const [isVoice, setIsVoice] = useState(false);
  const [voiceModel, setVoiceModel] = useState('Fritz-PlayAI');
  
  // Scroll to the bottom of the chat whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Function to scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };
  
  // Handle key press (Enter to send)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  // Add a message to the chat
  const addMessage = (text, sender) => {
    setMessages(prev => [...prev, { text: sanitizeString(text), sender }]);
  };
  
  // Show typing indicator
  const showTypingIndicator = () => {
    setIsTyping(true);
  };
  
  // Hide typing indicator
  const hideTypingIndicator = () => {
    setIsTyping(false);
  };
  
  // Handle send message button click
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    // Add user message to chat
    addMessage(inputText, 'user');
    
    // Clear input
    setInputText('');
    
    // If we have a chatbot ID, send to API
    if (currentChatbotId) {
      try {
        // Show typing indicator
        showTypingIndicator();
        
        // Send message to the API
        const response = await sendChatMessage({
          tableName: currentChatbotId,
          question: inputText,
          modelType,
          isVoice,
          voice: voiceModel,
          temperature: currentTemperature
        });
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Add bot response
        addMessage(response.message, 'bot');
        
        // Play audio if available
        if (response.audioUrl) {
          try {
            await playAudio(response.audioUrl);
          } catch (error) {
            showNotification('Error playing audio response', 'error', 5000);
          }
        }
      } catch (error) {
        // Hide typing indicator
        hideTypingIndicator();
        
        // Add error message
        addMessage('Sorry, I encountered an error. Please try again later.', 'bot');
        
        // Show error notification
        showNotification(error.message || 'Error sending message', 'error', 5000);
      }
    } else {
      // Simulate bot response for demo purposes
      simulateBotResponse();
    }
  };
  
  // Simulate a bot response
  const simulateBotResponse = () => {
    // Show typing indicator
    showTypingIndicator();
    
    // Simulate a random delay between 1-2 seconds
    const randomDelay = Math.floor(Math.random() * 1000) + 1000;
    
    setTimeout(() => {
      // Hide typing indicator
      hideTypingIndicator();
      
      // Random responses for the demo
      const responses = [
        "I'm here to help! What would you like to know about the website?",
        "Thanks for your message. How can I assist you with the website content?",
        "I've analyzed the website and can answer questions about it. What would you like to know?",
        "I can provide information about the website. What specific details are you looking for?"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      addMessage(randomResponse, 'bot');
    }, randomDelay);
  };
  
  return (
    <Section>
      <Card>
        <PreviewHeader>
          <FaEye />
          <h2>Preview Chatbot</h2>
        </PreviewHeader>
        
        <ChatbotPreview>
          <ChatMessages>
            {messages.map((message, index) => (
              <Message key={index} className={message.sender}>
                <p>{message.text}</p>
              </Message>
            ))}
            
            {isTyping && (
              <Message className="bot typing-indicator">
                <p>
                  <span></span>
                  <span></span>
                  <span></span>
                </p>
              </Message>
            )}
            
            <div ref={messagesEndRef} />
          </ChatMessages>
          
          <ChatInput>
            <input
              type="text"
              placeholder="Type your message..."
              value={inputText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
            />
            <SendButton onClick={handleSendMessage}>
              <FaPaperPlane />
            </SendButton>
          </ChatInput>
        </ChatbotPreview>
      </Card>
    </Section>
  );
};

export default PreviewSection; 