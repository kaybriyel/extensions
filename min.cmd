@echo off
node merge
uglifyjs merged.js -c -m > min