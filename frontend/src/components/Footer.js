import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  text-align: center;
  margin-top: 50px;
  padding: 20px 0;
  color: var(--text-light);
  font-size: 0.9rem;
`;

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <FooterContainer>
      <p>&copy; {currentYear} BotGen. All rights reserved.</p>
    </FooterContainer>
  );
};

export default Footer; 