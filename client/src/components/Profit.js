import React from 'react';
import { Card, ListGroup, Badge } from 'react-bootstrap';
// Importa la mappa, necessaria per calculateProduction
import { map } from '../data/mapData.js'; 

// La logica di calcolo non è cambiata
function calculateProduction(playerData) {
    let resourcesProducted = { "cibo": 0, "metallo": 0, "legna": 0, "pietra": 0, "turnisi": 0 };
    if (!playerData || !playerData.territories) {
        return resourcesProducted;
    }
    
    // Bonus da ricerche
    playerData.territories.forEach(ter => {
        if (map[ter]) {
            switch (map[ter].type) {
                case "uliveto":
                    resourcesProducted.legna += 5 + (playerData.powerUp?.OttimizzazioneUliveti || 0);
                    break;
                case "cava":
                    resourcesProducted.pietra += 2 + (playerData.powerUp?.OttimizzazioneCave || 0);
                    break;
                case "giacimento":
                    resourcesProducted.metallo += 1 + (playerData.powerUp?.OttimizzazioneMiniere || 0);
                    break;
            }
            if (map[ter].territory === "SF") resourcesProducted.cibo += 10;
        }
        resourcesProducted.turnisi += 5;
    });

    // Bonus da Emporio Maggiore
    if (playerData.equipment?.emporioMaggior > 0) {
        resourcesProducted.turnisi += 100 * playerData.equipment.emporioMaggior;
    }

    // Consumo cibo
    if (playerData.equipment && typeof playerData.equipment.armata !== 'undefined') {
        resourcesProducted.cibo -= playerData.equipment.armata;
    }
    return resourcesProducted;
}

const getProduction = (playerData) => {
    return calculateProduction(playerData);
};


// --- NUOVO ResourceSlot, più compatto e orizzontale ---
const ResourceSlot = ({ icon, name, currentValue, balanceValue }) => (
    <div className="d-flex justify-content-between align-items-center w-100">
        {/* Parte sinistra: Icona e Nome */}
        <div className="d-flex align-items-center">
            <span className="fs-5 me-3">{icon}</span>
            <span className="fw-bold text-capitalize">{name}</span>
        </div>
        
        {/* Parte destra: Valore corrente e Bilancio */}
        <div className="d-flex align-items-center">
            <span className="fs-5 fw-light text-muted me-4">{currentValue}</span>
            <Badge 
                pill 
                bg={balanceValue > 0 ? 'success' : 'danger'}
                // Usa opacity-0 per nascondere il badge senza alterare il layout
                className={`fw-normal fs-6 ${balanceValue === 0 ? 'opacity-0' : ''}`}
                style={{ minWidth: '55px', textAlign: 'center' }} // Stile per mantenere l'allineamento
            >
                {balanceValue > 0 ? `+${balanceValue}` : balanceValue}
            </Badge>
        </div>
    </div>
);


// --- NUOVO componente Profit, con layout a lista ---
const Profit = ({ player }) => {
    if (!player) {
        return <div className="text-center p-5 text-white">Caricamento profitto...</div>;
    }

    const balance = getProduction(player);

    // Array per generare dinamicamente le righe delle risorse, rende il codice più pulito
    const resourcesToShow = [
        { name: 'cibo', icon: '🍞' },
        { name: 'legna', icon: '🪵' },
        { name: 'pietra', icon: '🪨' },
        { name: 'metallo', icon: '⚙️' },
        { name: 'turnisi', icon: '💰' },
    ];

    return (
        <Card className="mb-4 shadow-sm bg-dark text-light">
            <Card.Header as="h5" className="fw-bold border-secondary">Possedimenti</Card.Header>
            {/* Usa ListGroup per un layout a lista pulito e compatto */}
            <ListGroup variant="flush">
                {resourcesToShow.map(res => (
                    <ListGroup.Item key={res.name} className="px-3 py-2 bg-dark text-light">
                        <ResourceSlot
                            icon={res.icon}
                            name={res.name}
                            currentValue={player.resources[res.name]}
                            balanceValue={balance[res.name] || 0}
                        />
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </Card>
    );
};

export default Profit;