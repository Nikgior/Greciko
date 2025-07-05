class InGameActions{
    constructor(gameRooms){
        this.gameRooms = gameRooms
    }

    _getPlayerById(playerId) {
        for (const room of this.gameRooms.values()) {
            if (room.gameState && room.gameState.players) {
                const player = room.gameState.players.find(p => p.id === playerId);
                if (player) {
                    return player;
                }
            }
        }
        return null;
    }
    sumPlayerResources(data, playerId, sum =true){
    const player = this._getPlayerById(playerId);
    if(!player) return
    if(sum){
        if(data.cibo){
            const newcibo = player.resources.cibo + data.cibo;
            if(newcibo <= player.resourcesLimit.cibo) player.resources.cibo = newcibo;
            else player.resources.cibo = player.resourcesLimit.cibo;
        }
        else if(player.resources.cibo >= player.resourcesLimit.cibo) player.resources.cibo = player.resourcesLimit.cibo;
        if(data.legna){
            const newlegna = player.resources.legna + data.legna;
            if(newlegna <= player.resourcesLimit.legna) player.resources.legna = newlegna;
            else player.resources.legna = player.resourcesLimit.legna;
        }
        else if (player.resources.legna >= player.resourcesLimit.legna) player.resources.legna = player.resourcesLimit.legna;
        if(data.pietra){
            const newpietra = player.resources.pietra + data.pietra;
            if(newpietra <= player.resourcesLimit.pietra) player.resources.pietra = newpietra;
            else player.resources.pietra = player.resourcesLimit.pietra;
        }
        else if( player.resources.pietra >= player.resourcesLimit.pietra) player.resources.pietra = player.resourcesLimit.pietra;
        if(data.metallo){
            const newmetallo = player.resources.metallo + data.metallo;
            if(newmetallo <= player.resourcesLimit.metallo) player.resources.metallo = newmetallo;
            else player.resources.metallo = player.resourcesLimit.metallo;
        }
        else if( player.resources.metallo >= player.resourcesLimit.metallo) player.resources.metallo = player.resourcesLimit.metallo;
        if(data.turnisi) player.resources.turnisi += data.turnisi;
        if(data.pm)player.resources.pm += data.pm;

    } else {
        if(data.cibo)player.resources.cibo -= data.cibo;
        if(data.legna)player.resources.legna -= data.legna;
        if(data.pietra)player.resources.pietra -= data.pietra;
        if(data.metallo)player.resources.metallo -= data.metallo;
        if(data.turnisi)player.resources.turnisi -= data.turnisi;
        if(data.pm)player.resources.pm -= data.pm;
    }
    return player.resources;
}
}


export default InGameActions;