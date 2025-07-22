import React, { useState } from 'react';
import { Container } from 'react-bootstrap';

// Importa i componenti "figli"
import ResourceBar from './ResourceBar';
import Profit from './Profit';
import ShopPanel from './shopPanel.js';
import ActionPanel from './ActionPanel';
import EquipmentPanel from './EquipmentPanel';
import './GrecikoDashboard.css'; 
import ResearchPanel from './researchPanel.js';
import UpdatesPanel from './UpdatesPanel.js';
import TradePanel from './TradePanel.js';
import BattleModal from './BattleModal.js'; // Nuovo import

function GrecikoDashboard({ player, gameState, onGameAction }) {
  const [activePanel, setActivePanel] = useState('none'); 
  const [isBattleModalOpen, setBattleModalOpen] = useState(false); // Stato per il modale di battaglia

  if (!player || !gameState) {
    return <div className="text-center p-5 text-white">Caricamento della partita...</div>;
  }
  
  const handlePurchase = (itemId) => {
    onGameAction({ type: 'PURCHASE_ITEM', payload: { itemId } });
  };
  const handleResearch = (powerUpId) => {
    onGameAction({ type: 'RESEARCH_POWERUP', payload: { powerUpId } });
  };
  const handleEndTurn = () => {
    onGameAction({ type: 'END_TURN' });
  };
  const handleUsage=(itemId)=>{
    onGameAction({ type: 'USE_ITEM', payload: {itemId} });
  }
  const handleTradeSubmitted = (tradeOffer) => {
    onGameAction({ type: 'SUBMIT_TRADE_OFFER', payload: {tradeOffer} });
  }
  const handleTradeAnswer = (answer, targetTradeIndex, senderTradeIndex) => {
    onGameAction({
        type: 'ANSWER_TRADE_OFFER',
        payload: {
          answer,
          targetTradeIndex,
          senderTradeIndex
        }
    });
  }

  // Funzioni per la battaglia
  const handleBattleClick = () => {
    setBattleModalOpen(true);
  };

  const handleBattleAction = (type, payload) => {
    onGameAction({ type, payload });
  };
  
  const handleConfirmBattle = (battleId, attackerName, accepted) => {
    onGameAction({ type: 'CONFIRM_BATTLE', payload: { battleId, attackerName, accepted } });
  };

  const handleShopClick = () => {
    setActivePanel(current => (current === 'shop' ? 'none' : 'shop'));
  };
  const handleTradeClick = () =>{
    setActivePanel(current => (current === 'trade' ? 'none' : 'trade'));
  }
  const handleEquipmentClick = () => {
    setActivePanel(current => (current === 'equipment' ? 'none' : 'equipment'));
  };
  const handleResearchClick = () => {
    setActivePanel(current => (current === 'research' ? 'none' : 'research'));
  };
  const handleUpdateClick = () => {
    setActivePanel(current => (current === 'update' ? 'none' : 'update'));
  };
  const handleDashboardClick = () => {
    setActivePanel('none');
  };
  

  return (
    <div className="greciko-dashboard-layout">
      
      <div className="main-content-area">
        <ResourceBar resources={player.resources} limits={player.resourcesLimit} onDashboardClick={handleDashboardClick} />

        <Container className="py-4">
          <div className="text-center mb-4 text-white">
            <h1 className="display-5 fw-bold">Dashboard</h1>
            <p className="fs-4 fw-bold text-warning">
              {player.name}
            </p>
            <p className="fs-5 text-muted fst-italic">
              Roccaforte: {player.roccaforte}
            </p>
            <p className="text-muted mt-3">
              È il turno di: {gameState.currentTurn}
            </p>
          </div>

          {activePanel === 'none' && (
            <Profit player={player} />
          )}

          {activePanel === 'shop' && (
            <ShopPanel gameState={gameState} player={player} onPurchase={handlePurchase} />
          )}

          {activePanel === 'equipment' && (
            <EquipmentPanel player={player} handleUsage={handleUsage} />
          )}

          {activePanel === 'research' && (
            <ResearchPanel gameState={gameState} player={player} onResearch={handleResearch} />
          )}

          {activePanel === 'update' && (
            <UpdatesPanel 
              gameState={gameState}
              onRejectTrade={handleTradeAnswer}
              onAcceptTrade={handleTradeAnswer}
              onConfirmBattle={handleConfirmBattle}
            />
          )}
          {activePanel === 'trade' && (
            <TradePanel
              onSubmitTrade={handleTradeSubmitted}
              onClose = {handleTradeClick}
              gameState={gameState}/>
          )}
        </Container>
      </div>

      <div className="action-panel-fixed">
        <ActionPanel 
            onBuildClick={handleShopClick}
            onResearchClick={handleResearchClick}
            onEquipmentClick={handleEquipmentClick}
            onEndTurnClick={handleEndTurn}
            onUpdateClick={handleUpdateClick}
            onTradeClick={handleTradeClick}
            onBattleClick={handleBattleClick}
        />
      </div>

      <BattleModal 
        show={isBattleModalOpen}
        onHide={() => setBattleModalOpen(false)}
        onSubmit={handleBattleAction} // Modifica questa prop
        gameState={gameState}
      />
    </div>
  );
}

export default GrecikoDashboard;