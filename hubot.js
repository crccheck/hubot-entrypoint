/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const Hubot    = require('hubot');

const Fs       = require('fs');
const Path     = require('path');

const Options = {
  adapter:     process.env.HUBOT_ADAPTER || "shell",
  alias:       process.env.HUBOT_ALIAS   || false,
  enableHttpd: process.env.HUBOT_HTTPD   || true,
  scripts:     process.env.HUBOT_SCRIPTS || [],
  name:        process.env.HUBOT_NAME    || "Hubot",
  path:        process.env.HUBOT_PATH    || ".",
};

if (process.platform !== "win32") {
  process.on('SIGTERM', () => process.exit(0));
}

if (true) {
  const robot = Hubot.loadBot(undefined, Options.adapter, Options.enableHttpd, Options.name, Options.alias);

  const loadScripts = function() {
    let scripts;
    let scriptsPath = Path.resolve(".", "scripts");
    robot.load(scriptsPath);

    scriptsPath = Path.resolve(".", "src", "scripts");
    robot.load(scriptsPath);

    const hubotScripts = Path.resolve(".", "hubot-scripts.json");
    if (Fs.existsSync(hubotScripts)) {
      let hubotScriptsWarning;
      const data = Fs.readFileSync(hubotScripts);
      if (data.length > 0) {
        try {
          scripts = JSON.parse(data);
          scriptsPath = Path.resolve("node_modules", "hubot-scripts", "src", "scripts");
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
          const hubotScriptsReplacements = Path.resolve("node_modules", "hubot-scripts", "replacements.json");

          if (Fs.existsSync(hubotScriptsReplacements)) {
            hubotScriptsWarning += "The following scripts have known replacements. Follow the link for installation instructions, then remove it from hubot-scripts.json:\n";

            const replacementsData = Fs.readFileSync(hubotScriptsReplacements);
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

    const externalScripts = Path.resolve(".", "external-scripts.json");
    if (Fs.existsSync(externalScripts)) {
      Fs.readFile(externalScripts, function(err, data) {
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
      for (let path of Array.from(Options.scripts)) {
        if (path[0] === '/') {
          scriptsPath = path;
        } else {
          scriptsPath = Path.resolve(".", path);
        }
        result.push(robot.load(scriptsPath));
      }
      return result;
    })();
  };

  robot.adapter.once('connected', loadScripts);

  robot.run();
}
