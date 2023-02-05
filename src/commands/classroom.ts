import { getClassrooms } from '../utils/config.js';
import { getClassroomEmbed } from '../utils/embeds.js';
import { commands } from '../utils/strings.js';
import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder
} from 'discord.js';

const name = 'classroom';

export const data = new SlashCommandBuilder()
  .setName(name)
  .setDescription(commands[name])
  .addStringOption((option) => option
    .setName('classroom')
    .setDescription('Classroom')
    .setRequired(true)
    .setAutocomplete(true));

export async function execute (interaction: ChatInputCommandInteraction) {
  const classroom = interaction.options.getString('classroom', true);
  const information = getClassrooms().find((c) => c.classroom.toString().toLowerCase() === classroom.toLowerCase());

  if (information === undefined) {
    await interaction.editReply('Не постои таа просторија.');
    return;
  }

  const embed = getClassroomEmbed(information);
  await interaction.editReply({ embeds: [embed] });
}