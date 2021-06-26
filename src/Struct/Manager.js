const { default: Collection } = require("@discordjs/collection");
const EventEmitter = require("events");
const Node = require("./Node");
const Player = require("./PLayer");

module.exports = class Manager extends EventEmitter {
    constructor(options) {
        super()
        this.options = options;
        this.nodes = new Collection();
        this.players = new Collection();
    }

    init(clientId) {
        if (typeof clientId !== "string") throw new Error('"clientId" set is not type of "string"');
        this.clientId = clientId;
        if(this.options.nodes) {
            for(const node of this.options.nodes) {
                const voiceNode = new Node(this, node)
                this.nodes.set(node.id, voiceNode)
            }
        }
        for (const node of this.nodes.values()) node.connect();
        return this;
    }

    create({ guildId, channelId }) {
        if(this.players.has(guildId)) {
            return this.players.get(guildId);
        }
        const player = new Player({ guildId, channelId }, this.nodes.filter(x => x.connected).first(), this)
        this.players.set(guildId, player) 
        return player;
    }

    handleClientRaw(raw) {
        if(!raw || !["VOICE_SERVER_UPDATE", "VOICE_STATE_UPDATE"].includes(raw.t || "")) return;
        const player = this.players.get(raw.d.guild_id)
        if(!player) return;
        player.node.send(raw);
    }
}