import React from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Accetta la nuova prop 'limits'
function ResourceBar({ resources, limits, onDashboardClick }) {
  if (!resources) return null;

  return (
    <Navbar bg="dark" variant="dark" sticky="top" className="shadow-sm">
      <Link to="/" className="btn btn-secondary mt-1 ms-2" onClick={onDashboardClick}>
        🏠 Dashboard
      </Link>
      <Container fluid className="justify-content-around">
        <Nav className="flex-row flex-wrap">

          {/* Cibo con limite */}
          <Nav.Item className="text-center mx-2 my-1">
            <i className="bi bi-basket-fill text-danger"></i>
            <div className="fw-bold">
              🍞 {resources.cibo}
              {limits?.cibo && <span className="text-muted fw-normal small"> / {limits.cibo}</span>}
            </div>
          </Nav.Item>

          {/* Legna con limite */}
          <Nav.Item className="text-center mx-2 my-1">
            <i className="bi bi-tree-fill text-success"></i>
            <div className="fw-bold">
              🪵 {resources.legna}
              {limits?.legna && <span className="text-muted fw-normal small"> / {limits.legna}</span>}
            </div>
          </Nav.Item>

          {/* Pietra con limite */}
          <Nav.Item className="text-center mx-2 my-1">
            <i className="bi bi-bricks text-light"></i>
            <div className="fw-bold">
              🪨 {resources.pietra}
              {limits?.pietra && <span className="text-muted fw-normal small"> / {limits.pietra}</span>}
            </div>
          </Nav.Item>

          {/* Metallo con limite */}
          <Nav.Item className="text-center mx-2 my-1">
            <i className="bi bi-layers-fill text-secondary"></i>
            <div className="fw-bold">
              🔩 {resources.metallo}
              {limits?.metallo && <span className="text-muted fw-normal small"> / {limits.metallo}</span>}
            </div>
          </Nav.Item>

          {/* Turnisi (senza limite) */}
          <Nav.Item className="text-center mx-2 my-1">
            <i className="bi bi-coin text-warning"></i>
            <div className="fw-bold">💰 {resources.turnisi}</div>
          </Nav.Item>

          {/* Punti Mossa (senza limite) */}
          <Nav.Item className="text-center mx-2 my-1">
            <i className="bi bi-lightning-charge-fill text-info"></i>
            <div className="fw-bold">⚡️ {resources.pm}</div>
          </Nav.Item>

        </Nav>
      </Container>
    </Navbar>
  );
}

export default ResourceBar;