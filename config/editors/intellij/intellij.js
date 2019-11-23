var fs = require("fs");
var gulp = require("gulp");
var replaceName = require('gulp-replace-name');
var thematizer = require("../../thematizer.js");
var uuid = require('uuid/v1');
var log = console.log;

module.exports = function (themeConfig, destination) {

    var context = "config/editors/intellij/";
    
    // Theme needs a UUID
    themeConfig.uuid = uuid();

    // Theme definition plugin

    gulp.src(context + "theme/META-INF/plugin.xml")
        .pipe(thematizer({}, themeConfig))
        .pipe(gulp.dest(destination));

    // Empty file (?)

    gulp.src(context + "theme/default.theme.json")
        .pipe(replaceName(/default/g, themeConfig.theme))
        .pipe(gulp.dest(destination));

    // Theme visual definition

    var contents = fs.readFileSync(context + "intellij.json");
    var intellijTheme = JSON.parse(contents);

    gulp.src(context + "theme/default.xml")
        .pipe(thematizer(themeConfig.variables, intellijTheme))
        .pipe(replaceName(/default/g, themeConfig.theme))
        .pipe(gulp.dest(destination + "/intellij"));

};
