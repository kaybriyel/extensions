@echo off
uglifyjs background.js -c -m > background.min && uglifyjs foreground.js -c -m > foreground.min && uglifyjs socket.js -c -m > socket.min