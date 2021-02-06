const path = require('path');
const fetch = require('node-fetch');
const express = require('express');
const router = express.Router();
const parse5 = require("parse5");
const parse5utils = require('parse5-utils');
const fs = require('fs');
const { queryOne, queryAll } = require("parse5-query-domtree");

// these are "cached" - so that we have them for pages that do not have said content
let menu = '';
let links = '';
let footer = '';
let title = '';
let sponsorer = '';

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
            .replace(/<title.*?<\/title>/gi, '')
            .replace(/<link.*?>/gi, '')
            .replace(/<font.*?>/g, '')
            .replace(/<\/font>/g, '')
            .replace(/<li><\/li>/g, '')
            .replace(/<ul><\/ul>/g, '')
        : '';
}

router.get('/template.html', (req, res, next) => {
    res.sendFile(path.resolve('template.html'));
})

router.get(['/less/*', '/android-chrome-*.png', '/favicon*', 'apple-touch-icon.png', 'browserconfig.xml', 'mstile-*.png', 'safari-pinned-tab.svg', 'site.webmanifest'], (req, res, next) => {
    const url = req.originalUrl.toLowerCase().substr(1);
    res.sendFile(path.resolve(`${url}`));
})

router.get(/(.*\.(html|php)|\/)/, async (req, res, next) => {
    const url = req.originalUrl.toLowerCase();
    // load from original site
    const path = url.startsWith('/') ? url : '/' + url;
    const response = await fetch('http://www.cykel-abc.dk' + path);

    // text
    const html = await response.text();
    const cleanerHtml = '<html>' + html
        //.replace(/<head>[\s\S]*?<\/head>/gmi, '')
        .replace(/<body/gi, '<div')
        .replace(/<\/body>/gi, '</div>')
        .replace(/<[f|k]ont.*?>/gi, '')
        .replace(/<\/font>/gi, '')
        .replace(/<div id='menu'>/gi, '<div id="menu"><div>')
        .replace(/<=""/g, '')
        .replace(/border=1 </g, '><')
        .replace(/<\/fieldset>/g, '</fieldset></form>')
        .replace(/<html>/gi, '')
        .replace(/<\/html>/gi, '') + '</html>';

    if (req.headers.accept.includes('text/html')) {
        const htmlTree = parse5.parse(cleanerHtml);

        const titleNode = queryOne(htmlTree).getElementsByTagName('title');
        if (titleNode) {
            title = textOf(titleNode);
        }

        const linksNode = queryOne(htmlTree).getElementsById('links');
        if (linksNode) {
            links = serialize(linksNode)
                .replace(/<form[\s\S]*?<\/form>/m, '');
        }

        const menuNode = queryAll(htmlTree).getElementsById('menu')[1];
        if (menuNode) {
            menu = serialize(menuNode);
        }

        const login = serialize(queryOne(htmlTree).getElementsById('login_menu'));
        const program = '';

        const sponsorerNode = queryOne(htmlTree).getElementsById('sponsorbanner');
        if (sponsorerNode) {
            sponsorer = serialize(sponsorerNode);
        }

        const nyheder = serialize(queryOne(htmlTree).getElementsById('nyhedsoversigt'));
        const bestyrelsen = serialize(queryOne(htmlTree).getElementsById('kolonne_4'));
        const misc = serialize(queryOne(htmlTree).getElementsById('kolonne_2'));

        const footerNode = queryOne(htmlTree).getElementsByClassName('footer-text');
        if (footerNode) {
            footer = serialize(footerNode);
        }

        const article = serialize(queryOne(htmlTree).getElementsByTagName('body'))
        const cleanArticle = article.substr(article.indexOf('<div'), article.lastIndexOf('</div>'));

        const main = url === '/' ? `    
            <section id="nyheder" class="column">[nyheder]</section>
            <section id="bestyrelsen" class="column">[bestyrelsen]</section>
            <section id="misc" class="column">[misc]</section>
        ` : `
            <article>
                [article]
            </article>`;

        res.send(template
            .replace(/\[main]/g, main)
            .replace(/\[title]/g, title)
            .replace(/\[links]/g, menu)
            .replace(/\[links2]/g, links)
            .replace(/\[login]/g, login)
            .replace(/\[program]/g, program)
            .replace(/\[sponsorer]/g, sponsorer)
            .replace(/\[nyheder]/g, nyheder)
            .replace(/\[bestyrelsen]/g, bestyrelsen)
            .replace(/\[misc]/g, misc)
            .replace(/\[footer]/g, footer)
            .replace(/\[article]/g, cleanArticle)
            .replace(/width="[0-9%]*?"/g, '')
            .replace(/height="[0-9%]*?"/g, '')
            .replace(/<marquee.*?>/g, '')
            .replace(/<\/marquee>/g, '')
        );
        return;
    }

    // return unchanged
    res.send(html);
});

module.exports = router;
