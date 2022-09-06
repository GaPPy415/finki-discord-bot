import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder
} from 'discord.js';
import { client } from '../src/client.js';
import {
  getFromBotConfig,
  getFromRoleConfig
} from '../src/config.js';
import { logger } from '../src/logger.js';

const [channelID, newlines] = process.argv.slice(2);

if (channelID === undefined) {
  throw new Error('Missing channel ID argument');
}

await client.login(getFromBotConfig('token'));

client.once('ready', async () => {
  logger.info('Bot is ready');

  const channel = client.channels.cache.get(channelID);
  const roles = getFromRoleConfig('program');

  if (channel === undefined || channel.type !== ChannelType.GuildText) {
    throw new Error('The provided channel must be a guild text channel');
  }

  if (roles === undefined || roles.length === 0) {
    throw new Error('No program roles have been provided');
  }

  const components: ActionRowBuilder<ButtonBuilder>[] = [];
  const embed = new EmbedBuilder()
    .setColor(getFromBotConfig('color'))
    .setTitle('Смер')
    .setDescription('Изберете го смерот на кој студирате.')
    .setFooter({ text: '(може да изберете само една опција)' });

  for (let i = 0; i < roles.length; i += 5) {
    const row = new ActionRowBuilder<ButtonBuilder>();
    const buttons: ButtonBuilder[] = [];

    for (let j = i; j < i + 5; j++) {
      if (roles[j] === undefined) {
        break;
      }

      const button = new ButtonBuilder()
        .setCustomId(`program:${roles[j] ?? ''}`)
        .setLabel(roles[j] ?? '')
        .setStyle(ButtonStyle.Secondary);

      buttons.push(button);
    }

    row.addComponents(buttons);
    components.push(row);
  }

  try {
    await channel.send({
      components,
      content: newlines === undefined || Number.isNaN(newlines) ? null : Array.from<string>({ length: Number.parseInt(newlines) + 1 }).fill('_ _', 0, -1).join('\n'),
      embeds: [embed]
    });
  } catch (error) {
    throw new Error(`Failed to send embed\n${error}`);
  }

  logger.info('Done');
  client.destroy();
});