import { getTicketCloseComponents } from '../components/tickets.js';
import { logMessageFunctions } from '../translations/logs.js';
import {
  ticketMessageFunctions,
  ticketMessages,
} from '../translations/tickets.js';
import { type TicketType } from '../types/TicketType.js';
import { getChannel } from './channels.js';
import { getChannelProperty, getConfigProperty } from './config.js';
import { getGuild } from './guild.js';
import { logger } from './logger.js';
import {
  type AnyThreadChannel,
  type ButtonInteraction,
  ChannelType,
  type ChatInputCommandInteraction,
  roleMention,
  ThreadAutoArchiveDuration,
} from 'discord.js';
import { setTimeout } from 'node:timers/promises';

export const getActiveTickets = async (
  interaction?: ChatInputCommandInteraction,
) => {
  const guild = await getGuild(interaction);
  const ticketsChannel = await getChannelProperty('tickets');

  const threads = guild?.channels.cache.filter(
    (channel): channel is AnyThreadChannel =>
      channel.isThread() &&
      channel.parentId === ticketsChannel &&
      !channel.archived &&
      !channel.locked,
  );

  return threads;
};

export const createTicket = async (
  interaction: ButtonInteraction | ChatInputCommandInteraction,
  ticketMetadata: TicketType,
) => {
  const ticketsChannel = getChannel('tickets');

  if (
    ticketsChannel === undefined ||
    ticketsChannel.type !== ChannelType.GuildText
  ) {
    return;
  }

  const ticketChannel = await ticketsChannel.threads.create({
    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
    invitable: false,
    name: `${interaction.user.tag} - ${ticketMetadata.name}`,
    type: ChannelType.PrivateThread,
  });

  await ticketChannel.send(
    ticketMessageFunctions.ticketCreated(interaction.user.id),
  );

  const components = getTicketCloseComponents(ticketChannel.id);
  await ticketChannel.send({
    components,
    content: ticketMessages.sendMessage,
  });

  await interaction.reply({
    content: ticketMessageFunctions.ticketLink(ticketChannel.url),
    ephemeral: true,
  });

  const collector = ticketChannel.createMessageCollector({
    time: 1_800_000,
  });

  collector.once('collect', async () => {
    await ticketChannel.send(
      ticketMessageFunctions.ticketStarted(
        ticketMetadata.roles.map((role) => roleMention(role)).join(' '),
      ),
    );

    collector.stop();
  });

  collector.on('end', async (messages) => {
    if (messages.size > 0) {
      return;
    }

    await ticketChannel.delete();
  });
};

export const closeTicket = async (ticketId: string) => {
  const ticketsChannel = getChannel('tickets');

  if (
    ticketsChannel === undefined ||
    ticketsChannel.type !== ChannelType.GuildText
  ) {
    return;
  }

  const ticketChannel = ticketsChannel.threads.cache.get(ticketId);

  if (ticketChannel === undefined) {
    return;
  }

  await ticketChannel.setLocked(true);
  await ticketChannel.setArchived(true);

  logger.info(logMessageFunctions.closedTicket(ticketId));
};

export const closeInactiveTickets = async () => {
  while (true) {
    const maxTicketInactivityDays = await getConfigProperty(
      'maxTicketInactivityDays',
    );
    const maxTicketInactivityMilliseconds =
      maxTicketInactivityDays * 86_400_000;

    const ticketThreads = await getActiveTickets();

    if (ticketThreads === undefined || ticketThreads.size === 0) {
      await setTimeout(900_000);
      continue;
    }

    for (const thread of ticketThreads.values()) {
      await thread.messages.fetch();
      const lastMessage = thread.lastMessage;

      if (lastMessage === null) {
        continue;
      }

      const lastMessageDate = lastMessage.createdAt;

      if (
        Date.now() - lastMessageDate.getTime() >
        maxTicketInactivityMilliseconds
      ) {
        await closeTicket(thread.id);
      }
    }

    await setTimeout(900_000);
  }
};