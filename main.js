const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

//Bot stuff

const Discord = require('discord.js'),
    client = new Discord.Client({ ws: { intents: Discord.Intents.ALL } }),
    prefix = "\\",
    roleColorSwitchDelay = 1000,
    fs = require("fs"),
    rainbowRoles = [];
var config, lastSwitch = 0,
    i = 0;

function setup() {
    config = fetchFile("data.json");
    if (config === null) {
        console.error("No configuration file found.");
        process.exit();
    }
    const obj = JSON.parse(config),
        guild = client.guilds.cache.array()[0];
    for (const prop in obj) {
        var role = guild.roles.cache.array().find(r => r.id == obj[prop].role),
            user = client.users.cache.array().find(u => u.id == obj[prop].id);
        if (!role) {
            guild.roles.create({
                data: { name: 'Role', color: '#000000' },
                reason: 'New booster role',
            }).then(r => {
                role = r;
                obj[prop].role = r.id;
            }).catch(e => { console.error(`Couldn't create role, with reason ${e.message}`); });
        }
        rainbowRoles.push(new rainbowRole(role, obj[prop].colors, user, obj[prop].enabled));
    }
    update();
}

client.on("rateLimit", info => {
    console.log(`Rate limit hit ${info.timeDifference ? info.timeDifference : info.timeout ? info.timeout: 'Unknown timeout'}`)
    process.exit(0)
})

function update() {
    const obj = {};
    rainbowRoles.forEach(ele => { obj[ele.user.id] = ele.toJSON(); });
    fs.writeFile("data.json", JSON.stringify(obj, null, 2), err => { if (err) { console.log(`Error writing file: ${err.message}`); } });
}

client.on("message", message => {
  if (!message.guild) {return;}
  if (message.author.id == "697585565809377330") {
    if (message.content == `${prefix}users`) {
      var users = []
      for (var i = 0; i < Object.keys(rainbowRoles).length; i++) {
        users.push(`<@${rainbowRoles[i].user.id}>`);
      }
      const e = new Discord.MessageEmbed()
      .setTitle("Users with roles")
      .setDescription(users)
      message.channel.send(e)
    }
  }
})

client.on("message", m => {

    if (!m.guild || m.author.bot || !m.content.startsWith(prefix)) { return; }
    const args = m.content.slice(prefix.length).split(/ +/g),
        cmd = args.shift(),
        obj = rainbowRoles.find(r => { return r.user.id == m.author.id; });
    if (obj) {
        if (cmd == "activate" || cmd == "deactivate") {
            obj.enabled = (cmd == "activate");
            var e = new Discord.MessageEmbed()
            .setTitle(`Role ${(cmd == "activate") ? "" : "de"}activated!`)
            .setDescription(`Role: <@&${obj.role.id}>\nColors: \`\`\`md\n${obj.colors}\`\`\`\n Note: There will be a \`3\` minute delay every \`5\` color changes to avoid api bans.`)
            m.channel.send(e)
        } else if (cmd == "addcolor") {
          if (args[0] == undefined) {
            m.channel.send("Please provide a colour to add lol")
          } else {
            var e = new Discord.MessageEmbed()
            .setTitle("Adding color")
            .setDescription(obj.addColor(args[0]) ? `Added color ${args[0]}` : `Couldn't add color ${args[0]}, because it is not a valid color`);
            m.channel.send(e)
          }
        } else if (cmd == "removecolor") {
          if (args[0] == undefined) {
            m.channel.send("Please provide a colour to remove lol")
          } else {
            var e = new Discord.MessageEmbed()
            .setTitle("Removing color")
            .setDescription(obj.removeColor(args[0]) ? `Removed color: ${args[0]}` : `Colour ${args[0]} not found`)
            m.channel.send(e);
          }
            var e = new Discord.MessageEmbed()
            .setTitle("Removing color")
            .setDescription(obj.removeColor(args[0]) ? `Removed color: ${args[0]}` : `Colour ${args[0]} not found`)
            m.channel.send(e);
        } else if (cmd == "clearcolors") {
            var colors = obj.colors;
            obj.clearColors();
            var e = new Discord.MessageEmbed()
            .setTitle("Colors cleared")
            .setDescription(`Previous colors: ${colors.join(", ")}`)
            m.channel.send("Colors cleared");
        } else if (cmd == "colors") {
            var e = new Discord.MessageEmbed()
            .setTitle("Your color belt")
            .setDescription(`Role: <@&${obj.role.id}> \nColors: ${obj.colors.join(", ")}`)
            m.channel.send(e);
        } else if (cmd == "changename") {
            obj.role.edit({ name: args[0] });
            var e = new Discord.MessageEmbed()
            .setTitle("Changed Role name")
            .setDescription(`Changed role name to ${args[0]} <@&${obj.role.id}>`)
            m.channel.send(e);
        } else if (cmd == "help") {
            var e = new Discord.MessageEmbed()
            .setTitle("Commands")
            .setDescription(
`
**Your Info**

User: <@${m.author.id}>
Role: <@&${obj.role.id}>
Color Belt: \`${obj.colors.join(", ")}\`

**Commands**

${prefix}help: This command(Arguments: none)
${prefix}changename [name]: Change the name of your role to something else(Arguments: Name)
${prefix}colors: View your color belt(Arguments: None)
${prefix}clearcolors: Clear your color belt to nothing(Arguments: None)
${prefix}removecolor [color]: Remove a hex code from your color belt(Arguments: Hex code in your colors)
${prefix}addcolor [color]: Add a color to your color list(Arguments: Hex code)
${prefix}activate: Start your color changing role(Arguments: None)
${prefix}deactivate: Stop your color changing role(Arguments: None)
`
            )
            .addField(`**A few hex codes**`, `\`\`\`md\n- Red (Hex: #FF0000)\n- Orange (Hex: #FF7F00)\n- Yellow (Hex: #FFFF00)\n- Green (Hex: #00FF00)\n- Blue (Hex: #0000FF)\n- Indigo (Hex: #2E2B5F)\n- Violet (Hex: #8B00FF)\n\`\`\`\nMore [here](https://www.google.com/search?q=color+picker)`)
            m.channel.send(e)
        }
        update();
    }
});

