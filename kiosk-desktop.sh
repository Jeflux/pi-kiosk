#!/bin/bash

./kiosk-startup.sh &

chromium-browser --noerrors --disable-infobars --noerrdialogs --disable-session-crashed-bubble --disable-restore-session-state --kiosk \
ENTER WEBPAGE HERE
