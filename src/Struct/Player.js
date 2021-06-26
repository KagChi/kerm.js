const opCodes = require('../opCodes');
module.exports = class Player {
    constructor(options, node, manager) {
        this.options = options;
        this.node = node;
        this.manager = manager;
        this.node.ws.on('message', this.message.bind(this))
        
    }
    message(d) {
        const payload = JSON.parse(d);
        switch(payload.op) {
            case opCodes.OnStart:
                this.manager.emit('trackStart', this);
                break;
            case opCodes.OnFinish:
                this.manager.emit('trackFinish', this);
                break;
            case opCodes.OnError:
                this.manager.emit('trackError', this);
                break;
            default:
                break;
        }
    }
    connect() {
        this.node.postSubscription({ userId: this.manager.clientId, guildId: this.options.guildId, channelId: this.options.channelId })
    }

    destroy() {
        this.node.deleteSubscription({ userId: this.manager.clientId, guildId: this.options.guildId })
    }

    playTrack(track) {
        this.node.postTrack({ userId: this.manager.clientId, guildId: this.options.guildId, track })
    }

    pause(pause) {
        if (typeof pause !== "boolean") throw new RangeError('Must be a boolean.');
        if(pause) {
            this.node.postPause({ userId: this.manager.clientId, guildId: this.options.guildId })
        } else {
            this.node.postResume({ userId: this.manager.clientId, guildId: this.options.guildId })
        }
    }

    skip() {
        this.node.postSkip({ userId: this.manager.clientId, guildId: this.options.guildId })
    }
}