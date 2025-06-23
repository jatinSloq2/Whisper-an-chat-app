#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const ncp = require('ncp').ncp;
const process = require('process');

// Function to copy the template folder to the desired location
const copyTemplate = (appName) => {
  const templateDir = path.join(__dirname, 'EXPRESS_CLI'); // Path to your pre-written code
  const destDir = path.join(process.cwd(), appName); // Destination directory

  // Check if destination already exists
  if (fs.existsSync(destDir)) {
    console.log(`Error: Directory "${appName}" already exists.`);
    process.exit(1);
  }

  // Use `ncp` (Node Copy) to copy all files from the template to the new location
  ncp(templateDir, destDir, (err) => {
    if (err) {
      console.error('Error copying template:', err);
      process.exit(1);
    }
    console.log(`Express app "${appName}" created successfully at ${destDir}`);
  });
};

// Get the app name from the command line arguments
const appName = process.argv[2];
if (!appName) {
  console.log('Please provide an app name');
  process.exit(1);
}

copyTemplate(appName);
