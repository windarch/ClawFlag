/**
 * 连接守卫组件
 * 如果未连接到 Gateway，重定向到连接页面
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useGatewayContext } from '../contexts/GatewayContext';

interface RequireConnectionProps {
  children: React.ReactNode;
}

export function RequireConnection({ children }: RequireConnectionProps) {
  const { isConnected, status } = useGatewayContext();
  const location = useLocation();

  // 如果正在连接中，显示加载状态
  if (status === 'connecting') {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>正在连接 Gateway...</p>
      </div>
    );
  }

  // 如果未连接，重定向到连接页面
  if (!isConnected) {
    return <Navigate to="/connect" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default RequireConnection;
