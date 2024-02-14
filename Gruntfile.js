module.exports = function(grunt) {
 
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    copy: {
      build: {
        files: [
        ]
      }
    },
    bump: {
      options: {
        files: ['package.json'],
        updateConfigs: [],
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['package.json'],
        createTag: false,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: false,
        gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
        globalReplace: false,
        prereleaseName: false,
        metadata: '',
        regExp: false
      }
    }    
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-bump');

  grunt.registerTask('package', [ 'copy' ]);
};
