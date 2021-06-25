const EventEmitter = require("events");
const Node = require("./Node");

module.exports = class Manager extends EventEmitter {
    constructor(options) {
        super()
        this.options = options;
        this.nodes = new Map()
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

    handleClientRaw(raw) {
        if(!raw || !["VOICE_SERVER_UPDATE", "VOICE_STATE_UPDATE"].includes(raw.t || "")) return;
        for (const node of this.nodes.values()) node.send(raw);
    }
}