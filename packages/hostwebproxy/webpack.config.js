'use strict'

const path = require("path");
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');

module.exports = {
    name: 'host-web-proxy',
    entry: ['whatwg-fetch', 'promise-polyfill', './src/docReady.js', './src/HostWebProxy.ts'],
    module: {
        rules: [
            //Delicious ES2015 code, made simple for simpleton browsers.
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel-loader',
                query: {
                    presets: [["es2015", { "modules": false }]],
                    plugins: [
                        "transform-runtime",
                        "transform-async-to-generator"
                    ]
                }
            },
            { test: /\.tsx?$/, loader: 'ts-loader' },
            {
                test: /\.aspx$/,
                loader: 'raw-loader'
            }
        ]
    },
    output: {
        path: path.join(__dirname, '/build'),
        publicPath: '/',
        filename: 'HostWebProxy.js',
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/HostWebProxy.aspx',
            filename: 'HostWebProxy.aspx',
            inject: 'body',
            inlineSource: '.(js|css)$' // embed all javascript and css inline
        }),
        new HtmlWebpackInlineSourcePlugin(),
        new webpack.NoEmitOnErrorsPlugin()
    ]
};
