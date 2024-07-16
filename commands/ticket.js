const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'ticket',
  description: 'Destek talebi oluştur',
  async execute(message, args) {
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('create_ticket')
          .setLabel('🎫 Destek Talebi Oluştur')
          .setStyle(ButtonStyle.Primary),
      );

    await message.channel.send({ content: 'Destek talebi oluşturmak için aşağıdaki butona tıklayın.', components: [row] });
  },
};
