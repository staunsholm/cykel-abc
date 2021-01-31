const path = require('path');
const fetch = require('node-fetch');
const express = require('express');
const router = express.Router();

router.get('/less/*', (req, res, next) => {
    const url = req.originalUrl.toLowerCase().substr(1);
    res.sendFile(path.resolve(`${url}`));
});

router.get('/template.html', (req, res, next) => {
    res.sendFile(path.resolve('template.html'));
})

router.get(/.*\.(html|php)/, async (req, res, next) => {
    const url = req.originalUrl.toLowerCase();
    // load from original site
    const path = url.startsWith('/') ? url : '/' + url;
    const response = await fetch('http://www.cykel-abc.dk' + path);

    // text
    const html = await response.text();

    // insert viewport meta tag and link to css
    if (req.headers.accept.includes('text/html')) {
        const changedPage = html
            .replace(/<link.*rel="stylesheet".*>/gi, '')
            .replace(/<meta/i, '<meta name="viewport" content="width=device-width, initial-scale=1"><link href="/less/template.css" rel="stylesheet" type="text/css"><meta')
            .replace(/width="[0-9%]*"/g, 'width="100%"')
            .replace(/height="[0-9%]*"/g, '');
        res.send(changedPage);
        return;
    }

    // return unchanged
    res.send(html);
});

module.exports = router;
