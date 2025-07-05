export const purchasableItems = {
    Shop: {
        armata: {
            name: 'Armate',
            description: 'Unità di combattimento base.',
            cost: { cibo: 15, legna: 5, pietra: 0, metallo: 1, turnisi: 15, pm: 0 },
            image: "Armata.png",
            units: 6,
            limit: "none",
            usable: false,
            buildable: false
        },
        cannone: {
            name: 'Cannone',
            description: 'Efficace contro i muri e le fortezze.',
            cost: { cibo: 0, legna: 10, pietra: 2, metallo: 5, turnisi: 50, pm: 0 },
            image: "Cannone1.png",
            limit: "none",
            usable: false,
            buildable: true
        },
        laboratorioTecnologia: {
            name: 'Laboratorio di Tecnologia Avanzata',
            description: 'Sblocca la produzione di Tecnologie Avanzate.',
            cost: { cibo: 0, legna: 40, pietra: 30, metallo: 15, turnisi: 150, pm: 0 },
            image: "Laboratorio.png",
            limit: 3,
            usable: false,
            buildable: true
        },
        fabbricaArmiPesanti: {
            name: 'Fabbrica Armi Pesanti',
            description: 'Sblocca la produzione di Armate Pesanti.',
            cost: { cibo: 85, legna: 40, pietra: 0, metallo: 6, turnisi: 100, pm: 0 },
            image: "Fabbrica.png",
            limit: 2,
            usable: false,
            buildable: true
        },
        emporioMaggior: {
            name: 'Emporio Maggiore',
            description: 'Sblocca la produzione di oggetti di valore.',
            cost: { cibo: 0, legna: 40, pietra: 100, metallo: 10, turnisi: 700, pm: 0 },
            image: "Borsa.png",
            limit: 2,
            usable: false,
            buildable: true
        },
        fortificazioneMaestra: {
            name: 'Fortificazione Maestra',
            description: 'Rimuove 2 armate da un territorio vicino (max 1 di distanza).',
            cost: { cibo: 0, legna: 30, pietra: 60, metallo: 0, turnisi: 100, pm: 0 },
            image: "FortificazioneMaestra.png",
            limit: 3,
            usable: false,
            buildable: true
        },
        grandeGranaio: {
            name: 'Grande Granaio',
            description: 'Rimuove 2 armate da un territorio vicino (max 1 di distanza).',
            cost: { cibo: 0, legna: 100, pietra: 100, metallo: 2, turnisi: 0, pm: 0 },
            image: "Granaio.png",
            limit: 2,
            usable: false,
            buildable: true
        },
        portoCommerciale: {
            name: 'Porto Commerciale',
            description: 'Rimuove 2 armate da un territorio vicino (max 1 di distanza).',
            cost: { cibo: 0, legna: 100, pietra: 50, metallo: 10, turnisi: 200, pm: 0 },
            image: "Porto.png",
            limit: 2,
            usable: false,
            buildable: true
        },
        deposito: {
            name: 'Deposito',
            description: 'Rimuove 2 armate da un territorio vicino (max 1 di distanza).',
            cost: { cibo: 0, legna: 100, pietra: 100, metallo: 20, turnisi: 100, pm: 0 },
            image: "Deposito.png",
            limit: 2,
            usable: false,
            buildable: true
        },
        schermoFumo: {
            name: 'Tecnologia: Schermo Fumo',
            description: 'Annulla i bonus difensivi degli edifici per un attacco.',
            cost: { cibo: 0, legna: 50, pietra: 30, metallo: 2, turnisi: 0, pm: 0 },
            image: "Fumo.png",
            limit: "none",
            usable: true,
            buildable: false
        },
        artiglieriaNavale: {
            name: 'Tecnologia: Artiglieria Navale',
            description: 'Elimina i Muri e 3 armate da un territorio costiero.',
            cost: { cibo: 0, legna: 40, pietra: 40, metallo: 35, turnisi: 200, pm: 0 },
            image: "Nave2.png",
            limit: "none",
            usable: true,
            buildable: false
        },
        intercettazioneNavale: {
            name: 'Tecnologia: Intercettazione Navale',
            description: 'Contromisura attiva che riduce l\'effetto di "Artiglieria Navale".',
            cost: { cibo: 0, legna: 60, pietra: 60, metallo: 20, turnisi: 100, pm: 0 },
            image: "IntercettazioneNavale.png",
            limit: "none",
            usable: true,
            buildable: false
        },
        torrettaContraerea: {
            name: 'Torretta Contraerea',
            description: 'Riduce di 2 le armate rimosse da un Bombardamento.',
            cost: { metallo: 20, pietra: 10, turnisi: 30, pm: 1, cibo: 0, legna: 0 },
            image: "Torretta2.png",
            limit: "none",
            usable: false,
            buildable: true
        },
        bombardamentoUltraleggero: {
            name: 'Tecnologia: Bombardamento Ultraleggero',
            description: 'Rimuove 4 armate da un territorio vicino (max 1 di distanza).',
            cost: { metallo: 60, pietra: 30, legna: 20, turnisi: 100, cibo: 0, pm: 0 },
            image: "Bombardamento.png",
            limit: "none",
            usable: true,
            buildable: false
        },
        reteTunnel: {
            name: 'Tecnologia: Rete di Tunnel Sotterranei',
            description: 'Sposta armate tra territori montuosi non adiacenti.',
            cost: { pietra: 55, metallo: 25, legna: 15, turnisi: 105, cibo: 0, pm: 0 },
            image: "ReteDiTunnelSotterranei.png",
            limit: "none",
            usable: true,
            buildable: false
        },
        rilevamentoRapido: {
            name: 'Tecnologia: Rilevamento Rapido',
            description: 'Contromisura attiva che annulla l\'effetto di "Schermo Fumo".',
            cost: { metallo: 45, pietra: 20, legna: 10, turnisi: 85, cibo: 0, pm: 0 },
            image: "RilevamentoRapido.png",
            limit: "none",
            usable: true,
            buildable: false
        },
        rilevamentoSismico: {
            name: 'Tecnologia: Rilevamento Sismico',
            description: 'Contromisura attiva che blocca l\'uso della "Rete di Tunnel Sotterranei".',
            cost: { pietra: 50, metallo: 20, legna: 10, turnisi: 95, cibo: 0, pm: 0 },
            image: "RilevamentoSismico.png",
            limit: "none",
            usable: true,
            buildable: false
        }
    },
    Research: {
        OttimizzazioneUliveti:{
            name: 'OttimizzazioneUliveti',
            description: 'Aumenta la produzione di Legna di 3 per territorio',
            cost:{pietra: 5, metallo: 2, legna: 28, turnisi: 100, cibo: 0, pm: 0},
        },
        OttimizzazioneCave:{
            name: 'OttimizzazioneCave',
            description: 'Aumenta la produzione di Pietra di 2 per territorio',
            cost:{pietra: 5, metallo: 2, legna: 28, turnisi: 100, cibo: 0, pm: 0},
        },
        OttimizzazioneMiniere:{
            name: 'OttimizzazioneMiniere',
            description: 'Aumenta la produzione di Metallo di 1 per territorio',
            cost:{pietra: 5, metallo: 2, legna: 28, turnisi: 100, cibo: 0, pm: 0},
        },
        StrategiaMigliorata:{
            name: 'StrategiaMigliorata',
            description: 'Aumenta la quantità di punti mossa',
            cost:{pietra: 5, metallo: 2, legna: 28, turnisi: 100, cibo: 0, pm: 0},
            
        }
    }
};
