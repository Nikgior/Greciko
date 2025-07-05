import React from 'react';
// 1. Importa anche il componente Button
import { Card, Badge, Row, Col, Button } from 'react-bootstrap'; 
import { purchasableItems } from '../data/shopData.js';


function EquipmentPanel({ player, handleUsage}) {
  const playerEquipment = player.equipment;

  if (!playerEquipment) {
    return <div className="text-muted">Caricamento equipaggiamento...</div>;
  }

  const ownedItems = Object.entries(playerEquipment).filter(([itemId, quantity]) => quantity > 0);

  return (
    <div className="mt-4">
      <h4 className="fw-bold mb-3">Il Tuo Equipaggiamento</h4>

      {ownedItems.length === 0 ? (
        <Card body className="text-center text-muted">
          Non hai ancora equipaggiamento o tecnologie sbloccate.
        </Card>
      ) : (
        <Row xs={1} lg={2} className="g-3">
          {ownedItems.map(([itemId, quantity]) => {
            const itemDetails = purchasableItems.Shop[itemId];
            if (!itemDetails) return null;

            return (
              <Col key={itemId}>
                <Card className="h-100 shadow-sm">
                  <Card.Body className="d-flex align-items-center p-2">
                    <Row className="g-2 w-100 align-items-center">
                      {/* Colonna per l'immagine */}
                      <Col xs={4}>
                        {itemDetails.image && (
                          <img
                            src={`/images/${itemDetails.image}`}
                            alt={itemDetails.name}
                            className="img-fluid rounded"
                            style={{ objectFit: 'contain' }}
                          />
                        )}
                      </Col>
                      
                      {/* Colonna per il testo e la quantità */}
                      <Col xs={8}>
                        <div className="d-flex flex-column h-100">
                          {/* Nome e descrizione */}
                          <div>
                            <h6 className="fw-bold mb-1 text-truncate">{itemDetails.name}</h6>
                            <p className="small text-muted mb-2">
                              {itemDetails.description}
                            </p>
                          </div>
                          
                          {/* SEZIONE MODIFICATA: Contiene il bottone e la quantità */}
                          <div className="mt-auto d-flex justify-content-end align-items-center">
                            
                            {/* 2. Mostra il bottone solo se itemDetails.usable è true */}
                            {itemDetails.usable && (
                              <Button 
                              onClick={() => handleUsage(itemId)} 
                              variant="success" 
                              size="sm" 
                              className="me-2"
                              >
                                Usa
                              </Button>
                            )}

                            <Badge pill bg="primary" text="light" className="px-2 py-1">
                              x{quantity}
                            </Badge>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}

export default EquipmentPanel;