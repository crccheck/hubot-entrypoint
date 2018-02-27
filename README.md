Hubot Entrypoint
================

Start Hubot with `require`.

Currently, the only way to start Hubot is from the command line. But there may
be times you need to start Hubot from another Node script.


Quick start
-----------

```
const hubotEntrypoint = require('hubot-entrypoint')

const bot = hubotEntrypoint()

bot.start()
```


### Options

The options you would normally pass on the command line can be passed in too:

```
const hubotEntrypoint = require('hubot-entrypoint')

const bot = hubotEntrypoint({
  adapter: 'slack',
  name: 'Huboto',
})

bot.start()
```
