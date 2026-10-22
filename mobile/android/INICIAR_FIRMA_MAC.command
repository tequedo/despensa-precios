#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
python3 firma-asistida.py
printf '\nPresioná Enter para cerrar.\n'
read -r
