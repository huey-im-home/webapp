const fs = require('fs');
const APP_VERSION = require('./package.json').version;

// Write the version file to the build folder
const json = {
  version: APP_VERSION
};

fs.writeFile("./dist/version.json", JSON.stringify(json), 'utf8', function (err) {
  if (err) {
    console.log("An error occured while writing JSON Object to File.");
    return console.log(err);
  }

  console.log("Version JSON file has been saved.");
});
