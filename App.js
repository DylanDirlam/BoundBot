const Discord = require('discord.js')
const Client = new Discord.Client()
const { DateTime } = require('luxon')
const Schedule = require('node-schedule')
require('dotenv').config()
process.on('unhandledRejection', (reason, p) => {
  console.log(
    `${DateTime.local()}: Unhandled Rejection at: Promise`,
    p,
    'reason:',
    reason,
  )
})

// Startup Code once bot is loaded
Client.on('ready', async () => {
  Client.user.setActivity(`with ${await GetRandomRaider()}`)
  console.log('Bot loaded.')
})

// Message events
Client.on('message', async (msg) => {
  if (msg.channel.name !== 'guild-apps' || !msg.embeds.length) return
  if (msg.author === Client.user) return
  console.log(`${DateTime.local()} New application received`)
  const Embeds = msg.embeds[0].fields
  const NewEmbed = new Discord.MessageEmbed()
    .setColor('#2bd95c')
    .setTitle('New Application Received')
    .addFields(Embeds)
    .setTimestamp()
    .setFooter('Bound Bot')
  const CharName = Embeds[0].value
  const ChannelName = `${DateTime.local().toFormat(`LL-dd`)}-${CharName}`
  msg.guild.channels
    .create(ChannelName, {
      type: 'text',
      parent: msg.channel.parent,
    })
    .then((NewChannel) => {
      NewChannel.send(NewEmbed).then((AppMessage) => {
        AppMessage.react(814199672574574662)
        AppMessage.react('📈')
      })
      console.log(`${DateTime.local()} Creating ${NewChannel.name}`)
    })
})

Client.on('guildCreate', async (guild) => {
  console.log(
    `Bot has joined new server: ${guild.name} - Owned by: ${guild.owner.user.tag} (${guild.ownerID})`,
  )
})

Client.on('guildDelete', async (guild) => {
  if (!guild.available) return
  console.log(
    `Bot has left server: ${guild.name} - Owned by: ${guild.owner.user.tag} (${guild.ownerID})`,
  )
})

// Daily check for old channels to remove
Schedule.scheduleJob({ hour: 6, minute: 0 }, () => {
  CheckChannels()
})
setInterval(async function () {
  Client.user.setActivity(`with ${await GetRandomRaider()}`)
}, 600000)

async function CheckChannels() {
  const ChannelDuration = 7 // Days to keep the channel alive
  const DateToCheck = DateTime.local()
    .minus({ days: ChannelDuration })
    .toFormat('LL-dd')
  const DateToRemind = DateTime.local()
    .minus({ days: ChannelDuration - 1 })
    .toFormat('LL-dd')
  const ServerToCheck = await Client.guilds.cache.find(
    (guild) => guild.id === process.env.SERVER_ID,
  )
  const CategoryToCheck = await ServerToCheck.channels.cache.find(
    (channel) => channel.name === 'Applications' && channel.type === 'category',
  )
  CategoryToCheck.children.forEach((channel) => {
    if (channel.name.startsWith(DateToCheck)) {
      // Delete channel
      console.log(`${DateTime.local()} Deleting ${channel.name}`)
      channel.delete()
    }
    if (channel.name.startsWith(DateToRemind)) {
      // Remind of channel deletion
      console.log(`${DateTime.local()} Reminding ${channel.name}`)
      channel.send('❗ Reminder: This channel will be removed in 1 day.')
    }
  })
}

async function GetRandomRaider() {
  const ServerToCheck = await Client.guilds.cache.find(
    (guild) => guild.id === process.env.SERVER_ID,
  )
  const Raiders = ServerToCheck.members.cache.filter((member) =>
    member.roles.cache.find((role) => role.name === 'Raider'),
  )
  return Raiders.random().displayName
}

Client.login(process.env.BOT_TOKEN)
