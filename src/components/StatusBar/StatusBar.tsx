import type { ConnectionStatus } from '../../services/websocketManager';
import { Button } from '../Button';
import styles from './StatusBar.module.css';

interface StatusBarProps {
  status: ConnectionStatus;
  wsUrl: string;
  onReconnect?: () => void;
}

export function StatusBar({ status, wsUrl, onReconnect }: StatusBarProps) {

  const getStatusInfo = () => {
    switch (status) {
      case 'connected':
        return { label: 'Connected', color: 'green' };
      case 'connecting':
        return { label: 'Connecting...', color: 'yellow' };
      case 'disconnected':
        return { label: 'Disconnected', color: 'red' };
      case 'error':
        return { label: 'Error', color: 'red' };
      default:
        return { label: 'Unknown', color: 'gray' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={`${styles.status} ${styles[statusInfo.color]}`}>
          <span className={styles.statusDot} />
          <span className={styles.statusLabel}>{statusInfo.label}</span>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.url}>
          <span className={styles.urlLabel}>WebSocket:</span>
          <span className={styles.urlValue}>{wsUrl}</span>
        </div>

        {status !== 'connected' && status !== 'connecting' && onReconnect && (
          <Button variant="primary" size="sm" onClick={onReconnect}>
            Reconnect
          </Button>
        )}
      </div>
    </div>
  );
}
