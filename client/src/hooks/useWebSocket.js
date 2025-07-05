import { useState, useEffect, useRef, useCallback } from 'react';

export default function useGrecikoGame(url) {
  // --- STATO DELL'APPLICAZIONE ---
  const [appState, setAppState] = useState({ 
    view: 'lobby',
    roomId: null,
    players: [],
    gameState: null,
    playerId: null,
    isHost: false,
    connectionStatus: 'CONNECTING'
  });

  // --- GESTIONE WEBSOCKET ---
  const ws = useRef(null);
  const connectionEstablished = useRef(false);

  useEffect(() => {
    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      console.log('✅ Connesso al server WebSocket');
      connectionEstablished.current = true;
      setAppState(s => ({ ...s, connectionStatus: 'OPEN' }));
    };

    socket.onclose = () => {
      console.log('❌ Disconnesso dal server WebSocket');
      if (connectionEstablished.current) {
        setAppState({
            view: 'lobby',
            roomId: null,
            players: [],
            gameState: null,
            playerId: null,
            isHost: false,
            connectionStatus: 'CLOSED'
        });
      }
      connectionEstablished.current = false;
    };

    socket.onerror = (error) => {
      console.error('Errore WebSocket:', error);
      setAppState(s => ({ ...s, connectionStatus: 'ERROR' }));
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, payload, gameState } = message;
        console.log('⬇️ Messaggio ricevuto:', message);

        switch (type) {
          case 'roomCreated':
          case 'joinedRoom':
            setAppState(s => ({ 
              ...s, 
              view: 'waitingRoom', 
              roomId: payload.roomId, 
              players: payload.players,
              playerId: payload.playerId,
              isHost: payload.players.find(p => p.id === payload.playerId)?.isHost || false
            }));
            break;
          case 'playerJoined':
          case 'playerLeft':
          case 'newHost':
            setAppState(s => ({ 
                ...s, 
                players: payload.players,
                isHost: payload.players.find(p => p.id === s.playerId)?.isHost || false
            }));
            break;
          case 'gameStarted':
          case 'gameStateUpdate':
            setAppState(s => ({
              ...s,
              view: 'game',
              gameState: gameState
            }));
            break;
          case 'error':
            alert(`Errore dal server: ${payload.message}`);
            if (payload.message.includes('Stanza non trovata')) {
              setAppState(s => ({...s, view: 'lobby'}));
            }
            break;
          default:
            break;
        }
      } catch (e) {
        console.error("Errore nel parsing del messaggio JSON:", e);
      }
    };

    return () => {
      socket.close();
    };
  }, [url]);

  // --- FUNZIONI DI AZIONE ---
  const sendMessage = useCallback((type, payload) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const message = { type, payload };
      console.log('⬆️ Messaggio inviato:', message);
      ws.current.send(JSON.stringify(message));
    } else {
      console.error('La connessione WebSocket non è aperta.');
    }
  }, []);

  const createRoom = useCallback((username, roccaforte) => {
    sendMessage('createRoom', { username, roccaforte });
  }, [sendMessage]);

  const joinRoom = useCallback((roomId, username, roccaforte) => {
    if (!roomId || !username || !roccaforte) return alert("Per favore, compila tutti i campi.");
    sendMessage('joinRoom', { roomId, username, roccaforte });
  }, [sendMessage]);

  const startGame = useCallback(() => {
    sendMessage('startGame', { roomId: appState.roomId });
  }, [sendMessage, appState.roomId]);

  // --- CORREZIONE PRINCIPALE QUI ---
  // Ora accetta un singolo oggetto 'action' e lo inoltra correttamente.
  const sendGameAction = useCallback(action => {
    sendMessage('gameAction', { 
      roomId: appState.roomId,
      action: action // Invia l'intero oggetto {type, payload}
    });
  }, [sendMessage, appState.roomId]);

  return { appState, createRoom, joinRoom, startGame, sendGameAction };
}