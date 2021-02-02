const path = require('path');
const fetch = require('node-fetch');
const express = require('express');
const router = express.Router();
const parse5 = require("parse5");
const parse5utils = require('parse5-utils');
const fs = require('fs');
const { queryOne } = require("parse5-query-domtree");

require.extensions['.html'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};

const template = require('../template.html');

function textOf(node) {
    return node ? parse5utils.textOf(node) : '';
}

function serialize(node) {
    return node ? parse5utils.serialize(node)
        .replace(/<meta.*?>/gi, '')
        .replace(/<style[\s\S]+?<\/style>/gmi, '')
        .replace(/<title[\s\S]+?<\/title>/gmi, '')
        .replace(/<link.*?>/gi, '')
    : '';
}

router.get('/less/*', (req, res, next) => {
    const url = req.originalUrl.toLowerCase().substr(1);
    res.sendFile(path.resolve(`${url}`));
});

router.get('/template.html', (req, res, next) => {
    res.sendFile(path.resolve('template.html'));
})

router.get(/(.*\.(html|php)|\/)/, async (req, res, next) => {
    const url = req.originalUrl.toLowerCase();
    // load from original site
    const path = url.startsWith('/') ? url : '/' + url;
    const response = await fetch('http://www.cykel-abc.dk' + path);

    // text
    const html = await response.text();

    // insert viewport meta tag and link to css
    if (req.headers.accept.includes('text/html')) {
        const htmlTree = parse5.parse(html);
        const title = textOf(queryOne(htmlTree).getElementsByTagName('title'));
        const links = '';
        const login = serialize(queryOne(htmlTree).getElementsById('login_menu'));
        const program = '';
        const sponsorer = serialize(queryOne(htmlTree).getElementsById('sponsorbanner'));
        const nyheder = serialize(queryOne(htmlTree).getElementsById('nyhedsoversigt'));
        const bestyrelsen = serialize(queryOne(htmlTree).getElementsById('kolonne_4'));
        const misc = serialize(queryOne(htmlTree).getElementsById('kolonne_2'));
        const footer = serialize(queryOne(htmlTree).getElementsByClassName('footer-text'));

        res.send(template
            .replace(/\[title]/g, title)
            .replace(/\[links]/g, links)
            .replace(/\[login]/g, login)
            .replace(/\[program]/g, program)
            .replace(/\[sponsorer]/g, sponsorer)
            .replace(/\[nyheder]/g, nyheder)
            .replace(/\[bestyrelsen]/g, bestyrelsen)
            .replace(/\[misc]/g, misc)
            .replace(/\[footer]/g, footer)
            .replace(/width="[0-9%]*"/g, '')
            .replace(/height="[0-9%]*"/g, '')
            .replace(/<marquee.*?>/g, '')
            .replace(/<\/marquee>/g, '')
        );
        return;
    }

    // return unchanged
    res.send(html);
});

module.exports = router;
