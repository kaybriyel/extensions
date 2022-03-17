@echo off
<<<<<<< HEAD
del min.js
rename min min.js
=======
node merge
uglifyjs merged.js -c -m > min
>>>>>>> 9dc5ebc43d497aad343b628f4fb92f9759e5c679
