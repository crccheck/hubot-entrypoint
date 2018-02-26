/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fs       = require('fs');
const path     = require('path');

require('coffee-script/register')
const hubot    = require('hubot');

const defaultOptions = {
  adapter:     process.env.HUBOT_ADAPTER || "shell",
  alias:       process.env.HUBOT_ALIAS   || false,
  enableHttpd: process.env.HUBOT_HTTPD   || true,
  scripts:     process.env.HUBOT_SCRIPTS || [],
  name:        process.env.HUBOT_NAME    || "Hubot",
  path:        process.env.HUBOT_PATH    || ".",
};

module.exports = function (options = defaultOptions) {
  const robot = hubot.loadBot(undefined, options.adapter, options.enableHttpd, options.name, options.alias);

  const loadScripts = function() {
    let scripts;
    let scriptsPath

    robot.load(path.resolve('.', 'scripts'))
    robot.load(path.resolve('.', 'src', 'scripts'))

    const hubotScripts = path.resolve(".", "hubot-scripts.json");
    if (fs.existsSync(hubotScripts)) {
      let hubotScriptsWarning;
      const data = fs.readFileSync(hubotScripts);
      if (data.length > 0) {
        try {
          scripts = JSON.parse(data);
          scriptsPath = path.resolve("node_modules", "hubot-scripts", "src", "scripts");
          robot.loadHubotScripts(scriptsPath, scripts);
        } catch (error) {
          const err = error;
          robot.logger.error(`Error parsing JSON data from hubot-scripts.json: ${err}`);
          process.exit(1);
        }

        hubotScriptsWarning = "Loading scripts from hubot-scripts.json is deprecated and " +
          "will be removed in 3.0 (https://github.com/github/hubot-scripts/issues/1113) " +
          "in favor of packages for each script.\n\n";

        if (scripts.length === 0) {
          hubotScriptsWarning += "Your hubot-scripts.json is empty, so you just need to remove it.";
        } else {
          const hubotScriptsReplacements = path.resolve("node_modules", "hubot-scripts", "replacements.json");

          if (fs.existsSync(hubotScriptsReplacements)) {
            hubotScriptsWarning += "The following scripts have known replacements. Follow the link for installation instructions, then remove it from hubot-scripts.json:\n";

            const replacementsData = fs.readFileSync(hubotScriptsReplacements);
            const replacements = JSON.parse(replacementsData);
            const scriptsWithoutReplacements = [];
            for (var script of Array.from(scripts)) {
              const replacement = replacements[script];
              if (replacement) {
                hubotScriptsWarning += `* ${script}: ${replacement}\n`;
              } else {
                scriptsWithoutReplacements.push(script);
              }
            }
            hubotScriptsWarning += "\n";

            if (scriptsWithoutReplacements.length > 0) {
              hubotScriptsWarning += "The following scripts don't have (known) replacements. You can try searching https://www.npmjs.com/ or http://github.com/search or your favorite search engine. You can copy the script into your local scripts directory, or consider creating a new package to maintain yourself. If you find a replacement or create a package yourself, please post on https://github.com/github/hubot-scripts/issues/1641:\n";
              for (script of Array.from(scriptsWithoutReplacements)) { hubotScriptsWarning += `* ${script}\n`; }

              hubotScriptsWarning += "\nYou an also try updating hubot-scripts to get the latest list of replacements: npm install --save hubot-scripts@latest";
            }
          } else {
              hubotScriptsWarning += "To get a list of recommended replacements, update your hubot-scripts: npm install --save hubot-scripts@latest";
            }
        }
      }

      robot.logger.warning(hubotScriptsWarning);
    }

    const externalScripts = path.resolve(".", "external-scripts.json");
    if (fs.existsSync(externalScripts)) {
      fs.readFile(externalScripts, function(err, data) {
        if (data.length > 0) {
          try {
            scripts = JSON.parse(data);
          } catch (error1) {
            err = error1;
            console.error(`Error parsing JSON data from external-scripts.json: ${err}`);
            process.exit(1);
          }
          return robot.loadExternalScripts(scripts);
        }
      });
    }

    return (() => {
      const result = [];
      for (let scriptPath of Array.from(options.scripts)) {
        if (scriptPath[0] === '/') {
          scriptsPath = scriptPath;
        } else {
          scriptsPath = path.resolve(".", scriptPath);
        }
        result.push(robot.load(scriptsPath));
      }
      return result;
    })();
  };

  return {
    start: () => {
      robot.adapter.once('connected', loadScripts);
      if (process.platform !== "win32") {
        process.on('SIGTERM', () => process.exit(0));
      }
      robot.run();
    }
  }
}