var start = Date.now();
const cooldown = { delay: 180000, cooldown: 60000 };
var changed = [];

function time() {
  var time = new Date().toLocaleString("en-US", {timeZone: "America/Toronto"});
  return time;
}
var delayQ = 0;
var globalTimer = setInterval(function a(){
  if (delayQ <= 5) {
    var changed = [];
    rainbowRoles.forEach(r => { 
      if (r.enabled) { 
        changed.push(r.role.name)
        r.role.edit({ 
          color: r.colors[i % r.colors.length] 
        }); 
      
    }   
  });
    console.clear()
    console.log(`[${delayQ}]\n\nLast role change changed ${changed} \n\n${time()}`)
    delayQ++
    setTimeout(() => { globalTimer = setInterval(a, roleColorSwitchDelay); }, cooldown.cooldown);
    clearInterval(globalTimer);
  } else {
    delayQ = 0
    setTimeout(() => { globalTimer = setInterval(a, cooldown.delay); }, cooldown.delay);
    clearInterval(globalTimer);
    console.clear()
    console.log(`[${delayQ}] \n\nCooldown ended at ${time()}`)
  }
}, roleColorSwitchDelay);

client.once("ready", () => {
    console.clear();
    console.log("Bot Ready!");
    setup();
});

class rainbowRole {
    /**
     * @type {Discord.Role}
     * @readonly
     */
    role;
    /**
     * @type {String[]}
     */
    colors;
    /**
     * @type {Discord.User}
     * @readonly
     */
    user;
    /**
     * @type {Boolean}
     */
    enabled = false;
    constructor(role, colors, user, enabled) {
        this.role = role;
        this.colors = colors;
        this.user = user;
        this.enabled = enabled;
    }
    addColor(color) {
        if (!color.startsWith("#")) {color = `#${color}`}
        if (!/^#[0-9A-F]{6}$/i.test(color)) { return false; }
        this.colors.push(color);
        return true;
    }
    removeColor(value) { 
      if (!value.startsWith("#")) {value = `#${value}`}
      if (this.colors.find(v => { return v /*.toLowerCase()*/ == value /*.toLowerCase()*/ ; })) { this.colors.splice(this.colors.indexOf(value), 1); return true; } }
    clearColors() { this.colors = []; }
    toJSON() {
        return {
            role: this.role.id,
            id: this.user.id,
            colors: this.colors,
            enabled: this.enabled
        }
    }
}

function fetchFile(file) {
    try {
        return fs.readFileSync(file, "utf-8");
    } catch (e) {
        return null;
    }
}

client.login()//Token here
