import React, { useState, useEffect } from 'react';
import GrecikoDashboard from './components/GrecikoDashboard';
import useGrecikoGame from './hooks/useWebSocket'; 

// --- Dati Condivisi ---
const ROCCAFORTI = [
    "Leuca", "Lecce", "Nardò", "Otranto", "Gallipoli", "Soleto", "Melendugno"
];

// --- Componenti per le schermate ---

const Lobby = ({ onCreate, onJoin, availableRoccaforti }) => {
    // Stato per la creazione di una stanza
    const [createUsername, setCreateUsername] = useState('');
    const [createRoccaforte, setCreateRoccaforte] = useState(ROCCAFORTI[0]);

    // Stato per l'unione a una stanza
    const [joinRoomId, setJoinRoomId] = useState('');
    const [joinUsername, setJoinUsername] = useState('');
    const [joinRoccaforte, setJoinRoccaforte] = useState(availableRoccaforti[0] || '');

    // Aggiorna la roccaforte selezionata per l'unione se la lista cambia
    useEffect(() => {
        if (!availableRoccaforti.includes(joinRoccaforte)) {
            setJoinRoccaforte(availableRoccaforti[0] || '');
        }
    }, [availableRoccaforti, joinRoccaforte]);

    const handleCreate = () => {
        if (createUsername && createRoccaforte) {
            onCreate(createUsername, createRoccaforte);
        } else {
            alert("Per favore, inserisci un nome e scegli una roccaforte per creare la partita.");
        }
    };

    const handleJoin = () => {
        if (joinUsername && joinRoccaforte && joinRoomId) {
            onJoin(joinRoomId, joinUsername, joinRoccaforte);
        } else {
            alert("Per favore, inserisci nome, ID stanza e scegli una roccaforte per unirti.");
        }
    };

    return (
        <div className="container py-5">
            <h1 className="text-center mb-4">Benvenuto a Greciko!</h1>
            <div className="row justify-content-center">
                {/* Colonna per Creare Partita */}
                <div className="col-md-5 p-4 border rounded me-md-4">
                    <h3 className="mb-3">Crea Nuova Partita</h3>
                    <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="Il tuo nome"
                        value={createUsername}
                        onChange={(e) => setCreateUsername(e.target.value)}
                    />
                    <select
                        className="form-select mb-3"
                        value={createRoccaforte}
                        onChange={(e) => setCreateRoccaforte(e.target.value)}
                    >
                        {ROCCAFORTI.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button onClick={handleCreate} className="btn btn-primary w-100">Crea e Gioca</button>
                </div>

                {/* Colonna per Unirsi a Partita */}
                <div className="col-md-5 p-4 border rounded mt-4 mt-md-0">
                    <h3 className="mb-3">Unisciti a una Partita</h3>
                     <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="Il tuo nome"
                        value={joinUsername}
                        onChange={(e) => setJoinUsername(e.target.value)}
                    />
                    <select
                        className="form-select mb-2"
                        value={joinRoccaforte}
                        onChange={(e) => setJoinRoccaforte(e.target.value)}
                        disabled={availableRoccaforti.length === 0}
                    >
                        {availableRoccaforti.length > 0 ? (
                            availableRoccaforti.map(r => <option key={r} value={r}>{r}</option>)
                        ) : (
                            <option>Nessuna roccaforte disponibile</option>
                        )}
                    </select>
                    <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="Inserisci ID stanza"
                        value={joinRoomId}
                        onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                    />
                    <button onClick={handleJoin} className="btn btn-secondary w-100">Unisciti</button>
                </div>
            </div>
        </div>
    );
};

const WaitingRoom = ({ roomId, players, isHost, onStart }) => (
    <div className="container text-center py-5">
        <h2 className="mb-3">Sala d'Attesa</h2>
        <p className="lead">Sei nella stanza: <strong className="text-monospace p-2 rounded bg-light">{roomId}</strong></p>
        <p>Condividi questo codice con i tuoi amici per farli unire.</p>
        <hr />
        <h3>Giocatori Connessi: {players.filter(p => p.isConnected).length} / {players.length}</h3>
        <ul className="list-group col-6 mx-auto my-4">
            {players.map(player => (
                <li key={player.id} className={`list-group-item d-flex justify-content-between align-items-center ${!player.isConnected ? 'text-muted fst-italic' : ''}`}>
                    <span>
                        {player.username} {player.isHost && '(Host)'}
                        {!player.isConnected && ' (Disconnesso)'}
                    </span>
                    <span className="badge bg-info rounded-pill">{player.roccaforte}</span>
                </li>
            ))}
        </ul>
        {isHost && (
            <button
                onClick={onStart}
                className="btn btn-success btn-lg mt-4"
                disabled={players.length < 1} // O puoi mettere una logica più stringente, es. players.filter(p => p.isConnected).length < 2
            >
                Avvia Partita
            </button>
        )}
    </div>
);



// --- Componente App Principale ---

function App() {
    // La logica per l'host dinamico è ottima, la manteniamo
    const host = window.location.hostname === 'localhost' ? 'localhost' : '79.60.113.115';
    const { appState,
            createRoom,
            joinRoom,
            startGame,
            sendGameAction } = useGrecikoGame(`ws://${host}:8080`);

    const availableRoccaforti = ROCCAFORTI.filter(r =>
        !appState.players?.some(p => p.roccaforte === r)
    );

    // Gestione degli stati di connessione
    if (appState.connectionStatus !== 'OPEN') {
        if (appState.connectionStatus === 'CLOSED' && appState.roomId) {
            return <div className="text-center p-5">Connessione persa. Ricarica la pagina per tentare di riconnetterti...</div>;
        }
        return <div className="text-center p-5">Connessione al server in corso...</div>;
    }

    // Viste principali dell'applicazione
    switch (appState.view) {
        case 'lobby':
            return <Lobby
                onCreate={createRoom}
                onJoin={joinRoom}
                availableRoccaforti={availableRoccaforti}
            />;
        
        case 'waitingRoom':
            return <WaitingRoom
                roomId={appState.roomId}
                players={appState.players || []}
                isHost={appState.isHost}
                onStart={startGame}
            />;

        case 'game':
            if (appState.gameState && appState.gameState.allPlayers) {
                // Questa logica è corretta e robusta per trovare il giocatore
                const me = appState.gameState.allPlayers.find(p => p.id === appState.playerId);
                
                if (me) {
                    return (
                        <GrecikoDashboard
                            player={me}
                            gameState={appState.gameState}
                            onGameAction={sendGameAction}
                        />
                    );
                }
            }
            // Se gameState o il giocatore non sono ancora pronti, mostra un caricamento
            return <div className="text-center p-5">Sincronizzazione della partita in corso...</div>;
            
        default:
            return <div>Caricamento...</div>;
    }
}

export default App;