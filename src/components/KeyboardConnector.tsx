import React, { useEffect, useState } from 'react';
import { useVial } from '../contexts/VialContext';
import './KeyboardConnector.css';

const KeyboardConnector: React.FC = () => {
  const { keyboard, isConnected, connect, disconnect, loadKeyboard } = useVial();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => {
        if (!isConnected) {
            return;
        }
        setLoading(true);
        (async () => {
            await loadKeyboard();
            setLoading(false);
        })();
        return () => {
            if (loading) {
                setLoading(false);
            }
        }
    }, [isConnected]
  );

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const success = await connect();
      if (!success) {
        setError('Failed to connect to keyboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError(null);
    try {
      await disconnect();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="keyboard-connector">
      <div className="connection-status">
        <h2>Connection Status</h2>
        <p className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </p>
      </div>

      <div className="connection-actions">
        {!isConnected ? (
          <button onClick={handleConnect} disabled={loading}>
            {loading ? 'Connecting...' : 'Connect Keyboard'}
          </button>
        ) : (
          <button onClick={handleDisconnect} disabled={loading}>
            {loading ? 'Disconnecting...' : 'Disconnect'}
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
        </div>
      )}

      {keyboard && (
        <div className="keyboard-info">
          <h3>Keyboard Information</h3>
          <dl>
            <dt>Keyboard ID:</dt>
            <dd>{keyboard.kbid}</dd>
            <dt>VIA Protocol:</dt>
            <dd>{keyboard.via_proto}</dd>
            <dt>Vial Protocol:</dt>
            <dd>{keyboard.vial_proto}</dd>
            <dt>Matrix Size:</dt>
            <dd>
              {keyboard.rows} rows × {keyboard.cols} cols
            </dd>
            {keyboard.layers && (
              <>
                <dt>Layers:</dt>
                <dd>{keyboard.layers}</dd>
              </>
            )}
          </dl>
        </div>
      )}
    </div>
  );
};

export default KeyboardConnector;
