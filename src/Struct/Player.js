module.exports = class Player {
    constructor(options, node, manager) {
        this.options = options;
        this.node = node;
        this.manager = manager;
    }

    connect() {
        this.node.postSubscription({ userId: this.manager.clientId, guildId: this.options.guildId, channelId: this.options.channelId })
    }

    destroy() {
        this.node.postSubscription({ userId: this.manager.clientId, guildId: this.options.guildId, channelId: null })
    }

    playTrack(track) {
        this.node.postTrack({ userId: this.manager.clientId, guildId: this.options.guildId, track })
    }
}