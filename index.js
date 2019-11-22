var fs = require("fs");
var log = console.log;

module.exports = function (filepath, destination) {

    log("\n °º¤ø,¸¸,ø¤º°`°º¤ø,¸,ø¤°º¤ø,¸¸,ø¤º°`°º¤ø,¸ \n");
    log("\n Theme Booth \n");

    filepath = filepath ? filepath : "config/theme.json";
    destination = destination ? destination : "_dist";

    var contents = fs.readFileSync(filepath);
    var theme = JSON.parse(contents);

    if (theme.targets.includes("intellij")) {
        var intellij = require("./config/editors/intellij/intellij.js");
        intellij(theme, destination);
    }

};