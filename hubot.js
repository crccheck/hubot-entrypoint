// Stripped down version of https://github.com/hubotio/hubot/blob/master/bin/hubot.js
const fs       = require('fs');
const pathResolve = require('path').resolve

const hubot    = require('hubot');

const defaultOptions = {
  adapter: process.env.HUBOT_ADAPTER || 'shell',
  alias: process.env.HUBOT_ALIAS || false,
  enableHttpd: process.env.HUBOT_HTTPD || true,
  scripts: process.env.HUBOT_SCRIPTS || [],
  name: process.env.HUBOT_NAME || 'Hubot',
  path: process.env.HUBOT_PATH || '.',
}

module.exports = function (options = {}) {
  options = {...defaultOptions, ...options}

  const robot = hubot.loadBot(undefined, options.adapter, options.enableHttpd, options.name, options.alias)

  function loadHubotScripts () {
    const hubotScripts = pathResolve('.', 'hubot-scripts.json')
    let scripts
    let scriptsPath

    if (fs.existsSync(hubotScripts)) {
      let hubotScriptsWarning
      const data = fs.readFileSync(hubotScripts)

      if (data.length === 0) {
        return
      }

      try {
        scripts = JSON.parse(data)
        scriptsPath = pathResolve('node_modules', 'hubot-scripts', 'src', 'scripts')
        robot.loadHubotScripts(scriptsPath, scripts)
      } catch (error) {
        const err = error
        robot.logger.error(`Error parsing JSON data from hubot-scripts.json: ${err}`)
        process.exit(1)
      }

      hubotScriptsWarning = 'Loading scripts from hubot-scripts.json is deprecated and ' + 'will be removed in 3.0 (https://github.com/github/hubot-scripts/issues/1113) ' + 'in favor of packages for each script.\n\n'

      if (scripts.length === 0) {
        hubotScriptsWarning += 'Your hubot-scripts.json is empty, so you just need to remove it.'
        return robot.logger.warning(hubotScriptsWarning)
      }

      const hubotScriptsReplacements = pathResolve('node_modules', 'hubot-scripts', 'replacements.json')
      const replacementsData = fs.readFileSync(hubotScriptsReplacements)
      const replacements = JSON.parse(replacementsData)
      const scriptsWithoutReplacements = []

      if (!fs.existsSync(hubotScriptsReplacements)) {
        hubotScriptsWarning += 'To get a list of recommended replacements, update your hubot-scripts: npm install --save hubot-scripts@latest'
        return robot.logger.warning(hubotScriptsWarning)
      }

      hubotScriptsWarning += 'The following scripts have known replacements. Follow the link for installation instructions, then remove it from hubot-scripts.json:\n'

      scripts.forEach((script) => {
        const replacement = replacements[script]

        if (replacement) {
          hubotScriptsWarning += `* ${script}: ${replacement}\n`
        } else {
          scriptsWithoutReplacements.push(script)
        }
      })

      hubotScriptsWarning += '\n'

      if (scriptsWithoutReplacements.length > 0) {
        hubotScriptsWarning += 'The following scripts don’t have (known) replacements. You can try searching https://www.npmjs.com/ or http://github.com/search or your favorite search engine. You can copy the script into your local scripts directory, or consider creating a new package to maintain yourself. If you find a replacement or create a package yourself, please post on https://github.com/github/hubot-scripts/issues/1641:\n'
        hubotScriptsWarning += scriptsWithoutReplacements.map((script) => `* ${script}\n`).join('')
        hubotScriptsWarning += '\nYou an also try updating hubot-scripts to get the latest list of replacements: npm install --save hubot-scripts@latest'
      }

      robot.logger.warning(hubotScriptsWarning)
    }
  }

  function loadExternalScripts () {
    const externalScripts = pathResolve('.', 'external-scripts.json')

    if (!fs.existsSync(externalScripts)) {
      return
    }

    fs.readFile(externalScripts, function (error, data) {
      if (error) {
        throw error
      }

      try {
        robot.loadExternalScripts(JSON.parse(data))
      } catch (error) {
        console.error(`Error parsing JSON data from external-scripts.json: ${error}`)
        process.exit(1)
      }
    })
  }

  function loadScripts () {
    robot.load(pathResolve('.', 'scripts'))
    robot.load(pathResolve('.', 'src', 'scripts'))

    loadHubotScripts()
    loadExternalScripts()

    options.scripts.forEach((scriptPath) => {
      if (scriptPath[0] === '/') {
        return robot.load(scriptPath)
      }

      robot.load(pathResolve('.', scriptPath))
    })
  }

  return {
    start: () => {
      robot.adapter.once('connected', loadScripts)
      if (process.platform !== 'win32') {
        process.on('SIGTERM', () => process.exit(0))
      }
      robot.run()
      return robot
    }
  }
}
