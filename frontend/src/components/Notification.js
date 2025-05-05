import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { FaTimes, FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaExclamationCircle } from 'react-icons/fa';

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const NotificationWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
  margin-bottom: 10px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: ${({ isClosing }) => isClosing 
    ? css`${slideOut} 0.3s ease-in-out forwards`
    : css`${slideIn} 0.3s ease-in-out`};
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 12px 15px;
  
  ${({ type }) => {
    switch (type) {
      case 'success':
        return `border-left: 4px solid var(--success-color);`;
      case 'error':
        return `border-left: 4px solid var(--error-color);`;
      case 'warning':
        return `border-left: 4px solid var(--warning-color);`;
      default:
        return `border-left: 4px solid var(--info-color);`;
    }
  }}
`;

const IconContainer = styled.div`
  margin-right: 12px;
  display: flex;
  align-items: center;
  
  svg {
    font-size: 20px;
    
    ${({ type }) => {
      switch (type) {
        case 'success':
          return `color: var(--success-color);`;
        case 'error':
          return `color: var(--error-color);`;
        case 'warning':
          return `color: var(--warning-color);`;
        default:
          return `color: var(--info-color);`;
      }
    }}
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
  
  &:hover {
    color: var(--text-color);
  }
  
  svg {
    font-size: 14px;
  }
`;

const Message = styled.div`
  flex: 1;
  padding-right: 20px;
  font-size: 0.9rem;
  color: var(--text-color);
`;

const Notification = ({ id, message, type = 'info', onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  
  const handleClose = () => {
    setIsClosing(true);
    // Wait for animation to complete before actual removal
    setTimeout(() => {
      onClose(id);
    }, 300);
  };
  
  // Get appropriate icon based on notification type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle />;
      case 'error':
        return <FaExclamationCircle />;
      case 'warning':
        return <FaExclamationTriangle />;
      default:
        return <FaInfoCircle />;
    }
  };
  
  return (
    <NotificationWrapper type={type} isClosing={isClosing}>
      <IconContainer type={type}>
        {getIcon()}
      </IconContainer>
      <Message>{message}</Message>
      <CloseButton onClick={handleClose} aria-label="Close notification">
        <FaTimes />
      </CloseButton>
    </NotificationWrapper>
  );
};

export default Notification; 