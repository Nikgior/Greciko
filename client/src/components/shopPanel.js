import React from 'react';
import { Card, ListGroup, Button, Badge } from 'react-bootstrap';
import { purchasableItems } from '../data/shopData.js';

const isBelowLimit = (player, itemId)=>{
  if(player.equipment[itemId] >= purchasableItems.Shop[itemId].limit) return false;
  else return true;
}
const canAfford = (playerResources, cost) => {
  if (!cost) return true;
  for (const resource in cost) {
    if (playerResources[resource] < cost[resource]) {
      return false;
    }
  }
  return true;
};
const isTurn = (player,gameState)=>{
  if(player.name===gameState.currentTurn) return true;
  else return false;
}

function ShopPanel({gameState, player, onPurchase }) {
  // MODIFICA: Accedi alla sottocategoria 'Shop'
  const shopItems = Object.entries(purchasableItems.Shop);

  return (
    <Card className="mt-4 shadow-sm">
      <Card.Header as="h5" className="fw-bold">Negozio</Card.Header>
      <ListGroup variant="flush">
        {shopItems.map(([itemId, item]) => {
          const isAffordable = canAfford(player.resources, item.cost);
          return (
            <ListGroup.Item key={itemId} className="p-3">
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
                    <div className="fw-bold">{item.units ? item.units + " " + item.name : item.name}</div>
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
                <Button 
                  variant={isAffordable ? "primary" : "outline-secondary"}
                  size="sm"
                  onClick={() => onPurchase(itemId)}
                  disabled={!isAffordable || !isTurn(player,gameState) || !isBelowLimit(player,itemId)}
                  className="ms-3"
                >
                  Compra
                </Button>
              </div>
            </ListGroup.Item>
          );
        })}
      </ListGroup>
    </Card>
  );
}

export default ShopPanel;