import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaInfoCircle, FaCheckCircle, FaExclamationCircle, FaTimesCircle } from 'react-icons/fa';

const UpdateList = ({ updates }) => {
  if (!updates.length) {
    return (
      <EmptyState>
        <h3>No Updates Yet</h3>
        <p>Updates will appear here in real-time as they are received.</p>
      </EmptyState>
    );
  }

  return (
    <UpdateListContainer>
      <UpdateListHeader>
        <h2>Recent Updates</h2>
        <UpdateCount>{updates.length} updates</UpdateCount>
      </UpdateListHeader>

      <UpdatesGrid>
        {updates.map((update) => (
          <UpdateCard
            key={update.id}
            as={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            $type={update.type || 'info'}
          >
            <UpdateIcon $type={update.type || 'info'}>
              {update.type === 'success' && <FaCheckCircle />}
              {update.type === 'warning' && <FaExclamationCircle />}
              {update.type === 'error' && <FaTimesCircle />}
              {(!update.type || update.type === 'info') && <FaInfoCircle />}
            </UpdateIcon>
            <UpdateContent>
              <UpdateTitle>{update.title}</UpdateTitle>
              <UpdateMessage>{update.message}</UpdateMessage>
              <UpdateTime>
                {new Date(update.timestamp).toLocaleString()}
              </UpdateTime>
            </UpdateContent>
          </UpdateCard>
        ))}
      </UpdatesGrid>
    </UpdateListContainer>
  );
};

const UpdateListContainer = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const UpdateListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
  }
`;

const UpdateCount = styled.span`
  background-color: var(--primary-color);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
`;

const UpdatesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
`;

const UpdateCard = styled.div`
  background-color: white;
  border-radius: var(--border-radius);
  padding: 1.25rem;
  box-shadow: var(--box-shadow);
  display: flex;
  gap: 1rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background-color: ${({ $type }) => {
      switch ($type) {
        case 'success': return 'var(--success-color)';
        case 'warning': return 'var(--warning-color)';
        case 'error': return 'var(--error-color)';
        default: return 'var(--info-color)';
      }
    }};
  }
`;

const UpdateIcon = styled.div`
  font-size: 1.25rem;
  color: ${({ $type }) => {
    switch ($type) {
      case 'success': return 'var(--success-color)';
      case 'warning': return 'var(--warning-color)';
      case 'error': return 'var(--error-color)';
      default: return 'var(--info-color)';
    }
  }};
`;

const UpdateContent = styled.div`
  flex: 1;
`;

const UpdateTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
`;

const UpdateMessage = styled.p`
  color: var(--text-primary);
  margin-bottom: 0.75rem;
`;

const UpdateTime = styled.div`
  font-size: 0.75rem;
  color: var(--text-secondary);
`;

const EmptyState = styled.div`
  background-color: white;
  border-radius: var(--border-radius);
  padding: 2rem;
  box-shadow: var(--box-shadow);
  text-align: center;
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
  }
  
  p {
    color: var(--text-secondary);
  }
`;

export default UpdateList; 