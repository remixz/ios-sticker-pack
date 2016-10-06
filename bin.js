#!/usr/bin/env node
const methods = require('./')
const argv = require('yargs')
  .usage('Usage: ios-sticker-pack <command> [options]')
  .command('create', 'Creates a sticker pack app using the images inside the current folder (must be .png, .gif, or .jpg)')
  .command('update', 'Updates stickers using the images inside the current folder (must be .png, .gif, or .jpg)')
  .command('deploy', 'Deploys the sticker pack to the connected device')
  .demand(1, '')
  .strict()
  .help()
  .alias('h', 'help')
  .version()
  .alias('v', 'version')
  .recommendCommands()
  .argv

const command = argv._[0]
methods[command](argv)
