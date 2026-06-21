#!/bin/sh
set -eu
exec node "$(dirname "$0")/hostinger-build.mjs" web
