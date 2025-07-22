// In useWebSocket.js

import { useState, useEffect, useRef, useCallback } from 'react';

export default function useGrecikoGame(url) {
  const [appState, setAppState] = useState({ 
    view: 'lobby',
    roomId: null,
    players: [],
    gameState: null,
    playerId: null,
    isHost: false,
    connectionStatus: 'CONNECTING'
  });

  const ws = useRef(null);

  const sendMessage = useCallback((type, payload) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const message = { type, payload };
      console.log('⬆️ Messaggio inviato:', message);
      ws.current.send(JSON.stringify(message));
    } else {
      console.error('La connessione WebSocket non è aperta.');
    }
  }, []);

  useEffect(() => {
    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      console.log('✅ Connesso al server WebSocket');
      setAppState(s => ({ ...s, connectionStatus: 'OPEN' }));

      // --- LOGICA DI RICONNESSIONE ---
      const savedRoomId = localStorage.getItem('grecikoRoomId');
      const savedPlayerId = localStorage.getItem('grecikoPlayerId');

      if (savedRoomId && savedPlayerId) {
        console.log(`Trovata sessione precedente. Tento la riconnessione... Room: ${savedRoomId}, Player: ${savedPlayerId}`);
        sendMessage('reconnect', { roomId: savedRoomId, playerId: savedPlayerId });
      }
    };

    socket.onclose = () => {
      console.log('❌ Disconnesso dal server WebSocket');
      setAppState(s => ({ ...s, connectionStatus: 'CLOSED' }));
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
            localStorage.setItem('grecikoRoomId', payload.roomId);
            localStorage.setItem('grecikoPlayerId', payload.playerId);
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
            // Se riceviamo uno stato di gioco, assicuriamoci di essere nella vista corretta
            setAppState(s => ({
              ...s,
              view: 'game',
              gameState: gameState,
              // Aggiorna anche l'ID della stanza e del giocatore in caso di riconnessione
              roomId: s.roomId || localStorage.getItem('grecikoRoomId'),
              playerId: s.playerId || localStorage.getItem('grecikoPlayerId'),
            }));
            break;
          case 'error':
            alert(`Errore dal server: ${payload.message}`);
            // Se l'errore indica che la riconnessione è fallita, pulisci la sessione e torna alla lobby
            if (payload.message.includes('Stanza non trovata') || payload.message.includes('Impossibile riconnettersi')) {
              localStorage.removeItem('grecikoRoomId');
              localStorage.removeItem('grecikoPlayerId');
              setAppState(s => ({...s, view: 'lobby', roomId: null, playerId: null, gameState: null}));
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
  }, [url, sendMessage]);

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

  const sendGameAction = useCallback(action => {
    sendMessage('gameAction', { 
      roomId: appState.roomId,
      action: action
    });
  }, [sendMessage, appState.roomId]);

  return { appState, createRoom, joinRoom, startGame, sendGameAction };
}