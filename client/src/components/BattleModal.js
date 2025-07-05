import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { purchasableItems } from '../data/shopData.js';
import { map } from '../data/mapData.js';

function BattleModal({ show, onHide, onSubmit, gameState }) {
  // Stati principali
  const [territoryInput, setTerritoryInput] = useState(''); // Input grezzo (es. "1, 2, 3")
  const [isVictory, setIsVictory] = useState(true);
  const [inputError, setInputError] = useState('');

  // Stati per le perdite e la distruzione
  const [attackerLosses, setAttackerLosses] = useState(0);
  const [defenderLosses, setDefenderLosses] = useState(0);
  const [buildingToDestroy, setBuildingToDestroy] = useState('');

  // Trova il difensore in base al territorio selezionato
  const parsedIds = territoryInput.split(',').map(s => s.trim()).filter(Boolean);
  const isMultiMode = parsedIds.length > 1;

  // Logica per determinare lo stato del territorio/i
  let defender = null;
  let areAllNeutral = false;

  if (parsedIds.length > 0 && !inputError) {
    if (isMultiMode) {
      // In modalità multipla, tutti devono essere neutrali
      areAllNeutral = parsedIds.every(id => !gameState.allPlayers.some(p => p.territories.includes(id)));
    } else {
      // In modalità singola, controlla se c'è un difensore
      const singleId = parsedIds[0];
      defender = gameState.allPlayers.find(p => p.territories.includes(singleId));
      areAllNeutral = !defender;
    }
  }

  // Reset del form quando il modale si chiude
  useEffect(() => {
    if (!show) {
      setTerritoryInput('');
      setIsVictory(true);
      setAttackerLosses(0);
      setDefenderLosses(0);
      setBuildingToDestroy('');
      setInputError('');
    }
  }, [show]);
  
  const handleSubmit = () => {
    if (inputError) return; // Non inviare se c'è un errore

    const actionType = areAllNeutral ? 'CONQUER_TERRITORY' : 'PROPOSE_BATTLE';

    let payload;
    if (areAllNeutral) {
      // Per la conquista, inviamo l'array di ID.
      payload = { targetTerritoryIds: parsedIds };
    } else {
      // Per la battaglia, il payload usa il primo (e unico) ID.
      payload = {
        targetTerritoryId: parsedIds[0],
        isVictory,
        defenderName: defender.name,
        attackerLosses: parseInt(attackerLosses, 10),
        defenderLosses: parseInt(defenderLosses, 10),
        buildingToDestroy: buildingToDestroy || null,
      };
    }

    onSubmit(actionType, payload);
    onHide();
  };

  // Funzione per validare l'input del territorio
  const handleTerritoryInputChange = (value) => {
    setTerritoryInput(value);
    setInputError(''); // Resetta l'errore ad ogni cambio

    const ids = value.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) return;

    const errors = [];
    let hasEnemyTerritoryInMultiMode = false;

    ids.forEach(id => {
      if (!map[id]) {
        errors.push(`Territorio ${id} non esiste.`);
      } else if (gameState.player.territories.includes(id)) {
        errors.push(`Possiedi già il territorio ${id}.`);
      } else if (ids.length > 1 && gameState.allPlayers.some(p => p.territories.includes(id))) {
        hasEnemyTerritoryInMultiMode = true;
      }
    });

    if (hasEnemyTerritoryInMultiMode) {
      errors.push('In modalità multipla puoi conquistare solo territori neutrali.');
    }

    if (errors.length > 0) {
      setInputError(errors.join(' '));
    }
  };

  const destroyableBuildings = defender ? 
    Object.entries(defender.equipment)
      .filter(([key, value]) => value > 0 && purchasableItems.Shop[key]?.buildable) : [];
      
  const isSubmitDisabled = parsedIds.length === 0 || !!inputError;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Pianifica Attacco o Conquista</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Quale/i territorio/i vuoi attaccare o conquistare?</Form.Label>
            <Form.Control
              type="text"
              placeholder="Inserisci ID (es: 23) o più ID separati da virgola (es: 23, 24, 29)"
              value={territoryInput}
              onChange={(e) => handleTerritoryInputChange(e.target.value)}
              isInvalid={!!inputError}
            />
            {/* Mostra il messaggio di errore */}
            <Form.Control.Feedback type="invalid">
              {inputError}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Se il territorio è neutrale */}
          {parsedIds.length > 0 && !inputError && areAllNeutral && (
            <Alert variant="success">
              {isMultiMode ? 'Questi territori sono neutrali.' : 'Questo territorio è neutrale.'} Puoi conquistare senza combattere.
            </Alert>
          )}

          {/* Se il territorio è nemico */}
          {!isMultiMode && parsedIds.length > 0 && !inputError && defender && (
            <>
              <Alert variant="danger">
                Stai attaccando il territorio <strong>{parsedIds[0]}</strong>, posseduto da <strong>{defender.name}</strong>.
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
          {areAllNeutral ? 'Conquista Territorio/i' : 'Invia per Conferma'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default BattleModal;