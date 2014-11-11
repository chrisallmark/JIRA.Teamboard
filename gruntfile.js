'use strict';

var fs = require('fs');

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            dist: [
                'dist/**/*',
                '!dist/cfg'
            ]
        },
        copy: {
            bower: {
                files: [
                    {
                        cwd: 'bower_components',
                        dest: 'dist/app/css',
                        expand: true,
                        flatten: true,
                        src: 'bootstrap/dist/css/*.{css.map,min.css}'
                    },
                    {
                        cwd: 'bower_components',
                        dest: 'dist/app/fonts',
                        expand: true,
                        flatten: true,
                        src: 'bootstrap/dist/fonts/*.woff'
                    },
                    {
                        cwd: 'bower_components',
                        dest: 'dist/app/js',
                        expand: true,
                        flatten: true,
                        src: ['angular*/*.min.{js,js.map}', 'bootstrap/dist/js/*.min.{js,js.map}', 'jquery/dist/*.min.{map,js}', 'moment/min/moment.min.{js,js.map}']
                    }
                ]
            },
            src: {
                files: [
                    {
                        cwd: 'src',
                        dest: 'dist',
                        expand: true,
                        filter: function(src) {
                            var dest = src.replace(this.cwd, 'dist');
                            if (fs.existsSync(dest)) {
                                return (fs.statSync(src).mtime.getTime() - fs.statSync(dest).mtime.getTime() > 0);
                            }
                            return true;
                        },
                        src: ['*', 'route/**/*', 'app/*', 'app/img/*.{gif,png}', 'app/templates/*', 'app/views/*'],
                        timestamp: true
                    }
                ]
            }
        },
        sass: {
            dist: {
                files: [{
                    cwd: 'src/app/css',
                    dest: 'dist/app/css',
                    expand: true,
                    ext: '.css',
                    src: '*.scss'
                }],
                options: {
                    sourcemap: 'none',
                    style: 'compressed'
                }
            }
        },
        uglify: {
            dist: {
                files: {
                    'dist/app/js/app.min.js': 'src/app/js/**/*.js'
                }
            }
        },
        watch: {
            bower: {
                files: ['bower_components/**/*'],
                tasks: ['copy:bower']
            },
            sass: {
                files: ['src/app/css/*.scss'],
                tasks: ['sass']
            },
            src: {
                files: ['src/*', 'src/route/**/*', 'src/app/*', 'src/app/img/{*.gif,*.png}', 'src/app/templates/*', 'src/app/views/*'],
                tasks: ['copy:src']
            },
            uglify: {
                files: ['src/app/js/**/*.js'],
                tasks: ['uglify']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', [
        'clean',
        'copy',
        'sass',
        'uglify'
    ]);

};