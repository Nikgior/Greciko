import React, { useState } from 'react';
import { Card, Button, Row, Col, Form, CloseButton, InputGroup, Modal, ListGroup } from 'react-bootstrap';

// Le risorse disponibili
const AVAILABLE_RESOURCES = ['legna', 'pietra', 'metallo', 'turnisi', 'cibo'];

// Funzione helper per rendere maiuscola la prima lettera
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function TradePanel({ onClose, onSubmitTrade, gameState }) {
  const [tradeOffer, setTradeOffer] = useState({
    giveItems: {},
    receiveItems: {},
  });
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [resourceModalState, setResourceModalState] = useState({ 
    isOpen: false, 
    type: null,
  });
  const [isPlayerModalOpen, setPlayerModalOpen] = useState(false);

  if (!gameState || !gameState.players || !gameState.player) {
    return (
      <Card className="shadow-lg">
        <Card.Header><Card.Title as="h5" className="mb-0">Caricamento...</Card.Title></Card.Header>
        <Card.Body className="text-center text-muted p-4">In attesa dei dati di gioco...</Card.Body>
      </Card>
    );
  }

  // gameState.players è probabilmente un array di stringhe, non di oggetti.
  // Lo trattiamo come tale.
  const { players: playerList, player: currentPlayer } = gameState;

  const handleAddResource = (type, resource) => {
    setTradeOffer(prev => ({
      ...prev,
      [type]: { ...prev[type], [resource]: 1 },
    }));
    handleCloseResourceModal();
  };

  const handleRemoveResource = (type, resource) => {
    setTradeOffer(prev => {
      const newItems = { ...prev[type] };
      delete newItems[resource];
      return { ...prev, [type]: newItems };
    });
  };

  const handleUpdateQuantity = (type, resource, value) => {
    const quantity = parseInt(value, 10);
    if (value === '') {
        setTradeOffer(prev => ({ ...prev, [type]: { ...prev[type], [resource]: '' } }));
        return;
    }
    if (!isNaN(quantity) && quantity >= 1) {
        setTradeOffer(prev => ({ ...prev, [type]: { ...prev[type], [resource]: quantity } }));
    }
  };
  
  const handleSubmit = () => {
    const finalOffer = {
      giveItems: tradeOffer.giveItems,
      receiveItems: tradeOffer.receiveItems,
      targetPlayerName: selectedPlayer,
      senderPlayerName: currentPlayer.name
    };
    onSubmitTrade(finalOffer);
    onClose();
  };

  const playerLacksResources = Object.entries(tradeOffer.giveItems).some(
    ([resource, quantity]) => {
      const playerAmount = currentPlayer.resources[resource] || 0;
      return playerAmount < quantity;
    }
  );

  const isTradeInvalid =
    !selectedPlayer ||
    Object.keys(tradeOffer.giveItems).length === 0 ||
    Object.keys(tradeOffer.receiveItems).length === 0 ||
    Object.values(tradeOffer.giveItems).some(qty => !qty || qty < 1) ||
    Object.values(tradeOffer.receiveItems).some(qty => !qty || qty < 1) ||
    playerLacksResources;

  const handleOpenResourceModal = (type) => setResourceModalState({ isOpen: true, type });
  const handleCloseResourceModal = () => setResourceModalState({ isOpen: false, type: null });
  
  const getAvailableResourcesForModal = () => {
    if (!resourceModalState.type) return [];
    const usedResources = Object.keys(tradeOffer[resourceModalState.type]);
    return AVAILABLE_RESOURCES.filter(r => !usedResources.includes(r));
  };
  
  const handlePlayerSelect = (playerName) => {
    setSelectedPlayer(playerName);
    setPlayerModalOpen(false);
  };
  
  const getSelectedPlayerName = () => {
    return selectedPlayer || 'Scegli un giocatore...';
  };
  
  const renderTradeColumn = (type) => {
    const title = type === 'giveItems' ? 'Cosa Offri' : 'Cosa Chiedi';
    const items = tradeOffer[type];
    const variant = type === 'giveItems' ? 'primary' : 'success';

    return (
      <Col md={6} className="d-flex flex-column">
        <h6 className={`text-${variant} mt-3`}>{title}</h6>
        <div className="flex-grow-1">
          {Object.entries(items).map(([resource, quantity]) => {
            let isItemInvalid = false;
            if (type === 'giveItems') {
              const playerResourceAmount = currentPlayer.resources[resource] || 0;
              isItemInvalid = playerResourceAmount < quantity;
            }
            return (
              <InputGroup className="mb-2" key={resource}>
                <InputGroup.Text className="flex-grow-1 text-capitalize">{capitalize(resource)}</InputGroup.Text>
                <Form.Control
                  type="number"
                  min="1"
                  placeholder="Q.tà"
                  value={quantity}
                  onChange={(e) => handleUpdateQuantity(type, resource, e.target.value)}
                  style={{ maxWidth: '80px' }}
                  isInvalid={isItemInvalid}
                />
                <Button variant="outline-danger" onClick={() => handleRemoveResource(type, resource)}>
                  <i className="bi bi-trash"></i>
                </Button>
              </InputGroup>
            );
          })}
        </div>
        <Button variant={`outline-${variant}`} className="mt-auto" onClick={() => handleOpenResourceModal(type)}>
          + Aggiungi Risorsa
        </Button>
      </Col>
    );
  };

  return (
    <>
      <Card className="shadow-lg">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <Card.Title as="h5" className="mb-0">Crea Offerta di Scambio</Card.Title>
          <CloseButton onClick={onClose} />
        </Card.Header>
        <Card.Body>
          <Form.Group className="mb-4">
            <Form.Label>A chi vuoi proporre lo scambio?</Form.Label>
            <Button variant="outline-secondary" className="d-block w-100 text-start" onClick={() => setPlayerModalOpen(true)}>
              {getSelectedPlayerName()}
            </Button>
          </Form.Group>
          
          <Row>
            {renderTradeColumn('giveItems')}
            <div className="vr d-none d-md-block mx-2"></div>
            {renderTradeColumn('receiveItems')}
          </Row>
        </Card.Body>
        <Card.Footer className="text-end">
          <Button variant="warning" onClick={handleSubmit} disabled={isTradeInvalid}>
            Proponi Scambio
          </Button>
        </Card.Footer>
      </Card>

      {/* Modal per aggiungere una risorsa */}
      <Modal show={resourceModalState.isOpen} onHide={handleCloseResourceModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Scegli una risorsa da aggiungere</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ListGroup>
            {getAvailableResourcesForModal().length > 0 ? (
                getAvailableResourcesForModal().map(resource => (
                    <ListGroup.Item action key={resource} onClick={() => handleAddResource(resourceModalState.type, resource)} className="text-capitalize">
                        {capitalize(resource)}
                    </ListGroup.Item>
                ))
            ) : (
                <ListGroup.Item disabled>Tutte le risorse sono già state aggiunte.</ListGroup.Item>
            )}
          </ListGroup>
        </Modal.Body>
      </Modal>

      {/* Modal per scegliere il giocatore (CORRETTO) */}
      <Modal show={isPlayerModalOpen} onHide={() => setPlayerModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Scegli un destinatario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ListGroup>
            {/* ERRORE CORRETTO QUI:
              Trattiamo gli elementi di 'playerList' come stringhe ('playerName'), 
              non come oggetti ('player.name'), perché questo causava il crash.
            */}
            {playerList
              .filter(playerName => playerName !== currentPlayer.name)
              .map(playerName => (
                <ListGroup.Item action key={playerName} onClick={() => handlePlayerSelect(playerName)}>
                  {playerName}
                </ListGroup.Item>
              ))}
          </ListGroup>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default TradePanel;