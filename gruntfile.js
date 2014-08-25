'use strict';

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        sass: {
            dist: {
                option: {
                    style: 'compressed'
                },
                files: {
                    'app/css/teamboard.css': 'app/css/teamboard.scss'
                }
            }
        },
        uglify: {
            dist: {
                options: {
                    mangle: false,
                    sourceMap: true
                },
                files: {
                    'app/js/app.min.js': ['app/js/**/*.js', '!app/js/*.min.js']
                }
            }
        },
        watch: {
            sass: {
                files: ['app/css/*.sass'],
                tasks: ['sass']
            },
            uglify: {
                files: ['app/js/**/*.js', '!app/js/*.min.js'],
                tasks: ['uglify']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['sass', 'uglify']);

}