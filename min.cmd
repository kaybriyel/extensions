@echo off
node merge
uglifyjs merged -c > min && del merged