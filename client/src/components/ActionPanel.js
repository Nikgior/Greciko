// ActionPanel.js - MODIFICATO

import React from 'react';
import { Button, Card, Row, Col } from 'react-bootstrap';

function ActionPanel({ 
  onBuildClick, 
  onResearchClick, 
  onEquipmentClick, 
  onUpdateClick,
  onTradeClick,
  onBattleClick, // +++ NUOVA PROP
  onEndTurnClick 
}) {
  return (
    <Card>
      <Card.Body>
        <Row className="g-2">
          
          <Col xs={6}>
            <Button variant="outline-warning" size="sm" onClick={onBuildClick} className="w-100">
              <i className="bi bi-hammer me-2"></i>
              Costruisci / Compra
            </Button>
          </Col>
          
          <Col xs={6}>
            <Button variant="outline-warning" size="sm" onClick={onResearchClick} className="w-100">
              <i className="bi bi-lightbulb me-2"></i>
              Ricerca
            </Button>
          </Col>

          <Col xs={6}>
            <Button variant="outline-warning" size="sm" onClick={onEquipmentClick} className="w-100">
              <i className="bi bi-shield-shaded me-2"></i>
              Equipaggiamento
            </Button>
          </Col>

          <Col xs={6}>
            <Button variant="outline-warning" size="sm" onClick={onUpdateClick} className="w-100">
              <i className="bi bi-bell me-2"></i>
              Aggiornamenti
            </Button>
          </Col>
          
          <Col xs={6}>
            <Button variant="outline-warning" size="sm" onClick={onTradeClick} className="w-100">
              <i className="bi bi-arrow-left-right me-2"></i>
              Scambia
            </Button>
          </Col>

          {/* +++ BLOCCO AGGIUNTO PER LA BATTAGLIA +++ */}
          <Col xs={6}>
            <Button 
              variant="outline-danger" 
              size="sm"
              onClick={onBattleClick}
              className="w-100 fw-bold"
            >
              <i className="bi bi-shield-slash me-2"></i>
              Battaglia
            </Button>
          </Col>
          {/* -------------------------------------- */}

          <Col xs={12}> {/* Ho messo Fine Turno a larghezza piena per dargli più importanza */}
            <Button 
              variant="danger" 
              size="sm"
              onClick={onEndTurnClick}
              className="w-100 mt-2"
            >
              <i className="bi bi-hourglass-split me-2"></i>
              Fine Turno
            </Button>
          </Col>

        </Row>
      </Card.Body>
    </Card>
  );
}

export default ActionPanel;