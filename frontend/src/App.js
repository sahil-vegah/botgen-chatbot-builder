import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import './App.css';
import GlobalStyles from './styles/GlobalStyles';
import Header from './components/Header';
import GeneratorSection from './components/GeneratorSection';
import PreviewSection from './components/PreviewSection';
import IntegrationSection from './components/IntegrationSection';
import Footer from './components/Footer';
import Notification from './components/Notification';
import { apiHealthCheck } from './services/api';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
`;

const ContentWrapper = styled.div`
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
  
  @media (max-width: 992px) {
    flex-direction: column;
  }
`;

const App = () => {
  const [currentChatbotId, setCurrentChatbotId] = useState(null);
  const [currentTemperature, setCurrentTemperature] = useState(0.1);
  const [notifications, setNotifications] = useState([]);
  const [isApiConnected, setIsApiConnected] = useState(false);

  // Check API connection on component mount
  useEffect(() => {
    const checkApiConnection = async () => {
      const isAvailable = await apiHealthCheck();
      setIsApiConnected(isAvailable);
      
      // Show notification based on connection status
      if (isAvailable) {
        showNotification('Connected to FastAPI backend with Llama 4 Scout (Groq) and Llama 2 (Ollama) models available', 'success', 8000);
      } else {
        showNotification('Could not connect to FastAPI backend. Please ensure the server is running at http://localhost:8000', 'error', 0);
      }
    };
    
    checkApiConnection();
  }, []);

  // Show notification helper function
  const showNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, duration }]);
    
    // Auto-remove notification after duration (if not 0)
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
      }, duration);
    }
  };

  // Remove notification helper
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  return (
    <>
      <GlobalStyles />
      <Container>
        <Header />
        
        <main>
          <ContentWrapper>
            <GeneratorSection 
              setCurrentChatbotId={setCurrentChatbotId}
              setCurrentTemperature={setCurrentTemperature}
              showNotification={showNotification}
            />
            <PreviewSection 
              currentChatbotId={currentChatbotId}
              currentTemperature={currentTemperature}
              showNotification={showNotification}
            />
          </ContentWrapper>
          
          <IntegrationSection 
            currentChatbotId={currentChatbotId}
            showNotification={showNotification}
          />
        </main>
        
        <Footer />
      </Container>
      
      {/* Notification container */}
      <div id="notification-container">
        {notifications.map(notif => (
          <Notification
            key={notif.id}
            id={notif.id}
            message={notif.message}
            type={notif.type}
            onClose={() => removeNotification(notif.id)}
          />
        ))}
      </div>
    </>
  );
};

export default App; 