import { logger } from '../utils/logger.js';
import { commands } from '../utils/strings.js';
import {
  type Channel,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  type PermissionsBitField,
  SlashCommandBuilder
} from 'discord.js';

const name = 'embed';
const permission = PermissionFlagsBits.ManageMessages;

export const data = new SlashCommandBuilder()
  .setName(name)
  .setDescription(commands[name])
  .addChannelOption((option) => option
    .setName('channel')
    .setDescription('The channel to send the embed to')
    .setRequired(true))
  .addStringOption((option) => option
    .setName('json')
    .setDescription('Embed JSON')
    .setRequired(true))
  .addBooleanOption((option) => option
    .setName('timestamp')
    .setDescription('Whether to add a timestamp to the embed')
    .setRequired(false))
  .setDefaultMemberPermissions(permission);

export async function execute (interaction: ChatInputCommandInteraction) {
  const permissions = interaction.member?.permissions as PermissionsBitField | undefined;
  if (permissions === undefined || !permissions.has(permission)) {
    await interaction.editReply('Оваа команда е само за администратори.');
    return;
  }

  const channel = interaction.options.getChannel('channel', true) as Channel;
  const json = interaction.options.getString('json', true);
  const timestamp = interaction.options.getBoolean('timestamp') ?? false;

  if (!channel.isTextBased() || channel.isDMBased()) {
    await interaction.editReply('Невалиден канал.');
    return;
  }

  const parsed = JSON.parse(json);
  const embed = EmbedBuilder.from(parsed);

  if (timestamp) {
    embed.setTimestamp();
  }

  try {
    if (parsed.color !== undefined) {
      embed.setColor(parsed.color);
    }
  } catch {
    await interaction.editReply('Невалидна боја.');
    return;
  }

  try {
    await channel.send({ embeds: [embed] });

    await interaction.editReply('Креиран е embed.');
  } catch (error) {
    logger.error(`Error sending embed\n${error}`);

    await interaction.editReply('Креирањето embed беше неуспешно.');
  }
}