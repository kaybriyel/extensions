@echo off
node merge
uglifyjs merged -m > min && del merged