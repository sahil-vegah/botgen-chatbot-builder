import React, { useState } from 'react';
import styled from 'styled-components';
import { FaCopy, FaCheck } from 'react-icons/fa';
import { copyToClipboard } from '../utils/helpers';

const Section = styled.section`
  margin-bottom: 30px;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: var(--card-shadow);
  padding: 25px;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 15px;
  color: var(--text-color);
`;

const Description = styled.p`
  font-size: 0.95rem;
  color: var(--text-light);
  margin-bottom: 20px;
`;

const CodeSnippet = styled.div`
  position: relative;
  background-color: #f8f8f8;
  border-radius: 6px;
  overflow: hidden;
  padding: 0;
  border: 1px solid var(--border-color);
`;

const Pre = styled.pre`
  margin: 0;
  padding: 15px 60px 15px 15px;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--text-color);
  
  code {
    display: block;
    white-space: pre-wrap;
    word-break: break-all;
  }
`;

const CopyButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.copied ? 'var(--success-color)' : 'white'};
  color: ${props => props.copied ? 'white' : 'var(--text-light)'};
  border: 1px solid ${props => props.copied ? 'var(--success-color)' : 'var(--border-color)'};
  border-radius: 4px;
  cursor: pointer;
  transition: var(--transition);
  
  &:hover {
    background-color: ${props => props.copied ? 'var(--success-color)' : '#f1f1f1'};
    color: ${props => props.copied ? 'white' : 'var(--text-color)'};
  }
  
  svg {
    font-size: 1rem;
  }
`;

const Placeholder = styled.div`
  background-color: #f8f8f8;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  padding: 20px;
  text-align: center;
  color: var(--text-light);
  font-style: italic;
`;

const IntegrationSection = ({ currentChatbotId, showNotification }) => {
  const [copied, setCopied] = useState(false);
  
  // Generate integration code based on chatbot ID
  const generateIntegrationCode = () => {
    if (!currentChatbotId) return null;
    
    // In a real-world scenario, this might include additional parameters
    return `<script src="https://botgen.io/widget.js" data-chatbot-id="${currentChatbotId}"></script>`;
  };
  
  // Handle copy button click
  const handleCopyCode = async () => {
    const code = generateIntegrationCode();
    
    if (!code) return;
    
    try {
      const success = await copyToClipboard(code);
      
      if (success) {
        setCopied(true);
        showNotification('Code copied to clipboard!', 'success', 3000);
        
        // Reset copied state after 2 seconds
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } else {
        showNotification('Failed to copy to clipboard', 'error', 5000);
      }
    } catch (error) {
      console.error('Copy error:', error);
      showNotification('Failed to copy to clipboard', 'error', 5000);
    }
  };
  
  // Integration code to display
  const integrationCode = generateIntegrationCode();
  
  return (
    <Section>
      <Card>
        <Title>Integration Code</Title>
        <Description>Add this code to your website to integrate the chatbot:</Description>
        
        {integrationCode ? (
          <CodeSnippet>
            <Pre>
              <code>{integrationCode}</code>
            </Pre>
            <CopyButton 
              onClick={handleCopyCode} 
              copied={copied}
              aria-label="Copy code"
            >
              {copied ? <FaCheck /> : <FaCopy />}
            </CopyButton>
          </CodeSnippet>
        ) : (
          <Placeholder>
            Generate a chatbot first to get the integration code
          </Placeholder>
        )}
      </Card>
    </Section>
  );
};

export default IntegrationSection; 