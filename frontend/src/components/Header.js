import React from 'react';
import styled from 'styled-components';
import logo from '../assets/images/logo.png';

const HeaderContainer = styled.header`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  text-align: center;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  
  img {
    height: 50px;
    margin-right: 15px;
  }

  h1 {
    font-size: 2.2rem;
    color: var(--primary-color);
    margin: 0;
  }
`;

const Tagline = styled.p`
  font-size: 1.1rem;
  color: var(--text-light);
  margin: 0;
`;

const Header = () => {
  // Handle logo loading error
  const handleLogoError = (e) => {
    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%239C1C23" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>';
  };

  return (
    <HeaderContainer>
      <Logo>
        <img src={logo} alt="BotGen Logo" onError={handleLogoError} />
        <h1>BotGen</h1>
      </Logo>
      <Tagline>Generate custom chatbots from any website in seconds</Tagline>
    </HeaderContainer>
  );
};

export default Header; 