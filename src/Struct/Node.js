const WebSocket = require('ws');
const opCodes = require('../opCodes');
const petitio = require('petitio');
module.exports = class Node {
    constructor(manager, nodeOptions) {
        this.ws = null;
        this.options = nodeOptions;
        this.connected = false;
        this.manager = manager;
        this.reconnectTimeout = null;
        this.retryAmount = 0;
        this.players = new Set();
    }

    connect() {
        if (this.connected) return;
        this.ws = new WebSocket(`ws${this.options.secure ? 's' : ''}://${this.options.host}:${this.options.port}/ws?clientId=${this.manager.clientId}&auth=${this.options.auth}`)
        this.ws.on('open', this.open.bind(this))
        this.ws.on('message', this.message.bind(this))
        this.ws.on('close', this.close.bind(this))
    }

    reconnect() {
        if(this.connected) return;
        this.reconnectTimeout = setTimeout(() => {
            if (this.reconnectAttempts >= this.options.retryAmount) {
                const error = new Error(`Cant connect after ${this.options.retryAmount} attempts.`)
                this.manager.emit("nodeError", error, this);
            }
        }, this.options.delay)
        this.players.clear();
        this.ws.removeAllListeners();
        this.connect();
    }

    open() {
        this.connected = true;
        this.manager.nodes.set(this.options.id, this);
        this.manager.emit('nodeConnected', this)
    }

    message(d) {
        const payload = JSON.parse(d);
        this.manager.emit('nodeRaw', payload, this);
        
        switch(payload.op) {
            case opCodes.Hello: 
                this.manager.emit('debug', payload.message, this)
                break;
            case opCodes.NoClientId:
                this.manager.emit('nodeError', payload.message, this)
                break;
            case opCodes.NoAuth:
                this.manager.emit('nodeError', payload.message, this)
                break;
            case opCodes.VoiceStateUpdate:
                this.manager.options.send(payload.d.d.guild_id, payload.d)
                break;
            case opCodes.OnStart:
                this.manager.emit('trackStart');
                break;
            case opCodes.OnFinish:
                this.manager.emit('trackFinish');
                break;
            case opCodes.OnError:
                this.manager.emit('trackError');
                break;
            default:
                break;
        }
    }

    async postSubscription({ userId, guildId, channelId }) {
        this.players.add(guildId)
        return await petitio(`http${this.options.secure ? 's' : ''}://${this.options.host}:${this.options.port}/${userId}/${guildId}/subscription`, 'POST').body({ channelId }).send();
    }

    async postTrack({ userId, guildId, track }) {
            return await petitio(`http${this.options.secure ? 's' : ''}://${this.options.host}:${this.options.port}/${userId}/${guildId}/subscription/queue`, 'POST').body({ track }).send();
    }

    async postSkip({ userId, guildId }) {
        return await petitio(`http${this.options.secure ? 's' : ''}://${this.options.host}:${this.options.port}/${userId}/${guildId}/subscription/skip`, 'POST').send();
    }

    async postPause({ userId, guildId }) {
        return await petitio(`http${this.options.secure ? 's' : ''}://${this.options.host}:${this.options.port}/${userId}/${guildId}/subscription/pause`, 'POST').send();
    }

    async postResume({ userId, guildId }) {
        return await petitio(`http${this.options.secure ? 's' : ''}://${this.options.host}:${this.options.port}/${userId}/${guildId}/subscription/resume`, 'POST').send();
    }

    async deleteSubscription({ userId, guildId }) {
        return await petitio(`http${this.options.secure ? 's' : ''}://${this.options.host}:${this.options.port}/${userId}/${guildId}/subscription`, 'DELETE').send();
    }

    async send(packet) {
        this.ws.send(JSON.stringify(packet))
    }

    close(code, reason) {
        this.manager.emit("nodeDisconnect", { code, reason }, this);
        if (code !== 1000 || reason !== "destroy") this.reconnect();
    }
    
}