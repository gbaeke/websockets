import React, { useMemo } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaInfoCircle, FaCheckCircle, FaExclamationCircle, FaTimesCircle } from 'react-icons/fa';

const Dashboard = ({ updates }) => {
  // Calculate statistics
  const stats = useMemo(() => {
    const total = updates.length;
    const infoCount = updates.filter(update => update.type === 'info').length;
    const successCount = updates.filter(update => update.type === 'success').length;
    const warningCount = updates.filter(update => update.type === 'warning').length;
    const errorCount = updates.filter(update => update.type === 'error').length;
    
    return {
      total,
      info: { count: infoCount, percentage: total ? Math.round((infoCount / total) * 100) : 0 },
      success: { count: successCount, percentage: total ? Math.round((successCount / total) * 100) : 0 },
      warning: { count: warningCount, percentage: total ? Math.round((warningCount / total) * 100) : 0 },
      error: { count: errorCount, percentage: total ? Math.round((errorCount / total) * 100) : 0 }
    };
  }, [updates]);

  // Get the most recent update
  const latestUpdate = updates[0] || null;

  return (
    <DashboardContainer>
      <DashboardHeader>
        <h2>Dashboard Overview</h2>
        <p>Real-time updates and statistics</p>
      </DashboardHeader>

      {latestUpdate && (
        <LatestUpdateCard
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          $type={latestUpdate.type || 'info'}
        >
          <LatestUpdateHeader>
            <h3>Latest Update</h3>
            <LatestUpdateTime>
              {new Date(latestUpdate.timestamp).toLocaleTimeString()}
            </LatestUpdateTime>
          </LatestUpdateHeader>
          <LatestUpdateTitle>{latestUpdate.title}</LatestUpdateTitle>
          <LatestUpdateMessage>{latestUpdate.message}</LatestUpdateMessage>
        </LatestUpdateCard>
      )}

      <StatsGrid>
        <StatCard $type="info">
          <StatIcon $type="info">
            <FaInfoCircle />
          </StatIcon>
          <StatContent>
            <StatCount>{stats.info.count}</StatCount>
            <StatLabel>Info Updates</StatLabel>
          </StatContent>
          <StatPercentage>{stats.info.percentage}%</StatPercentage>
        </StatCard>

        <StatCard $type="success">
          <StatIcon $type="success">
            <FaCheckCircle />
          </StatIcon>
          <StatContent>
            <StatCount>{stats.success.count}</StatCount>
            <StatLabel>Success Updates</StatLabel>
          </StatContent>
          <StatPercentage>{stats.success.percentage}%</StatPercentage>
        </StatCard>

        <StatCard $type="warning">
          <StatIcon $type="warning">
            <FaExclamationCircle />
          </StatIcon>
          <StatContent>
            <StatCount>{stats.warning.count}</StatCount>
            <StatLabel>Warning Updates</StatLabel>
          </StatContent>
          <StatPercentage>{stats.warning.percentage}%</StatPercentage>
        </StatCard>

        <StatCard $type="error">
          <StatIcon $type="error">
            <FaTimesCircle />
          </StatIcon>
          <StatContent>
            <StatCount>{stats.error.count}</StatCount>
            <StatLabel>Error Updates</StatLabel>
          </StatContent>
          <StatPercentage>{stats.error.percentage}%</StatPercentage>
        </StatCard>
      </StatsGrid>

      <ProgressBarsContainer>
        <h3>Update Distribution</h3>
        <ProgressBar $type="info" $percentage={stats.info.percentage} />
        <ProgressBar $type="success" $percentage={stats.success.percentage} />
        <ProgressBar $type="warning" $percentage={stats.warning.percentage} />
        <ProgressBar $type="error" $percentage={stats.error.percentage} />
      </ProgressBarsContainer>
    </DashboardContainer>
  );
};

const DashboardContainer = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const DashboardHeader = styled.div`
  margin-bottom: 1rem;
  
  h2 {
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }
  
  p {
    color: var(--text-secondary);
  }
`;

const LatestUpdateCard = styled.div`
  background-color: white;
  border-radius: var(--border-radius);
  padding: 1.5rem;
  box-shadow: var(--box-shadow);
  border-left: 4px solid ${({ $type }) => {
    switch ($type) {
      case 'success': return 'var(--success-color)';
      case 'warning': return 'var(--warning-color)';
      case 'error': return 'var(--error-color)';
      default: return 'var(--info-color)';
    }
  }};
  margin-bottom: 1rem;
`;

const LatestUpdateHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  
  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-secondary);
  }
`;

const LatestUpdateTime = styled.span`
  font-size: 0.875rem;
  color: var(--text-secondary);
`;

const LatestUpdateTitle = styled.h4`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const LatestUpdateMessage = styled.p`
  color: var(--text-primary);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatCard = styled.div`
  background-color: white;
  border-radius: var(--border-radius);
  padding: 1.5rem;
  box-shadow: var(--box-shadow);
  display: flex;
  align-items: center;
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

const StatIcon = styled.div`
  font-size: 1.5rem;
  margin-right: 1rem;
  color: ${({ $type }) => {
    switch ($type) {
      case 'success': return 'var(--success-color)';
      case 'warning': return 'var(--warning-color)';
      case 'error': return 'var(--error-color)';
      default: return 'var(--info-color)';
    }
  }};
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatCount = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: var(--text-secondary);
`;

const StatPercentage = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  background-color: var(--light-gray);
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
`;

const ProgressBarsContainer = styled.div`
  background-color: white;
  border-radius: var(--border-radius);
  padding: 1.5rem;
  box-shadow: var(--box-shadow);
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }
`;

const ProgressBar = styled.div`
  height: 8px;
  background-color: var(--medium-gray);
  border-radius: 4px;
  margin-bottom: 1rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${({ $percentage }) => `${$percentage}%`};
    background-color: ${({ $type }) => {
      switch ($type) {
        case 'success': return 'var(--success-color)';
        case 'warning': return 'var(--warning-color)';
        case 'error': return 'var(--error-color)';
        default: return 'var(--info-color)';
      }
    }};
    border-radius: 4px;
    transition: width 0.5s ease;
  }
  
  &::after {
    content: '${({ $type, $percentage }) => `${$type}: ${$percentage}%`}';
    position: absolute;
    top: -20px;
    right: 0;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
`;

export default Dashboard; 