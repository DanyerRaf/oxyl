const Oxyl = require("./oxyl.js"),
	fs = require("fs"),
	yaml = require("js-yaml"),
	path = require("path");

exports.config = yaml.safeLoad(fs.readFileSync("./private/config.yml"));
exports.defaultConfig = fs.readFileSync("./private/default-config.yml");
exports.commands = Oxyl.commands;
exports.registerCommand = Oxyl.registerCommand;

exports.getCmd = (msgCase) => {
	let msg = msgCase.toLowerCase();
	let commands = Oxyl.commands;
	let prefix = exports.config.options.prefixRegex;
	let returnData = {};
	for(let cmdType in commands) {
		for(let cmd in commands[cmdType]) {
			cmd = commands[cmdType][cmd];
			let possibleStarts = cmd.aliases.slice(0);
			possibleStarts.push(cmd.name);

			for(let i in possibleStarts) {
				let loopCmd = possibleStarts[i];
				if(msg.startsWith(loopCmd)) {
					returnData = {
						newContent: msgCase.substring(loopCmd.length, msg.length).trim(),
						cmd: cmd
					};
				}
			}
		}
	}
	return returnData;
};

exports.findCommand = (cmdSearch) => {
	let commands = Oxyl.commands;
	for(let cmdType in commands) {
		for(let cmd in commands[cmdType]) {
			cmd = commands[cmdType][cmd];
			let possibleStarts = cmd.aliases.slice(0);
			possibleStarts.push(cmd.name);

			if(possibleStarts.includes(cmdSearch)) return cmd;
		}
	}
	return false;
};

exports.formatDate = (toFormat) => {
	var date = new Date(toFormat);
	var months = ["January", "February", "March", "April", "May", "June", "July",
		"August", "September", "October", "November", "Decemeber"];
	var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

	var month = months[date.getMonth()];
	var day = date.getDate();
	var weekday = weekdays[date.getDay()];
	var hour = date.getHours();
	var min = date.getMinutes();
	var sec = date.getSeconds();
	var year = date.getFullYear();

	day = (day < 10 ? "0" : "") + day;
	hour = (hour < 10 ? "0" : "") + hour;
	min = (min < 10 ? "0" : "") + min;
	sec = (sec < 10 ? "0" : "") + sec;

	return `${weekday}, ${month} ${day} ${year}, ${hour}:${min}:${sec}`;
};

exports.capitalizeEveryFirst = (string) => string.split(" ").map(str => str.charAt(0).toUpperCase() + str.slice(1)).join(" ");

exports.codeBlock = (content, lang) => {
	if(!lang) lang = "";
	return `\n\`\`\`${lang}\n${content}\n\`\`\``;
};

exports.unmention = (user) => `${user.username}#${user.discriminator}`;

exports.consoleLog = (message, type) => {
	var channel;
	if(type === "important") {
		type = "!";
		channel = "important";
	} else if(type === "command" || type === "cmd") {
		channel = "commands";
		type = "cmds";
	} else if(type === "debug") {
		channel = "debug";
	}
	channel = exports.config.channels[channel];
	channel = Oxyl.bot.channels.get(channel);
	console.log(`[${type.toUpperCase()}] ${message}`);
	if(channel) channel.sendMessage(message);
};

exports.findFile = (dirs, name, ext) => {
	let fileName, dirName;
	for(var i = 0; i < dirs.length; i++) {
		var files = exports.getFiles(dirs[i]);

		if(ext) {
			fileName = files.find(file => file.substring(file.lastIndexOf("/") + 1).toLowerCase() === `${name}.${ext}`);
		} else {
			fileName = files.find(file => file.substring(file.lastIndexOf("/") + 1, file.lastIndexOf(".")).toLowerCase() === `${name}`);
		}

		if(fileName) {
			dirName = fileName.substring(0, fileName.lastIndexOf("/") + 1);
			fileName = fileName.substring(fileName.lastIndexOf("/") + 1);
			break;
		}
	}
	if(!dirName && !fileName) {
		return false;
	} else {
		return [dirName, fileName];
	}
};

exports.getFiles = (filePath) => {
	var dirFiles = fs.readdirSync(filePath);
	let fullFiles = [];
	dirFiles.forEach(file => {
		var stats = fs.lstatSync(`${filePath}${file}`);
		if(stats.isDirectory()) {
			let toAdd = exports.getFiles(`${filePath}${file}/`);
			fullFiles = fullFiles.concat(toAdd);
		} else {
			fullFiles.push(`${filePath}${file}`);
		}
	});
	return fullFiles;
};

exports.loadScripts = (filePath) => {
	exports.consoleLog(`Loading all scripts at ${filePath}`, "debug");
	var dirFiles = exports.getFiles(filePath);
	for(var i in dirFiles) {
		exports.loadScript(dirFiles[i]);
	}
};

exports.loadScript = (scriptPath, reload) => {
	if(reload) {
		let script = path.resolve(scriptPath);
		delete require.cache[require.resolve(script)];

		exports.consoleLog(`Reloaded script at ${scriptPath}`, "debug");
	}
	require(scriptPath);
};

exports.listConstructor = (obj, index, follower) => {
	var msg = "", objSize = obj.length - 1;
	for(var i = 0; i <= objSize; i++) {
		var value = obj[i];
		let addFollower = true;
		let toAdd = "", constructor = "";

		if(index && index > 0) {
			if(follower) {
				constructor = "  ".repeat(index);
				// Gets the perfect spacing
			} else {
				constructor = "║".repeat(index);
				addFollower = false;
			}
		} else {
			index = 0;
		} if(i === objSize || (Array.isArray(obj[objSize]) && i === objSize - 1)) {
			constructor += "╚";
		} else {
			constructor += "╠";
			addFollower = false;
		}

		if(Array.isArray(value)) {
			toAdd = exports.listConstructor(value, index + 1, addFollower);
		} else {
			constructor = constructor.split("").join(" ");
			toAdd = `\n **${constructor}** ${value}`;
		}

		msg += toAdd;
	}
	return msg;
};