@echo off
uglifyjs background.js -c -m > background.min.js && uglifyjs frontground.js -c -m > frontground.min.js