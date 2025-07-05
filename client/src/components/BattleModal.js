import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { purchasableItems } from '../data/shopData.js';
import { map } from '../data/mapData.js';

function BattleModal({ show, onHide, onSubmit, gameState }) {
  // Stati principali
  const [targetTerritoryId, setTargetTerritoryId] = useState('');
  const [isVictory, setIsVictory] = useState(true);
  const [inputError, setInputError] = useState(''); // Stato per l'errore di input

  // Stati per le perdite e la distruzione
  const [attackerLosses, setAttackerLosses] = useState(0);
  const [defenderLosses, setDefenderLosses] = useState(0);
  const [buildingToDestroy, setBuildingToDestroy] = useState('');

  // Trova il difensore in base al territorio selezionato
  const defender = targetTerritoryId ? gameState.allPlayers.find(p => p.territories.includes(targetTerritoryId)) : null;
  const isNeutralTerritory = targetTerritoryId && !defender;

  // Reset del form quando il modale si chiude
  useEffect(() => {
    if (!show) {
      setTargetTerritoryId('');
      setIsVictory(true);
      setAttackerLosses(0);
      setDefenderLosses(0);
      setBuildingToDestroy('');
      setInputError('');
    }
  }, [show]);
  
  const handleSubmit = () => {
    if (inputError) return; // Non inviare se c'è un errore

    const actionType = isNeutralTerritory ? 'CONQUER_TERRITORY' : 'PROPOSE_BATTLE';
    
    const payload = isNeutralTerritory ? { targetTerritoryId } : {
      targetTerritoryId,
      isVictory,
      defenderName: defender.name,
      attackerLosses: parseInt(attackerLosses, 10),
      defenderLosses: parseInt(defenderLosses, 10),
      buildingToDestroy: buildingToDestroy || null,
    };

    onSubmit(actionType, payload);
    onHide();
  };

  // Funzione per validare l'input del territorio
  const handleTerritoryChange = (value) => {
    const territoryId = value;
    setTargetTerritoryId(territoryId);
    setInputError(''); // Resetta l'errore ad ogni cambio

    if (!territoryId) return;

    if (!map[territoryId]) {
      setInputError('Questo territorio non esiste.');
    } else if (gameState.player.territories.includes(territoryId)) {
      setInputError('Non puoi attaccare un tuo territorio.');
    }
  };

  const destroyableBuildings = defender ? 
    Object.entries(defender.equipment)
      .filter(([key, value]) => value > 0 && purchasableItems.Shop[key]?.buildable) : [];
      
  const isSubmitDisabled = !targetTerritoryId || !!inputError;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Pianifica Attacco o Conquista</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Quale territorio vuoi attaccare o conquistare?</Form.Label>
            {/* CAMPO DI INPUT NUMERICO AL POSTO DEL DROPDOWN */}
            <Form.Control
              type="number"
              placeholder="Inserisci il numero del territorio"
              value={targetTerritoryId}
              onChange={(e) => handleTerritoryChange(e.target.value)}
              isInvalid={!!inputError}
            />
            {/* Mostra il messaggio di errore */}
            <Form.Control.Feedback type="invalid">
              {inputError}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Se il territorio è neutrale */}
          {targetTerritoryId && !inputError && isNeutralTerritory && (
            <Alert variant="success">
              Questo territorio è neutrale. Puoi conquistarlo senza combattere.
            </Alert>
          )}

          {/* Se il territorio è nemico */}
          {targetTerritoryId && !inputError && defender && (
            <>
              <Alert variant="danger">
                Stai attaccando il territorio <strong>{targetTerritoryId}</strong>, posseduto da <strong>{defender.name}</strong>.
              </Alert>
              <Form.Group className="mb-3">
                <Form.Check 
                  type="switch"
                  id="victory-switch"
                  label="Hai ottenuto la vittoria? (scambia il territorio)"
                  checked={isVictory}
                  onChange={(e) => setIsVictory(e.target.checked)}
                />
              </Form.Group>
              <Row>
                <Col>
                  <Form.Group>
                    <Form.Label>Tue perdite (Attaccante)</Form.Label>
                    <Form.Control type="number" min="0" value={attackerLosses} onChange={e => setAttackerLosses(e.target.value)} />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label>Perdite del Difensore</Form.Label>
                    <Form.Control type="number" min="0" value={defenderLosses} onChange={e => setDefenderLosses(e.target.value)} />
                  </Form.Group>
                </Col>
              </Row>
              {destroyableBuildings.length > 0 && (
                <Form.Group className="mt-3">
                  <Form.Label>Distruggi edificio (opzionale)</Form.Label>
                  <Form.Select value={buildingToDestroy} onChange={e => setBuildingToDestroy(e.target.value)}>
                    <option value="">Nessuno</option>
                    {destroyableBuildings.map(([key]) => (
                      <option key={key} value={key}>{purchasableItems.Shop[key].name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
            </>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Annulla</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={isSubmitDisabled}>
          {isNeutralTerritory ? 'Conquista Territorio' : 'Invia per Conferma'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default BattleModal;