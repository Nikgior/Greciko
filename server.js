import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import InGameActions from './InGameActions.js';
import { purchasableItems } from './client/src/data/shopData.js';
import { map } from './client/src/data/mapData.js';
// --- DATI E FUNZIONI DI GIOCO ---

const purchasable = purchasableItems;


// --- SERVER WEBSOCKET ---

const wss = new WebSocketServer({ port: 8080 });
const gameRooms = new Map();
const clientConnections = new Map();
const gA = new InGameActions(gameRooms);
console.log('--- Server "Greciko" Avviato (Porta: 8080) ---');

function getClientById(id) {
    for (const client of wss.clients) {
        if (client.id === id) {
            return client;
        }
    }
    return null;
}

function broadcastToRoom(roomId, message) {
    const room = gameRooms.get(roomId);
    if (!room) return;
    const payload = JSON.stringify(message);
    room.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

function updatePlayerOnly(type, room, client) {
    const playerState = getPlayerById(room, client.id);
    if (!playerState) return;

    const playerNames = room.gameState.players.map(player => player.name);

    // L'oggetto che verrà inviato al client
    const publicGameState = {
        map: room.gameState.map,
        player: playerState,
        players: playerNames, 
        allPlayers: room.gameState.players, 
        currentTurn: room.gameState.currentTurn,
        turnNumber: room.gameState.turnNumber,
    };

    client.send(JSON.stringify({ type, gameState: publicGameState }));
}

function updateRoomGame(type, roomId) {
    const room = gameRooms.get(roomId);
    if (!room || !room.gameState) {
        console.warn(`[Server] Tentativo di aggiornare una stanza (${roomId}) senza gameState.`);
        return;
    }
    room.clients.forEach(client => {
        updatePlayerOnly(type, room, client);
    });
}

function generateRoomId() {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function createInitialGameState(playersInfo) {
    if (!map || !map.Roccaforti) {
        console.error("ERRORE CRITICO: L'oggetto 'map' o 'map.Roccaforti' non è definito.");
        return null;
    }

    const players = playersInfo.map(playerInfo => {
        const roccaforteKey = Object.keys(map.Roccaforti).find(k => k.toLowerCase() === playerInfo.roccaforte.toLowerCase());
        const territories = map.Roccaforti[roccaforteKey];
        
        return {
            id: playerInfo.id,
            name: playerInfo.username,
            roccaforte: playerInfo.roccaforte,
            isConnected: true, // <-- MODIFICA 1: Aggiunto stato di connessione
            territories: territories,
            resources: { cibo: 50, legna: 15, pietra: 10, metallo: 5, turnisi: 60, pm: 7 },
            resourcesLimit: {},
            equipment:{
                armata: 15, muro: 0, cannone: 0, nave: 0, cartaBonus: 0,
                laboratorioTecnologia: 0,
                fabbricaArmiPesanti: 0,
                emporioMaggior: 0,
                fortificazioneMaestra: 0,
                grandeGranaio: 0,
                portoCommerciale: 0,
                deposito: 0,
                torrettaContraerea: 0,
                bombardamentoUltraleggero: 0,
                schermoFumo: 0,
                artiglieriaNavale: 0,
                reteTunnel: 0,
                rilevamentoRapido: 0,
                intercettazioneNavale: 0,
                rilevamentoSismico: 0
            },
            powerUp:{OttimizzazioneUliveti:0, OttimizzazioneCave:0, OttimizzazioneMiniere:0, StrategiaMigliorata:0},
            updates: [],
            tradeOffers: []
        };
    });

    players.forEach(player => {
        player.resourcesLimit = calculateResourceLimits(player);
    });

    return {
        map: map,
        players: players,
        currentTurn: players[0].name,
        turnIndex: 0,
        turnNumber: 1,
    };
}

function getPlayerById(room, playerId) {
    if (!room.gameState || !room.gameState.players) return null;
    return room.gameState.players.find(player => player.id === playerId);
}
function getPlayerProductionById(room, playerId) {
    const player = getPlayerById(room, playerId);
    let resourcesProducted = { "cibo": 0, "metallo": 0, "legna": 0, "pietra": 0, "turnisi": 0 };
    if (!player || !player.territories) {
        return resourcesProducted;
    }

    player.territories.forEach(ter => {
        if (map[ter]) {
            switch (map[ter].type) {
                case "uliveto":
                    resourcesProducted.legna += 5 + (player.powerUp.OttimizzazioneUliveti || 0);
                    break;
                case "cava":
                    resourcesProducted.pietra += 2 + (player.powerUp.OttimizzazioneCave || 0);
                    break;
                case "miniera":
                    resourcesProducted.metallo += 2 + (player.powerUp.OttimizzazioneMiniere || 0);
                    break;
            }
            if (map[ter].territory === "SF") resourcesProducted.cibo += 10;
        }
        resourcesProducted.turnisi += 5;
    });

    if (player.equipment.emporioMaggior > 0) {
        resourcesProducted.turnisi += 100 * player.equipment.emporioMaggior;
    }

    if (player.equipment && typeof player.equipment.armata !== 'undefined') {
        resourcesProducted.cibo -= player.equipment.armata;
    }
    return resourcesProducted;
}
function sendMessage(wsId, type, payload){
    const client = getClientById(wsId);
    if (client) {
        client.send(JSON.stringify({ type, payload }));
    }
}
function calculateResourceLimits(player){
    let limit = {cibo: 0, legna: 0, pietra: 0, metallo: 0};
    const territoryCount = player.territories.length;

    limit.cibo = territoryCount * map.ResourcesForTerritory.cibo;
    limit.pietra = territoryCount * map.ResourcesForTerritory.pietra;
    limit.legna = territoryCount * map.ResourcesForTerritory.legna;
    limit.metallo = territoryCount * map.ResourcesForTerritory.metallo;

    if (player.equipment.grandeGranaio > 0) {
        limit.cibo *= (2**player.equipment.grandeGranaio);
    }
    if (player.equipment.deposito > 0) {
        limit.pietra *= 2 * player.equipment.deposito;
        limit.legna *= 2 * player.equipment.deposito;
        limit.metallo *= 2 * player.equipment.deposito;
    }
    return limit;
}
function sendUpdateToPlayer(player, update) {
    player.updates.push(update);
}


wss.on('connection', ws => {
    ws.id = uuidv4();
    console.log(`[Server] Nuovo client connesso con ID: ${ws.id}`);

    ws.on('message', messageAsString => {
        const message = JSON.parse(messageAsString);
        const { type, payload } = message;

        switch (type) {
            case 'createRoom': {
                if (!payload) {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Dati del giocatore mancanti per la creazione della stanza.' } }));
                    return;
                }
                const { username, roccaforte } = payload;
                if (!username || !roccaforte) {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Nome utente o roccaforte mancanti.' } }));
                    return;
                }

                const roomId = generateRoomId();
                const hostPlayer = { id: ws.id, username, roccaforte, isHost: true };

                const newRoom = {
                    id: roomId,
                    hostId: ws.id,
                    clients: new Set([ws]),
                    players: [hostPlayer],
                    lastPurchaseTime: new Map(),
                    gameState: null
                };
                gameRooms.set(roomId, newRoom);
                clientConnections.set(ws, ws.id);

                console.log(`[Server] Stanza creata: ${roomId} da ${username} (${ws.id})`);
                
                ws.send(JSON.stringify({
                    type: 'roomCreated',
                    payload: {
                        roomId,
                        playerId: ws.id,
                        players: newRoom.players
                    }
                }));
                break;
            }

            case 'joinRoom': {
                const { roomId, username, roccaforte } = payload;
                const room = gameRooms.get(roomId);

                if (!room) {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Stanza non trovata.' } }));
                    return;
                }
                if (room.clients.size >= 6) {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'La stanza è piena.' } }));
                    return;
                }
                const isRoccaforteTaken = room.players.some(p => p.roccaforte.toLowerCase() === roccaforte.toLowerCase());
                if (isRoccaforteTaken) {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: `La roccaforte ${roccaforte} è già stata scelta.` } }));
                    return;
                }

                room.clients.add(ws);
                const newPlayer = { id: ws.id, username, roccaforte, isHost: false };
                room.players.push(newPlayer);
                clientConnections.set(ws, ws.id);

                console.log(`[Server] ${username} (${ws.id}) si è unito a ${roomId} come ${roccaforte}`);

                ws.send(JSON.stringify({
                    type: 'joinedRoom',
                    payload: {
                        roomId,
                        playerId: ws.id,
                        players: room.players
                    }
                }));

                broadcastToRoom(roomId, {
                    type: 'playerJoined',
                    payload: { players: room.players }
                });
                break;
            }

            // <-- MODIFICA 2: Aggiunto nuovo case per gestire la riconnessione -->
            case 'reconnect': {
                const { roomId, playerId } = payload;
                const room = gameRooms.get(roomId);
                if (room?.gameState) {
                    const player = getPlayerById(room, playerId);
                    if (player && !player.isConnected) {
                        // Associa il vecchio ID giocatore alla nuova connessione ws
                        ws.id = playerId;
                        player.isConnected = true;
                        room.clients.add(ws);
                        clientConnections.set(ws, playerId); // Aggiorna l'associazione
                        console.log(`[Server] Giocatore ${player.name} (${playerId}) si è riconnesso.`);
                        updateRoomGame('gameStateUpdate', roomId);
                    } else {
                        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Impossibile riconnettersi.' } }));
                    }
                } else {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Stanza non trovata per la riconnessione.' } }));
                }
                break;
            }
            
            case 'startGame': {
                const { roomId } = payload;
                const room = gameRooms.get(roomId);
                if (room && room.hostId === ws.id) {
                    console.log(`[Server] Partita avviata nella stanza ${roomId}`);
                    room.gameState = createInitialGameState(room.players);
                    if (room.gameState) {
                        updateRoomGame('gameStarted', roomId);
                    }
                }
                break;
            }
            
            case 'gameAction': {
                const { roomId, action } = payload;
                const room = gameRooms.get(roomId);
                if (room && room.clients.has(ws)) {
                    console.log(`[Stanza: ${roomId}] Azione ricevuta da ${ws.id}:`, action.type);
                    const player = room.gameState.players.find(p => p.id == ws.id);
                    switch(action.type){
                        
                        case 'PURCHASE_ITEM': {
                            const now = Date.now();
                            const lastPurchase = room.lastPurchaseTime.get(ws.id) || 0;

                            if (now - lastPurchase < 50) { 
                                console.log(`[SERVER] Acquisto duplicato da ${ws.id} ignorato.`);
                                break;
                            }
                            room.lastPurchaseTime.set(ws.id, now);

                            const itemKey = action.payload.itemId;
                            const purchasedItem = purchasable.Shop[itemKey];
                            const player = room.gameState.players.find(p => p.id === ws.id);

                            if (!purchasedItem) {
                                console.error(`Tentativo di acquisto di un oggetto inesistente: ${itemKey}`);
                                break;
                            }
                            
                            if (player.equipment[itemKey] >= purchasedItem.limit) {
                                console.log(`[SERVER] ${player.name} ha già raggiunto il limite per ${itemKey}.`);
                                break;
                            }

                            player.resources = gA.sumPlayerResources(purchasedItem.cost, ws.id, false);

                            if (purchasedItem.units) {
                                player.equipment[itemKey] += purchasedItem.units;
                            } else {
                                player.equipment[itemKey] += 1;
                            }

                            if (itemKey === 'grandeGranaio' || itemKey === 'deposito') {
                                player.resourcesLimit = calculateResourceLimits(player);
                            }
                            updateRoomGame('gameStateUpdate', roomId);
                            break;
                        }
                        case 'RESEARCH_POWERUP': {
                            const PowerUpKey = action.payload.powerUpId;
                            const purchasedPowerUp = purchasable.Research[PowerUpKey];
                            if(!purchasedPowerUp){
                                console.error(`Tentativo di acquisto di un oggetto inesistente: ${PowerUpKey}`);
                                break;
                            }
                            room.gameState.players.find(p => p.id === ws.id).resources = gA.sumPlayerResources(purchasable.Research[PowerUpKey].cost,ws.id, false);
                            room.gameState.players.find(p => p.id === ws.id).powerUp[PowerUpKey] += 1;
                            updateRoomGame('gameStateUpdate',roomId); 
                            break;
                        }
                        // <-- MODIFICA 3: Logica di END_TURN che salta i giocatori disconnessi -->
                        case 'END_TURN': {
                            const currentPlayer = room.gameState.players[room.gameState.turnIndex];
                            if (currentPlayer.id !== ws.id) {
                                break; 
                            }

                            let nextTurnIndex = room.gameState.turnIndex;
                            let nextPlayer = null;
                            const totalPlayers = room.gameState.players.length;

                            // Cerca il prossimo giocatore CONNESSO
                            for (let i = 1; i <= totalPlayers; i++) {
                                const testIndex = (room.gameState.turnIndex + i) % totalPlayers;
                                if (room.gameState.players[testIndex].isConnected) {
                                    nextPlayer = room.gameState.players[testIndex];
                                    nextTurnIndex = testIndex;
                                    break;
                                }
                            }

                            if (!nextPlayer) {
                                console.log(`[Stanza: ${roomId}] Nessun altro giocatore connesso. Il turno non avanza.`);
                                break;
                            }

                            if (nextTurnIndex <= room.gameState.turnIndex) {
                                room.gameState.turnNumber += 1;
                            }
                            room.gameState.turnIndex = nextTurnIndex;
                            room.gameState.currentTurn = nextPlayer.name;

                            const productionForNextPlayer = getPlayerProductionById(room, nextPlayer.id);
                            gA.sumPlayerResources(productionForNextPlayer, nextPlayer.id, true);

                            let basePm = 7;
                            const pmLevel = nextPlayer.powerUp.StrategiaMigliorata || 0;
                            if (pmLevel === 1) basePm = 9;
                            else if (pmLevel === 2) basePm = 11;
                            else if (pmLevel >= 3) basePm = 13;
                            nextPlayer.resources.pm = basePm;

                            if (nextPlayer.equipment.fabbricaArmiPesanti > 0) {
                                nextPlayer.equipment.armata += 5 * nextPlayer.equipment.fabbricaArmiPesanti;
                            }
                            
                            updateRoomGame('gameStateUpdate', roomId);
                            break;
                        }
                        case 'USE_ITEM': {
                            const itemId = action.payload.itemId;
                            if(player.equipment[itemId]>0) player.equipment[itemId] -= 1;
                            room.gameState.players.forEach(p =>{
                                sendUpdateToPlayer(p,{
                                    "type": "itemUsed",
                                    "image": purchasable.Shop[itemId].image,
                                    "title": `il giocatore ${room.gameState.currentTurn} ha usato un ${purchasable.Shop[itemId].name}`
                                });
                            });
                            updateRoomGame('gameStateUpdate',roomId); 
                            break;
                        }
                        case 'SUBMIT_TRADE_OFFER': {
                            const tradeOffer = action.payload.tradeOffer;
                            const targetPlayer = room.gameState.players.find(p => p.name === tradeOffer.targetPlayerName);
                            if (!targetPlayer) break;

                            if(player.resources.cibo < tradeOffer.cibo 
                                || player.resources.legna < tradeOffer.legna 
                                || player.resources.pietra < tradeOffer.pietra 
                                || player.resources.metallo < tradeOffer.metallo) break;
                            
                            tradeOffer.senderUpdateIndex = player.updates.length;
                            tradeOffer.targetUpdateIndex = targetPlayer.updates.length;   
                            player.tradeOffers.push(tradeOffer);
                            targetPlayer.tradeOffers.push(tradeOffer);
                            sendUpdateToPlayer(targetPlayer, {
                                "type": "tradeOffer",
                                "updateId": targetPlayer.tradeOffers.length - 1,
                                "image": tradeOffer.image,
                                "title": `il giocatore ${player.name} ti ha offerto uno scambio`,
                                "targetTradeId": targetPlayer.tradeOffers.length - 1,
                                "senderTradeId": player.tradeOffers.length - 1,
                                "receiveItems": tradeOffer.giveItems,
                                "giveItems": tradeOffer.receiveItems
                            });
                            sendUpdateToPlayer(player, {
                                "type": "gameStateUpdate",
                                "image": tradeOffer.image,
                                "title": `hai inviato una richiesta di scambio al giocatore ${targetPlayer.name}`,
                            });
                            updatePlayerOnly('gameStateUpdate', room, getClientById(targetPlayer.id));
                            break;
                        }
                        case 'ANSWER_TRADE_OFFER': {
                            if(action.payload.answer){
                                const targetTradeIndex = action.payload.targetTradeIndex;
                                const senderTradeIndex = action.payload.senderTradeIndex;
                                const tradeOffer = player.tradeOffers[targetTradeIndex];
                                if (!tradeOffer) break;

                                const targetPlayer = room.gameState.players.find(p => p.name === tradeOffer.targetPlayerName);
                                const senderPlayer = room.gameState.players.find(p => p.name === tradeOffer.senderPlayerName);
                                if (!targetPlayer || !senderPlayer) break;
                                
                                gA.sumPlayerResources(tradeOffer.receiveItems, targetPlayer.id, false);
                                gA.sumPlayerResources(tradeOffer.giveItems, senderPlayer.id, false);

                                gA.sumPlayerResources(tradeOffer.giveItems, targetPlayer.id, true);
                                gA.sumPlayerResources(tradeOffer.receiveItems, senderPlayer.id, true);

                                if(targetPlayer.tradeOffers[targetTradeIndex])targetPlayer.tradeOffers.splice(targetTradeIndex, 1);
                                if(senderPlayer.tradeOffers[senderTradeIndex])senderPlayer.tradeOffers.splice(senderTradeIndex, 1);
                                if(targetPlayer.updates[tradeOffer.targetUpdateIndex])targetPlayer.updates.splice(tradeOffer.targetUpdateIndex, 1);
                                if(senderPlayer.updates[tradeOffer.senderUpdateIndex])senderPlayer.updates.splice(tradeOffer.senderUpdateIndex, 1);
                                
                                updatePlayerOnly('gameStateUpdate', room, getClientById(targetPlayer.id));
                                updatePlayerOnly('gameStateUpdate', room, getClientById(senderPlayer.id));
                            }
                            else{
                                const targetTradeIndex = action.payload.targetTradeIndex;
                                const senderTradeIndex = action.payload.senderTradeIndex;
                                const tradeOffer = player.tradeOffers[targetTradeIndex];
                                if (!tradeOffer) break;

                                const targetPlayer = room.gameState.players.find(p => p.name === tradeOffer.targetPlayerName);
                                const senderPlayer = room.gameState.players.find(p => p.name === tradeOffer.senderPlayerName);
                                if (!targetPlayer || !senderPlayer) break;

                                if(targetPlayer.tradeOffers[targetTradeIndex])targetPlayer.tradeOffers.splice(targetTradeIndex, 1);
                                if(senderPlayer.tradeOffers[senderTradeIndex])senderPlayer.tradeOffers.splice(senderTradeIndex, 1);
                                if(targetPlayer.updates[tradeOffer.targetUpdateIndex])targetPlayer.updates.splice(tradeOffer.targetUpdateIndex, 1);
                                if(senderPlayer.updates[tradeOffer.senderUpdateIndex])senderPlayer.updates.splice(tradeOffer.senderUpdateIndex, 1);

                                sendUpdateToPlayer(targetPlayer, {
                                    "type": "gameStateUpdate", "image": tradeOffer.image, "title": `hai rifiutato la richiesta del giocatore ${senderPlayer.name}`,
                                });
                                sendUpdateToPlayer(senderPlayer, {
                                    "type": "gameStateUpdate", "image": tradeOffer.image, "title": `il giocatore ${targetPlayer.name} ha rifiutato la tua richiesta di scambio`,
                                })

                                updatePlayerOnly('gameStateUpdate', room, getClientById(targetPlayer.id));
                                updatePlayerOnly('gameStateUpdate', room, getClientById(senderPlayer.id));
                            }
                            break;
                        }
                        case 'PROPOSE_BATTLE': {
                            const { targetTerritoryId, isVictory, defenderName, attackerLosses, defenderLosses, buildingToDestroy } = action.payload;
                            const attacker = player;
                            const defender = room.gameState.players.find(p => p.name === defenderName);
                            if (!defender) break;

                            const battleId = uuidv4();

                            const updateForDefender = {
                                type: 'battleConfirmation',
                                battleId,
                                attackerName: attacker.name,
                                targetTerritoryId, isVictory,
                                attackerLosses, defenderLosses,
                                buildingToDestroy,
                                title: `${attacker.name} ha attaccato il tuo territorio ${targetTerritoryId}.`
                            };
                            
                            sendUpdateToPlayer(defender, updateForDefender);
                            updatePlayerOnly('gameStateUpdate', room, getClientById(defender.id));

                            sendUpdateToPlayer(attacker, {
                                type: 'info',
                                title: `Hai inviato il resoconto della battaglia a ${defender.name}. In attesa di conferma.`
                            });
                            updatePlayerOnly('gameStateUpdate', room, getClientById(attacker.id));
                            break;
                        }
                        case 'CONFIRM_BATTLE': {
                            const defender = player;
                            const { battleId, attackerName, accepted } = action.payload;
                            
                            const updateIndex = defender.updates.findIndex(up => up.battleId === battleId);
                            if (updateIndex === -1) break;

                            const battleUpdate = defender.updates[updateIndex];
                            defender.updates.splice(updateIndex, 1);

                            const attacker = room.gameState.players.find(p => p.name === attackerName);
                            if (!attacker) break;

                            if (accepted) {
                                attacker.equipment.armata -= battleUpdate.attackerLosses;
                                defender.equipment.armata -= battleUpdate.defenderLosses;

                                let destructionMessage = '';
                                let conquestMessage = '';

                                if (battleUpdate.buildingToDestroy && defender.equipment[battleUpdate.buildingToDestroy] > 0) {
                                    defender.equipment[battleUpdate.buildingToDestroy] -= 1;
                                    const buildingName = purchasable.Shop[battleUpdate.buildingToDestroy]?.name || 'edificio';
                                    destructionMessage = ` Un ${buildingName} è stato distrutto!`;
                                }

                                if (battleUpdate.isVictory) {
                                    defender.territories = defender.territories.filter(t => t !== battleUpdate.targetTerritoryId);
                                    attacker.territories.push(battleUpdate.targetTerritoryId);
                                    conquestMessage = ` ${attacker.name} ha conquistato il territorio ${battleUpdate.targetTerritoryId}!`;
                                    attacker.resourcesLimit = calculateResourceLimits(attacker);
                                    defender.resourcesLimit = calculateResourceLimits(defender);
                                }

                                const resultTitle = `Battaglia confermata!` + conquestMessage + destructionMessage;
                                sendUpdateToPlayer(attacker, { type: 'info', title: resultTitle });
                                sendUpdateToPlayer(defender, { type: 'info', title: resultTitle });

                            } else {
                                sendUpdateToPlayer(attacker, { type: 'info', title: `${defender.name} ha rifiutato l'esito della battaglia.` });
                                sendUpdateToPlayer(defender, { type: 'info', title: `Hai rifiutato l'esito della battaglia.` });
                            }
                            
                            updateRoomGame('gameStateUpdate', roomId);
                            break;
                        }
                        case 'CONQUER_TERRITORY': {
                            const { targetTerritoryIds } = action.payload;
                            const attacker = player;

                            if (Array.isArray(targetTerritoryIds)) {
                                targetTerritoryIds.forEach(territoryId => {
                                    attacker.territories.push(territoryId);
                                });

                                attacker.resourcesLimit = calculateResourceLimits(attacker);

                                room.gameState.players.forEach(p => {
                                    sendUpdateToPlayer(p, { type: 'info', title: `${attacker.name} ha conquistato i territori neutrali: ${targetTerritoryIds.join(', ')}!` });
                                });

                                updateRoomGame('gameStateUpdate', roomId);
                            }
                            break;
                        }
                    }
                }
                break;
            }
        }
    });

    // <-- MODIFICA 4: Logica di disconnessione che non elimina il giocatore -->
    ws.on('close', () => {
        console.log(`[Server] Client ${ws.id} si è disconnesso.`);
        
        // Cerca in tutte le stanze il giocatore corrispondente all'ID della connessione chiusa
        for (const [roomId, room] of gameRooms.entries()) {
            // Controlla solo se la partita è iniziata (esiste gameState)
            if (room.gameState) {
                const player = room.gameState.players.find(p => p.id === ws.id);

                if (player) {
                    // Trovato! Segna come disconnesso e aggiorna tutti.
                    player.isConnected = false;
                    room.clients.delete(ws);
                    console.log(`[Server] Giocatore '${player.name}' segnato come disconnesso nella stanza ${roomId}.`);
                    
                    // Invia un aggiornamento completo a tutti i client rimasti nella stanza
                    // così vedono lo stato "Disconnesso"
                    updateRoomGame('gameStateUpdate', roomId);
                    
                    // Usciamo dal loop perché abbiamo trovato e gestito il giocatore
                    return; 
                }
            }
        }
    });
});