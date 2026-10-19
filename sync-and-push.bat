@echo off
cd /d "%~dp0"
echo Scanning assets/projects folders and updating pages...
node sync.mjs
echo Committing and pushing changes to GitHub...
git add -A
git commit -m "Auto-sync project media and links"
git push origin main
echo Done! Your website will update on GitHub Pages in ~1 minute.
pause
