@echo off
node merge
uglifyjs merged -c -m > min && del merged