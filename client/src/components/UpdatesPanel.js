import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { purchasableItems } from '../data/shopData.js';

const resourceEmojis = {
  legna: '🪵',
  pietra: '🪨',
  metallo: '⚙️',
  turnisi: '💰',
  cibo: '🍎',
};

const renderResourceBadges = (items, label, variant) => {
  if (!items || Object.keys(items).length === 0) return null;
  return (
    <div className="d-flex align-items-center flex-wrap mt-1">
      <span className={`fw-bold me-2 text-${variant}`}>{label}:</span>
      {Object.entries(items).map(([resource, quantity]) => (
        <Badge key={resource} bg="secondary" text="white" className="me-1 mb-1 fw-normal">
          <span className="me-1">{resourceEmojis[resource.toLowerCase()] || ''}</span>
          {quantity} <span className="text-capitalize">{resource}</span>
        </Badge>
      ))}
    </div>
  );
};

function UpdatesPanel({ gameState, onAcceptTrade, onRejectTrade, onConfirmBattle }) {
  if (!gameState || !gameState.player || !Array.isArray(gameState.player.updates)) {
    return <div className="mt-4"><h4 className="fw-bold mb-3">Feed Aggiornamenti</h4><Card body className="text-center text-muted">In attesa di aggiornamenti...</Card></div>;
  }

  const { player: currentPlayer, currentTurn } = gameState;
  const updates = currentPlayer.updates;
  const isMyTurn = currentPlayer.name === currentTurn;

  return (
    <div className="mt-4">
      <h4 className="fw-bold mb-3">Feed Aggiornamenti</h4>
      {updates.length === 0 ? (
        <Card body className="text-center text-muted">Nessun aggiornamento per ora.</Card>
      ) : (
        <div className="d-flex flex-column gap-3">
          {updates.map((update, index) => {
            const isTradeOffer = update.type === "tradeOffer";
            const isBattleConfirmation = update.type === "battleConfirmation";

            let playerCanAffordTrade = false;
            if (isTradeOffer && update.giveItems) {
              playerCanAffordTrade = Object.entries(update.giveItems).every(([res, qty]) => currentPlayer.resources[res.toLowerCase()] >= qty);
            }

            return (
              <Card key={update.updateId || update.battleId || index} className="shadow-sm">
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-center">
                    {/* Colonna sinistra: Titolo e Dettagli */}
                    <div className="flex-grow-1">
                      <div className="fw-medium">{update.title}</div>

                      {isTradeOffer && (
                        <div className="mt-2 border-top pt-2">
                          {renderResourceBadges(update.receiveItems, 'Ricevi', 'success')}
                          {renderResourceBadges(update.giveItems, 'Dai', 'danger')}
                        </div>
                      )}

                      {isBattleConfirmation && (
                        <div className="mt-2 border-top pt-2 small">
                          <div className="mb-1">Esito per il territorio: <Badge bg="info">{update.targetTerritoryId}</Badge></div>
                          <div>Perdite Attaccante ({update.attackerName}): <Badge bg="danger">{update.attackerLosses}</Badge></div>
                          <div>Tue Perdite (Difensore): <Badge bg="danger">{update.defenderLosses}</Badge></div>
                          {update.isVictory && <div className="mt-1 text-danger fw-bold">Se accetti, perderai questo territorio.</div>}
                          {update.buildingToDestroy && (
                            <div className="mt-1">Edificio bersagliato: <Badge bg="warning" text="dark">{purchasableItems.Shop[update.buildingToDestroy]?.name}</Badge></div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Colonna destra: Pulsanti di Azione */}
                    <div className="ms-3 flex-shrink-0">
                      {isTradeOffer && (
                        <>
                          <Button variant="success" size="sm" className="me-2" onClick={() => onAcceptTrade(true, update.targetTradeId, update.senderTradeId)} disabled={!playerCanAffordTrade || !isMyTurn}>Accetta</Button>
                          <Button variant="danger" size="sm" onClick={() => onRejectTrade(false, update.targetTradeId, update.senderTradeId)} disabled={!isMyTurn}>Rifiuta</Button>
                        </>
                      )}

                      {isBattleConfirmation && (
                        <>
                          <Button variant="success" size="sm" className="me-2" onClick={() => onConfirmBattle(update.battleId, update.attackerName, true)}>Conferma</Button>
                          <Button variant="danger" size="sm" onClick={() => onConfirmBattle(update.battleId, update.attackerName, false)}>Rifiuta</Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UpdatesPanel;