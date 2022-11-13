#!/bin/bash

# Hack to be able to control brightness without root access in mqtt client
sudo chmod 777 /sys/waveshare/rpi_backlight/brightness &

node /opt/kiosk/kiosk-mqtt/main.js &
xssstart clicklock &

xset s blank
xset s 300

# Make kiosk window full screen
WINDOW_CLASS="chromium-browser"

DIMS=($(xrandr | grep " connected" | awk -F '[[:blank:]\+]+' '{print $3}' | sed "s/x/\n/g"))
WID=$(xdotool search --sync --onlyvisible --class $WINDOW_CLASS | tail -n1)

wmctrl -i -r $WID -e 0,0,0,${DIMS[0]},${DIMS[1]}
