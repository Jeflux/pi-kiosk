# PI Kiosk for Waveshare displays
Scripts and configuration files for automatically starting a X session with a full screen browser window.

`node-mqtt` contains a node project for controlling the screen brightness of a [Waveshare display](https://www.waveshare.com/product/raspberry-pi/displays.htm) via mqtt (for use with [HomeAssistant](https://github.com/home-assistant) and more).

# Prerequisites

- `chromium-browser` must be installed (default web browser on raspbian)
- It is recommended to use [LightDM](https://github.com/canonical/lightdm): the installation file is setup to install a custom `.desktop` file to use with LightDM.
- [clicklock](https://github.com/zpfvo/clicklock) and [xssstart](https://github.com/unixdj/xssstart) should be used to avoid accidental clicks when interacting with the display when the screen saver is active.
- [Node](https://github.com/nodejs/node) and [NPM](https://github.com/npm) must be installed in order to control the screen brightness if MQTT should be used.

# Installation
Clone this repository to `/opt/kiosk` (or use symlinks) and run 
```
# install.sh
``` 
This will install `kiosk.desktop` to `/usr/share/xsessions` and install the necessary node packages.

Change which web page should be displayed in `kiosk-desktop.sh`

## MQTT
To use MQTT, fill in the necessary settings for your MQTT broker in `kiosk-mqtt/settings.js`

# Caveats
In order to be able to change brightness without running the mqtt client with root privileges the file `/sys/waveshare/rpi_backlight/brightness` must have r/w permissions for all users. This is automatically done on startup and is reverted each reboot.