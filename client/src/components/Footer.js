import React from 'react';
import styled from 'styled-components';

const Footer = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <p>Real-time Dashboard with WebSockets</p>
        <p>&copy; {new Date().getFullYear()} - All rights reserved</p>
      </FooterContent>
    </FooterContainer>
  );
};

const FooterContainer = styled.footer`
  background-color: white;
  padding: 1.5rem;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
  margin-top: 2rem;
`;

const FooterContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  
  p {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
`;

export default Footer; 