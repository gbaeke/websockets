import React from 'react';
import styled from 'styled-components';
import { FaSignal, FaExclamationTriangle, FaPlug } from 'react-icons/fa';

const Header = ({ isConnected, transportType }) => {
  return (
    <HeaderContainer>
      <Logo>
        <LogoIcon>📊</LogoIcon>
        <LogoText>Real-time Dashboard</LogoText>
      </Logo>
      <ConnectionInfo>
        {transportType && (
          <TransportType>
            <FaPlug /> {transportType}
          </TransportType>
        )}
        <ConnectionStatus $isConnected={isConnected}>
          {isConnected ? (
            <>
              <FaSignal /> Connected
            </>
          ) : (
            <>
              <FaExclamationTriangle /> Disconnected
            </>
          )}
        </ConnectionStatus>
      </ConnectionInfo>
    </HeaderContainer>
  );
};

const HeaderContainer = styled.header`
  background-color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LogoIcon = styled.span`
  font-size: 1.5rem;
`;

const LogoText = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary-color);
`;

const ConnectionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const TransportType = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  background-color: rgba(67, 97, 238, 0.1);
  color: var(--primary-color);
  font-weight: 500;
  font-size: 0.875rem;
`;

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  background-color: ${({ $isConnected }) =>
    $isConnected ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'};
  color: ${({ $isConnected }) =>
    $isConnected ? 'var(--success-color)' : 'var(--error-color)'};
  font-weight: 500;
`;

export default Header; 