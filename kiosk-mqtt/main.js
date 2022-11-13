const mqtt = require("mqtt")
const settings = require("./settings.js")
const client  = mqtt.connect(settings.mqtt.mqtt_uri, { username: settings.mqtt.username, password: settings.mqtt.password })
const { exec } = require("child_process");
const storage = require("node-persist")

const devMode = false

var connected = false

const commandTopic = "/homeassistant/kiosk/display/set"
const stateTopic = "/homeassistant/kiosk/display/status"
const brightnessTopic = "/homeassistant/kiosk/display/brightness"
const brightnessStateTopic = "/homeassistant/kiosk/display/brightnessStatus"

const backlightPath = "/sys/waveshare/rpi_backlight/brightness"

const previousBacklightStorageKey = "previousBacklight"
let previousBrightness = 0

function execute(command, ignoreError = false) {
  if (devMode) {
    return new Promise((resolve, reject) => {
      console.log(`Running ${command}`)
      setTimeout(() => {
        resolve(Math.random() * 255)
      }, 500);
    })
  }

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error && !ignoreError) {
        console.log(`error: ${error.message}`)
      }
      if (stderr && !ignoreError) {
        console.log(`stderr: ${stderr}`)
      }

      resolve(stdout? stdout : stderr)
    });
  })
}

async function setScreenBrightness(level) {
  await execute(`echo ${255 - Math.min(Math.max(0, level), 255)} > ${backlightPath}`)
}

async function killClicklock() {
  await execute("pkill clicklock")
}

async function unblankScreen() {
  await execute("DISPLAY=:0 xset dpms force on")
}

async function activateDisplay() {
  if (await isClickLockRunning()) {
    await killClicklock()
  }
  await unblankScreen()
}

async function blankScreen() {
  await execute("DISPLAY=:0 xset s activate")
}

async function isClickLockRunning() {
  return (await execute("pgrep clicklock", true)) !== ""
}

async function isScreenBlanked() {
  return await isClickLockRunning()
}

async function reportBrightness() {
  client.publish(stateTopic, await isScreenBlanked() ? "OFF" : "ON")
  client.publish(brightnessStateTopic, `${previousBrightness}`)
}

client.on('connect', function () {
  connected = true

  client.publish(
    "homeassistant/kiosk/display/config",
    JSON.stringify({
      name: "Kiosk Display",
      command_topic: commandTopic,
      state_topic: stateTopic,
      brightness_command_topic: brightnessTopic,
      brightness_scale: 255,
      brightness_state_topic: brightnessStateTopic,
      icon: "mdi:monitor-small",
      payload_on: "ON",
      payload_off: "OFF",
      optimistic: false
    }))

  client.subscribe(commandTopic)
  client.subscribe(brightnessTopic)
})

client.on('message', async function (topic, message) {
  switch (topic) {
    case brightnessTopic:
      await activateDisplay()
      await setScreenBrightness(Number.parseInt(message.toString()))
      previousBrightness = Number.parseInt(message.toString())
      reportBrightness()
      break;
    case commandTopic:
      if (message.toString() === "OFF") {
        await blankScreen()
        reportBrightness()
        break;
      }
      if (message.toString() === "ON") { // Need to check on explicitly since command_topic is sent on brightness as well
        await activateDisplay()
        await setScreenBrightness(previousBrightness)
        reportBrightness()
        break;
      }
  }
})


async function tick() {
  if (!connected)
    return;

  if (await storage.getItem(previousBacklightStorageKey) !== previousBrightness) {
    await storage.setItem(previousBacklightStorageKey, previousBrightness)
  }

  // Safety for when activating display via touch: we don't get any call backs to report brightness when that happens
  reportBrightness()
}

async function main() {
  await storage.init()
  previousBrightness = await storage.getItem(previousBacklightStorageKey)

  if (!isScreenBlanked()) {
    setScreenBrightness(previousBrightness)
  }

  reportBrightness()

  setInterval(tick, 3000);
}

main()