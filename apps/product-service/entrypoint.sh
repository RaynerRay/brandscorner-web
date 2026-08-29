#!/bin/sh
npx --yes prisma@6.12.0 generate
exec dumb-init node dist/main.js 