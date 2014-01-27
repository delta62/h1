#!/bin/bash

TARGET='h1@samnoedel.com.xpi'

# Build the XPI
echo 'Building XPI:'
zip -r $TARGET install.rdf chrome.manifest locale skin content modules defaults
