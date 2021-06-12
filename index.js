const { Plugin } = require('powercord/entities');
const { getModule, FluxDispatcher } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');

/* eslint-disable object-property-newline */
// noinspection JSUnresolvedVariable,JSUnresolvedFunction
module.exports = class FixUnreadChannels extends Plugin {
  async startPlugin () {
    this.loadMessages = this.loadMessages.bind(this);
    this.patchHasUnread();
    FluxDispatcher.subscribe('MESSAGE_DELETE', this.loadMessages);
  }

  pluginWillUnload () {
    uninject('fix-unread-channels');
    FluxDispatcher.unsubscribe('MESSAGE_DELETE', this.loadMessages);
  }

  patchHasUnread () {
    const { getMessages } = getModule([ 'getMessages' ], false);
    const ChannelsStore = getModule([ 'hasUnread' ], false);

    inject('fix-unread-channels', ChannelsStore, 'hasUnread', ([ id ]) => {
      const channel = ChannelsStore.getForDebugging(id);
      const messages = getMessages(id);

      if (channel) {
        const ackTimestamp = channel.getAckTimestamp();

        return !(channel._isThread && !channel._isActiveJoinedThread) && (
          (messages.length) ? messages.last().timestamp.isAfter(ackTimestamp) : ackTimestamp < channel._lastMessageTimestamp
        );
      }
      return false;
    });
  }

  loadMessages ({ channelId }) {
    const { getMessages } = getModule([ 'getMessages' ], false);
    const { fetchMessages } = getModule([ 'fetchMessages' ], false);

    if (!getMessages(channelId).length) {
      fetchMessages({ channelId, limit: 1 });
    }
  }
};


