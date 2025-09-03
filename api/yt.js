const express = require('express');
const axios = require('axios');
const app = express();

const invidiousInstances = {
    'videos': [
        'https://invidious.ducks.party',
        'https://invidious.nikkosphere.com',
        'https://cal1.iv.ggtyler.dev',
        'https://super8.absturztau.be',
        'https://lekker.gay',
        'https://34.97.38.181',
        'https://iv.melmac.space',
        'https://invidious.lunivers.trade',
        'https://pol1.iv.ggtyler.dev',
        'https://nyc1.iv.ggtyler.dev',
        'https://invidious.jing.rocks',
        'https://invidious.schenkel.eti.br',
        'https://youtube.provacyplz.org',
        'https://invidious.darkness.services',
        'https://inv.vern.cc',
        'https://invidious.vern.cc',
        'https://yt.vern.cc',
        'https://invidious.materialio.us',
        'https://inv.tux.pizza',
        'https://vid.puffyan.us',
        'https://invidious.private.coffee',
        'https://invidious.varis.social',
        'https://youtube.mosesmang.com'
    ],
    'search': [
        'https://iv.melmac.space',
        'https://lekker.gay',
        'https://invidious.ducks.party',
        'https://invidious.lunivers.trade',
        'https://youtube.alt.tyil.nl',
        'https://invidious.nikkosphere.com',
        'https://super8.absturztau.be',
        'https://cal1.iv.ggtyler.dev',
        'https://34.97.38.181',
        'https://rust.oskamp.nl',
        'https://invidious.adminforge.de',
        'https://pol1.iv.ggtyler.dev',
        'https://nyc1.iv.ggtyler.dev',
        'https://invidious.jing.rocks',
        'https://invidious.schenkel.eti.br',
        'https://youtube.provacyplz.org',
        'https://invidious.darkness.services',
        'https://inv.vern.cc',
        'https://invidious.vern.cc',
        'https://yt.vern.cc',
        'https://invidious.materialio.us',
        'https://inv.tux.pizza',
        'https://vid.puffyan.us',
        'https://invidious.private.coffee',
        'https://invidious.varis.social',
        'https://youtube.mosesmang.com'
    ],
    'channels': [
        'https://iv.melmac.space',
        'https://lekker.gay',
        'https://youtube.alt.tyil.nl',
        'https://invidious.lunivers.trade',
        'https://rust.oskamp.nl',
        'https://super8.absturztau.be',
        'https://invidious.ducks.party',
        'https://invidious.nikkosphere.com',
        'https://cal1.iv.ggtyler.dev',
        'https://34.97.38.181',
        'https://pol1.iv.ggtyler.dev',
        'https://nyc1.iv.ggtyler.dev',
        'https://invidious.jing.rocks',
        'https://invidious.schenkel.eti.br',
        'https://youtube.provacyplz.org',
        'https://invidious.darkness.services',
        'https://inv.vern.cc',
        'https://invidious.vern.cc',
        'https://yt.vern.cc',
        'https://invidious.materialio.us',
        'https://inv.tux.pizza',
        'https://vid.puffyan.us',
        'https://invidious.private.coffee',
        'https://invidious.varis.social',
        'https://youtube.mosesmang.com'
    ],
    'playlists': [
        'https://lekker.gay',
        'https://invidious.0011.lt',
        'https://invidious.nietzospannend.nl',
        'https://invidious.lunivers.trade',
        'https://nyc1.iv.ggtyler.dev',
        'https://youtube.mosesmang.com',
        'https://siawaseok-wakame-server2.glitch.me',
        'https://iv.melmac.space',
        'https://cal1.iv.ggtyler.dev',
        'https://iv.ggtyler.dev',
        'https://pol1.iv.ggtyler.dev',
        'https://invidious.jing.rocks',
        'https://invidious.schenkel.eti.br',
        'https://youtube.provacyplz.org',
        'https://invidious.darkness.services',
        'https://inv.vern.cc',
        'https://invidious.vern.cc',
        'https://yt.vern.cc',
        'https://invidious.materialio.us',
        'https://inv.tux.pizza',
        'https://vid.puffyan.us',
        'https://invidious.private.coffee',
        'https://invidious.varis.social'
    ],
    'comments': [
        'https://invidious.nietzospannend.nl',
        'https://pol1.iv.ggtyler.dev',
        'https://lekker.gay',
        'https://cal1.iv.ggtyler.dev',
        'https://iv.ggtyler.dev',
        'https://nyc1.iv.ggtyler.dev',
        'https://invidious.jing.rocks',
        'https://invidious.schenkel.eti.br',
        'https://youtube.provacyplz.org',
        'https://invidious.darkness.services',
        'https://inv.vern.cc',
        'https://invidious.vern.cc',
        'https://yt.vern.cc',
        'https://invidious.materialio.us',
        'https://inv.tux.pizza',
        'https://vid.puffyan.us',
        'https://invidious.private.coffee',
        'https://invidious.varis.social',
        'https://iv.melmac.space',
        'https://youtube.mosesmang.com'
    ]
};

async function proxyRequest(req, res, apiPath) {
    const endpointType = apiPath.split('/')[0];
    const instancesToUse = invidiousInstances[endpointType] || [];

    if (instancesToUse.length === 0) {
        return res.status(503).json({ error: `No Invidious instances configured for endpoint: ${endpointType}` });
    }

    const queryParams = new URLSearchParams(req.query).toString();
    
    for (const instance of instancesToUse) {
        try {
            const apiUrl = `${instance}/api/v1/${apiPath}?${queryParams}`;
            console.log(`Trying instance for ${apiPath}: ${instance}`);

            const response = await axios.get(apiUrl, { timeout: 5000 });
            
            if (response.data) {
                return res.json(response.data);
            }
        } catch (error) {
            console.error(`Request to ${instance} failed:`, error.message);
        }
    }

    res.status(500).json({ error: `Failed to fetch data from any specified instance for ${apiPath}` });
}

app.get('/api/v1/*', (req, res) => {
    const apiPath = req.params[0];
    proxyRequest(req, res, apiPath);
});

module.exports = app;
