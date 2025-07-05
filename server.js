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
        players: playerNames, // Manteniamo la lista dei nomi per compatibilità
        allPlayers: room.gameState.players, // ++ AGGIUNGIAMO LA LISTA COMPLETA DEI GIOCATORI ++
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

    // --- PRIMO PASSO: Creiamo l'array dei giocatori ---
    // Questa parte crea ogni giocatore con le sue informazioni base.
    // Nota che 'resourcesLimit' viene lasciato come un oggetto vuoto per ora.
    const players = playersInfo.map(playerInfo => {
        const roccaforteKey = Object.keys(map.Roccaforti).find(k => k.toLowerCase() === playerInfo.roccaforte.toLowerCase());
        const territories = map.Roccaforti[roccaforteKey];
        
        return {
            id: playerInfo.id,
            name: playerInfo.username,
            roccaforte: playerInfo.roccaforte,
            territories: territories,
            resources: { cibo: 2000, legna: 2000, pietra: 2000, metallo: 2000, turnisi: 2000, pm: 7 },
            resourcesLimit: {}, // <--- Lasciato volutamente vuoto!
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

    // --- SECONDO PASSO: Calcoliamo i limiti per ogni giocatore ---
    // Ora che tutti i giocatori esistono, scorriamo la lista.
    // Per ognuno, calcoliamo il suo limite di risorse e lo inseriamo.
    players.forEach(player => {
        player.resourcesLimit = calculateResourceLimits(player); // <-- Qui popoliamo il campo vuoto
    });

    // --- TERZO PASSO: Restituiamo lo stato di gioco completo ---
    return {
        map: map,
        players: players, // Ora i giocatori hanno i limiti corretti
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

    // Applica bonus produzione da ricerche (Regole 5, 6, 7)
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

    // Applica bonus da Emporio Maggiore (Regola 2)
    if (player.equipment.emporioMaggior > 0) {
        resourcesProducted.turnisi += 100 * player.equipment.emporioMaggior; // Bonus per ogni emporio
    }

    // Calcola consumo cibo armate
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

    // Calcolo base
    limit.cibo = territoryCount * map.ResourcesForTerritory.cibo;
    limit.pietra = territoryCount * map.ResourcesForTerritory.pietra;
    limit.legna = territoryCount * map.ResourcesForTerritory.legna;
    limit.metallo = territoryCount * map.ResourcesForTerritory.metallo;

    // Applica bonus edifici (Regole 3 e 4)
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
                // FIX: Controlla che il payload esista prima di destrutturarlo.
                if (!payload) {
                    console.error('[Server] Messaggio "createRoom" ricevuto senza payload.');
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Dati del giocatore mancanti per la creazione della stanza.' } }));
                    return; // Interrompe l'esecuzione per questo messaggio
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

            // ... il resto del server.js rimane invariato ...
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
                            // --- BLOCCO ANTI-DOPPIO CLICK ---
                            // Controlla se è passato almeno mezzo secondo dall'ultimo acquisto.
                            const now = Date.now();
                            const lastPurchase = room.lastPurchaseTime.get(ws.id) || 0;

                            if (now - lastPurchase < 50) { // Ignora se la richiesta è troppo ravvicinata
                                console.log(`[SERVER] Acquisto duplicato da ${ws.id} ignorato.`);
                                break; // Interrompe l'esecuzione dell'acquisto
                            }
                            room.lastPurchaseTime.set(ws.id, now); // Registra l'ora di questo acquisto
                            // --- FINE BLOCCO ---

                            const itemKey = action.payload.itemId;
                            const purchasedItem = purchasable.Shop[itemKey];
                            const player = room.gameState.players.find(p => p.id === ws.id);

                            // Verifica che l'oggetto esista
                            if (!purchasedItem) {
                                console.error(`Tentativo di acquisto di un oggetto inesistente: ${itemKey}`);
                                break;
                            }
                            
                            // Verifica che il giocatore non abbia superato il limite per quell'oggetto
                            if (player.equipment[itemKey] >= purchasedItem.limit) {
                                console.log(`[SERVER] ${player.name} ha già raggiunto il limite per ${itemKey}.`);
                                break;
                            }

                            // Sottrae il costo delle risorse al giocatore
                            player.resources = gA.sumPlayerResources(purchasedItem.cost, ws.id, false);

                            // Aggiunge l'oggetto all'equipaggiamento del giocatore
                            if (purchasedItem.units) {
                                player.equipment[itemKey] += purchasedItem.units;
                            } else {
                                player.equipment[itemKey] += 1;
                            }

                            // Ricalcola i limiti delle risorse se l'edificio acquistato li influenza
                            if (itemKey === 'grandeGranaio' || itemKey === 'deposito') {
                                player.resourcesLimit = calculateResourceLimits(player);
                            }

                            // Notifica tutti i giocatori dell'aggiornamento dello stato di gioco
                            updateRoomGame('gameStateUpdate', roomId);
                            break;
                        }
                        case 'RESEARCH_POWERUP':
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
                        case 'END_TURN': {
                            const currentPlayer = room.gameState.players[room.gameState.turnIndex];
                            if (currentPlayer.id !== ws.id) {
                                break; 
                            }

                            const nextTurnIndex = (room.gameState.turnIndex + 1) % room.gameState.players.length;
                            const nextPlayer = room.gameState.players[nextTurnIndex];

                            room.gameState.turnIndex = nextTurnIndex;
                            room.gameState.currentTurn = nextPlayer.name;

                            if (nextTurnIndex === 0) {
                                room.gameState.turnNumber += 1;
                            }

                            // Assegna produzione
                            const productionForNextPlayer = getPlayerProductionById(room, nextPlayer.id);
                            gA.sumPlayerResources(productionForNextPlayer, nextPlayer.id, true);

                            // Assegna Punti Mossa bonus (Regola 8)
                            let basePm = 7;
                            const pmLevel = nextPlayer.powerUp.StrategiaMigliorata || 0;
                            if (pmLevel === 1) basePm = 9;
                            else if (pmLevel === 2) basePm = 11;
                            else if (pmLevel >= 3) basePm = 13;
                            nextPlayer.resources.pm = basePm;

                            // Assegna armate extra da Fabbrica Armi Pesanti (Regola 1)
                            if (nextPlayer.equipment.fabbricaArmiPesanti > 0) {
                                nextPlayer.equipment.armata += 5 * nextPlayer.equipment.fabbricaArmiPesanti;
                            }
                            
                            updateRoomGame('gameStateUpdate', roomId);
                            break;
                        }
                        case 'USE_ITEM':
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
                        case 'SUBMIT_TRADE_OFFER':
                            const tradeOffer = action.payload.tradeOffer;
                            const targetPlayerId = room.gameState.players.find(p => p.name === tradeOffer.targetPlayerName).id;
                            const targetPlayer = room.gameState.players.find(p => p.id === targetPlayerId);

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
                            updatePlayerOnly('gameStateUpdate', room, getClientById(targetPlayerId));
                            break;
                        case 'ANSWER_TRADE_OFFER':
                            
                            if(action.payload.answer){
                                const targetTradeIndex = action.payload.targetTradeIndex;
                                const senderTradeIndex = action.payload.senderTradeIndex;
                                const tradeOffer = player.tradeOffers[targetTradeIndex];

                                const senderUpdateIndex = tradeOffer.senderUpdateIndex;
                                const targetUpdateIndex = tradeOffer.targetUpdateIndex;
                                const targetPlayer = room.gameState.players.find(p => p.name === tradeOffer.targetPlayerName);
                                const senderPlayer = room.gameState.players.find(p => p.name === tradeOffer.senderPlayerName);
                                
                                gA.sumPlayerResources(tradeOffer.receiveItems, targetPlayer.id, false);
                                gA.sumPlayerResources(tradeOffer.giveItems, senderPlayer.id, false);

                                gA.sumPlayerResources(tradeOffer.giveItems, targetPlayer.id, true);
                                gA.sumPlayerResources(tradeOffer.receiveItems, senderPlayer.id, true);

                                if(targetPlayer.tradeOffers[targetTradeIndex])targetPlayer.tradeOffers.splice(targetTradeIndex, 1);
                                if(senderPlayer.tradeOffers[senderTradeIndex])senderPlayer.tradeOffers.splice(senderTradeIndex, 1);
                                if(targetPlayer.updates[targetUpdateIndex])targetPlayer.updates.splice(targetUpdateIndex, 1);
                                if(senderPlayer.updates[targetUpdateIndex])senderPlayer.updates.splice(senderTradeIndex, 1);
                                
                                updatePlayerOnly('gameStateUpdate', room, getClientById(targetPlayer.id));
                                updatePlayerOnly('gameStateUpdate', room, getClientById(senderPlayer.id));
                            }
                            else{
                                const targetTradeIndex = action.payload.targetTradeIndex;
                                const senderTradeIndex = action.payload.senderTradeIndex;
                                const tradeOffer = player.tradeOffers[targetTradeIndex];

                                const senderUpdateIndex = tradeOffer.senderUpdateIndex;
                                const targetUpdateIndex = tradeOffer.targetUpdateIndex;
                                const targetPlayer = room.gameState.players.find(p => p.name === tradeOffer.targetPlayerName);
                                const senderPlayer = room.gameState.players.find(p => p.name === tradeOffer.senderPlayerName);

                                if(targetPlayer.tradeOffers[targetTradeIndex])targetPlayer.tradeOffers.splice(targetTradeIndex, 1);
                                if(senderPlayer.tradeOffers[senderTradeIndex])senderPlayer.tradeOffers.splice(senderTradeIndex, 1);
                                if(targetPlayer.updates[targetUpdateIndex])targetPlayer.updates.splice(targetUpdateIndex, 1);
                                if(senderPlayer.updates[targetUpdateIndex])senderPlayer.updates.splice(targetUpdateIndex, 1);

                                sendUpdateToPlayer(targetPlayer, {
                                    "type": "gameStateUpdate",
                                    "image": tradeOffer.image,
                                    "title": `hai rifiutato la richiesta del giocatore ${senderPlayer.name}`,
                                });
                                sendUpdateToPlayer(senderPlayer, {
                                    "type": "gameStateUpdate",
                                    "image": tradeOffer.image,
                                    "title": `il giocatore ${targetPlayer.name} ha rifiutato la tua richiesta di scambio`,
                                })

                                updatePlayerOnly('gameStateUpdate', room, getClientById(targetPlayer.id));
                                updatePlayerOnly('gameStateUpdate', room, getClientById(senderPlayer.id));
                            }
                            break;
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
                                targetTerritoryId,
                                isVictory,
                                attackerLosses,
                                defenderLosses,
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
                            const defender = player; // Chi conferma è il difensore
                            const { battleId, attackerName, accepted } = action.payload;
                            
                            const updateIndex = defender.updates.findIndex(up => up.battleId === battleId);
                            if (updateIndex === -1) break;

                            const battleUpdate = defender.updates[updateIndex];
                            defender.updates.splice(updateIndex, 1);

                            const attacker = room.gameState.players.find(p => p.name === attackerName);
                            if (!attacker) break;

                            if (accepted) {
                                // Applica perdite armate
                                attacker.equipment.armata -= battleUpdate.attackerLosses;
                                defender.equipment.armata -= battleUpdate.defenderLosses;

                                let destructionMessage = '';
                                let conquestMessage = '';

                                // Distruggi edificio
                                if (battleUpdate.buildingToDestroy && defender.equipment[battleUpdate.buildingToDestroy] > 0) {
                                    defender.equipment[battleUpdate.buildingToDestroy] -= 1;
                                    const buildingName = purchasable.Shop[battleUpdate.buildingToDestroy]?.name || 'edificio';
                                    destructionMessage = ` Un ${buildingName} è stato distrutto!`;
                                }

                                // Trasferisci territorio in caso di vittoria
                                if (battleUpdate.isVictory) {
                                    defender.territories = defender.territories.filter(t => t !== battleUpdate.targetTerritoryId);
                                    attacker.territories.push(battleUpdate.targetTerritoryId);
                                    conquestMessage = ` ${attacker.name} ha conquistato il territorio ${battleUpdate.targetTerritoryId}!`;

                                    // Ricalcola i limiti per entrambi i giocatori! FONDAMENTALE.
                                    attacker.resourcesLimit = calculateResourceLimits(attacker);
                                    defender.resourcesLimit = calculateResourceLimits(defender);
                                }

                                const resultTitle = `Battaglia confermata!` + conquestMessage + destructionMessage;
                                sendUpdateToPlayer(attacker, { type: 'info', title: resultTitle });
                                sendUpdateToPlayer(defender, { type: 'info', title: resultTitle });

                            } else {
                                // Battaglia rifiutata
                                sendUpdateToPlayer(attacker, { type: 'info', title: `${defender.name} ha rifiutato l'esito della battaglia.` });
                                sendUpdateToPlayer(defender, { type: 'info', title: `Hai rifiutato l'esito della battaglia.` });
                            }
                            
                            updateRoomGame('gameStateUpdate', roomId);
                            break;
                        }
                        case 'CONQUER_TERRITORY': {
                            const { targetTerritoryIds } = action.payload; // Ora riceve un array di ID
                            const attacker = player;

                            if (Array.isArray(targetTerritoryIds)) { // Si assicura che sia un array
                                targetTerritoryIds.forEach(territoryId => {
                                    // Aggiunge ogni territorio all'attaccante
                                    attacker.territories.push(territoryId);
                                });

                                // Ricalcola i limiti di risorse dell'attaccante dopo aver aggiunto tutti i territori
                                attacker.resourcesLimit = calculateResourceLimits(attacker);

                                // Notifica tutti i giocatori del cambiamento
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

    ws.on('close', () => {
        const playerId = clientConnections.get(ws);
        console.log(`[Server] Client disconnesso con ID: ${ws.id}`);
        let roomIdToDelete = null;
        for (const [roomId, room] of gameRooms.entries()) {
            const playerInRoom = room.players.find(p => p.id === ws.id);
            if (playerInRoom) {
                room.clients.delete(ws);
                room.players = room.players.filter(p => p.id !== ws.id);
                
                if (room.clients.size === 0) {
                    roomIdToDelete = roomId;
                } else {
                    if (!room.gameState) {
                         broadcastToRoom(roomId, {
                            type: 'playerLeft',
                            payload: { players: room.players }
                        });
                    }
                    if (room.hostId === ws.id) {
                        const newHost = Array.from(room.clients)[0];
                        if (newHost) {
                            room.hostId = newHost.id;
                            const newHostPlayer = room.players.find(p => p.id === newHost.id);
                            if(newHostPlayer) newHostPlayer.isHost = true;
                            console.log(`[Server] Nuovo host eletto per la stanza ${roomId}: ${newHost.id}`);
                            broadcastToRoom(roomId, { type: 'newHost', payload: { hostId: newHost.id, players: room.players } });
                        }
                    }
                }
                break;
            }
        }
        if (roomIdToDelete) {
            gameRooms.delete(roomIdToDelete);
            console.log(`[Server] Stanza ${roomIdToDelete} eliminata.`);
        }
        clientConnections.delete(ws);
    });
});