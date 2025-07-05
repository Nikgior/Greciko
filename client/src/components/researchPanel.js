import React, { useState } from 'react';
import { Card, ListGroup, Button, Badge } from 'react-bootstrap';
import { purchasableItems } from '../data/shopData.js';

// --- FUNZIONE CORRETTA - PRESA DA shopPanel.js ---
// Controlla se il giocatore ha abbastanza risorse per un determinato costo.
const canAfford = (playerResources, cost) => {
  if (!cost) return true; // Se non c'è costo, è sempre possibile.
  for (const resource in cost) {
    // Se anche solo una risorsa è insufficiente, ritorna false.
    const playerAmount = playerResources[resource] || 0; // Gestisce il caso in cui una risorsa sia undefined
    if (playerAmount < cost[resource]) {
      return false;
    }
  }
  // Se il ciclo si completa, significa che il giocatore può permetterselo.
  return true;
};
// -------------------------------------------------

const isTurn = (player,gameState)=>{
  if(player.name===gameState.currentTurn) return true;
  else return false;
}

function ResearchPanel({gameState, player, onResearch }) {
  const researchItems = Object.entries(purchasableItems.Research);
  const [highlightedItemId, setHighlightedItemId] = useState(null);

  const handleResearchClick = (itemId) => {
    onResearch(itemId);

    // Attiva l'evidenziazione
    setHighlightedItemId(itemId);

    // Rimuovi l'evidenziazione dopo 750ms
    setTimeout(() => {
      setHighlightedItemId(null);
    }, 750);
  };

  return (
    <Card bg="dark" text="light" className="mt-4 shadow">
      <Card.Header as="h5" className="fw-bold border-secondary">Centro Ricerche</Card.Header>
      <ListGroup variant="flush">
        {researchItems.map(([itemId, item]) => {
          // Ora 'isAffordable' verrà calcolato correttamente
          const isAffordable = canAfford(player.resources, item.cost);
          
          const currentLevel = (player.powerUp && player.powerUp[itemId]) || 0;

          return (
            <ListGroup.Item key={itemId} className={`p-3 bg-dark text-light ${highlightedItemId === itemId ? 'item-purchased-highlight' : ''}`}>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  {item.image && (
                    <img 
                      src={`/images/${item.image}`}
                      alt={item.name} 
                      style={{ width: '50px', height: '50px', marginRight: '15px', objectFit: 'contain' }} 
                    />
                  )}
                  <div>
                    <div className="fw-bold">{item.name}</div>
                    <div className="text-muted small mb-2">{item.description}</div>
                    {item.cost && (
                      <div>
                        {Object.entries(item.cost).map(([resource, value]) => (
                          value > 0 && <Badge key={resource} bg="secondary" text="white" className="me-1 fw-normal">
                            {value} <span className="text-capitalize">{resource}</span>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center">
                    <Button 
                        variant="primary"
                        size="sm"
                        onClick={() => handleResearchClick(itemId)}
                        // Il pulsante ora si disabilita correttamente
                        disabled={!isAffordable || !isTurn(player,gameState)}
                        className="ms-3"
                        style={{ minWidth: '90px' }}
                    >
                        Ricerca
                    </Button>
                    
                    <div className="small text-white-50 mt-1">
                        Livello: <span className="fw-bold text-white">{currentLevel}</span>
                    </div>
                </div>
              </div>
            </ListGroup.Item>
          );
        })}
      </ListGroup>
    </Card>
  );
}

export default ResearchPanel;