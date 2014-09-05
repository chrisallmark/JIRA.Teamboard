'use strict';

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            dist: [
                'app/css/*.css',
                'app/js/*.min.*'
            ]
        },
        sass: {
            dist: {
                option: {
                    style: 'compressed'
                },
                files: {
                    'app/css/appCore.css': 'app/css/appCore.scss',
                    'app/css/appUser.css': 'app/css/appUser.scss'
                }
            }
        },
        uglify: {
            dist: {
                options: {
                    sourceMap: true
                },
                files: {
                    'app/js/app.min.js': ['app/js/**/*.js', '!app/js/*.min.js']
                }
            }
        },
        watch: {
            sass: {
                files: ['app/css/*.scss'],
                tasks: ['sass']
            },
            uglify: {
                files: ['app/js/**/*.js', '!app/js/*.min.js'],
                tasks: ['uglify']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', [
        'clean',
        'sass',
        'uglify'
    ]);

}