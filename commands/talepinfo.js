const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Ticket verilerinin saklanacağı dosya burası silme mongo yaparsan düzeltirsin
const ticketsFilePath = path.join(__dirname, '../data/tickets.json');

function loadTickets() {
  if (!fs.existsSync(ticketsFilePath)) {
    fs.writeFileSync(ticketsFilePath, JSON.stringify([]));
  }
  const rawData = fs.readFileSync(ticketsFilePath, 'utf8');
  return JSON.parse(rawData);
}

module.exports = {
  name: 'talepinfo',
  description: 'Tüm ticket taleplerinin bilgilerini gösterir',
  async execute(message, args) {
    const tickets = loadTickets();
    
    if (tickets.length === 0) {
      return message.reply('Henüz kayıtlı bir ticket yok.');
    }

    const embed = new EmbedBuilder()
      .setTitle('Ticket Bilgileri')
      .setColor('#0099ff')
      .setDescription('Tüm ticket taleplerinin detaylı bilgileri');

    tickets.forEach(ticket => {
      embed.addFields(
        { name: 'Kullanıcı', value: `<@${ticket.userID}>`, inline: true },
        { name: 'Kanal', value: `<#${ticket.channelID}>`, inline: true },
        { name: 'Oluşturulma Tarihi', value: new Date(ticket.createdAt).toLocaleString(), inline: true },
        { name: 'Durum', value: ticket.status, inline: true }
      );
    });

    await message.channel.send({ embeds: [embed] });
  },
};
