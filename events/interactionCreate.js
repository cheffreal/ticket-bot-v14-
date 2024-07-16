const { ChannelType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { supportRoles } = require('../config.json');
const fs = require('fs');
const path = require('path');

// Ticket verilerinin saklanacağı dosya ssilme yani buraları mongo bağlantısı yaparsan düzeltirsin
const ticketsFilePath = path.join(__dirname, '../data/tickets.json');

function loadTickets() {
  if (!fs.existsSync(ticketsFilePath)) {
    fs.writeFileSync(ticketsFilePath, JSON.stringify([]));
  }
  const rawData = fs.readFileSync(ticketsFilePath, 'utf8');
  return JSON.parse(rawData);
}

function saveTickets(tickets) {
  fs.writeFileSync(ticketsFilePath, JSON.stringify(tickets, null, 2));
}

const tickets = loadTickets();

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const supportRoleMentions = supportRoles.map(role => `<@&${role}>`).join(', ');

    if (interaction.customId === 'create_ticket') {
      try {
        const ticketChannel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: interaction.user.id,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
            },
            ...supportRoles.map(role => ({
              id: role,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
            })),
          ],
        });

        const newTicket = {
          userID: interaction.user.id,
          channelID: ticketChannel.id,
          createdAt: new Date(),
          status: 'open'
        };

        tickets.push(newTicket);
        saveTickets(tickets);

        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('close_ticket')
              .setLabel('🔒 Talebi Kapat')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId('hold_ticket')
              .setLabel('⏸ Beklemeye Al')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('evaluate_ticket')
              .setLabel('📝 Değerlendirmeye Alındı')
              .setStyle(ButtonStyle.Primary),
          );

        await ticketChannel.send({
          content: `Merhaba ${interaction.user}, destek talebiniz oluşturuldu. ${supportRoleMentions} Size nasıl yardımcı olabiliriz?`,
          components: [row]
        });
        await interaction.reply({ content: 'Destek talebiniz başarıyla oluşturuldu.', ephemeral: true });
      } catch (error) {
        console.error('Ticket oluşturulurken hata oluştu:', error);
        await interaction.reply({ content: 'Bir hata oluştu, lütfen daha sonra tekrar deneyin.', ephemeral: true });
      }
    }

    if (interaction.customId === 'close_ticket') {
      try {
        const ticket = tickets.find(ticket => ticket.channelID === interaction.channel.id);
        if (!ticket) return interaction.reply({ content: 'Bu kanala ait bir destek talebi bulunamadı.', ephemeral: true });

        ticket.status = 'closed';
        saveTickets(tickets);

        await interaction.channel.send('🔒 Destek talebi kapatıldı.');
        await interaction.channel.delete();
      } catch (error) {
        console.error('Ticket kapatılırken hata oluştu:', error);
        await interaction.reply({ content: 'Bir hata oluştu, lütfen daha sonra tekrar deneyin.', ephemeral: true });
      }
    }

    if (interaction.customId === 'hold_ticket') {
      try {
        const ticket = tickets.find(ticket => ticket.channelID === interaction.channel.id);
        if (!ticket) return interaction.reply({ content: 'Bu kanala ait bir destek talebi bulunamadı.', ephemeral: true });

        ticket.status = 'on hold';
        saveTickets(tickets);

        await interaction.reply({ content: 'Bu destek talebi beklemeye alındı.', ephemeral: true });
        await interaction.channel.send('🛑 Bu destek talebi beklemeye alındı.');
      } catch (error) {
        console.error('Ticket beklemeye alınırken hata oluştu:', error);
        await interaction.reply({ content: 'Bir hata oluştu, lütfen daha sonra tekrar deneyin.', ephemeral: true });
      }
    }

    if (interaction.customId === 'evaluate_ticket') {
      try {
        const ticket = tickets.find(ticket => ticket.channelID === interaction.channel.id);
        if (!ticket) return interaction.reply({ content: 'Bu kanala ait bir destek talebi bulunamadı.', ephemeral: true });

        ticket.status = 'evaluating';
        saveTickets(tickets);

        await interaction.reply({ content: 'Bu destek talebi değerlendirmeye alındı.', ephemeral: true });
        await interaction.channel.send('🔍 Bu destek talebi değerlendirmeye alındı.');
      } catch (error) {
        console.error('Ticket değerlendirmeye alınırken hata oluştu:', error);
        await interaction.reply({ content: 'Bir hata oluştu, lütfen daha sonra tekrar deneyin.', ephemeral: true });
      }
    }
  },
};
