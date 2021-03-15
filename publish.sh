#!/bin/bash
zip -q custom-vpn-toggler.zip schemas/custom-vpn-toggler.gschema.xml schemas/gschemas.compiled metadata.json prefs.js convenience.js extension.js preferenceswidget.js LICENSE
unzip -l custom-vpn-toggler.zip
