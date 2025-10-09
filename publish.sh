#!/bin/bash

cd /media/mahdi/D-drive/.web2

git add .
git commit -m "New post: $(date '+%Y-%m-%d %H:%M:%S')"
git push origin main
