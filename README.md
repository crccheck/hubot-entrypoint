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

### `robot`

`.start()` returns `robot`. So if you need to do some tweaks outside scripts,
you can. For example:

```
...
const robot = bot.start()
robot.router.get('/robots.txt', (request, response) => {
  response.send('User-agent: *\nDisallow: /')
})
```


Additional reading
------------------

* [Allow programmatic launching of hubot](https://github.com/hubotio/hubot/issues/858)
