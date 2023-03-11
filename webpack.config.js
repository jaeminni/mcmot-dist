const path = require('path')

module.exports = {
    entry: './src/main/js/mv/index.js',
    output: {path: path.resolve(__dirname, 'resources', 'js'), filename: 'annotation.js'},
}
