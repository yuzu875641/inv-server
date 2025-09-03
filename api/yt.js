const express = require('express');
const axios = require('axios');
const app = express();

// エンドポイントごとに使用するInvidiousインスタンスを定義
const invidiousInstances = {
    'videos': [
        'https://invidious.ducks.party',
        'https://invidious.nikkosphere.com',
        'https://cal1.iv.ggtyler.dev',
        'https://super8.absturztau.be',
        'https://lekker.gay',
        'https://34.97.38.181',
        'https://iv.melmac.space',
        'https://invidious.lunivers.trade'
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
        'https://pol1.iv.ggtyler.dev'
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
        'https://34.97.38.181'
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
        'https://pol1.iv.ggtyler.dev'
    ],
    'comments': [
        'https://invidious.nietzospannend.nl',
        'https://pol1.iv.ggtyler.dev',
        'https://lekker.gay',
        'https://cal1.iv.ggtyler.dev',
        'https://iv.ggtyler.dev'
    ]
};

// Invidious APIへのリクエストを処理する汎用関数
async function proxyRequest(req, res, apiPath) {
    // パスからエンドポイントタイプを抽出
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

// 全てのAPIリクエストを処理する単一のエンドポイント
app.get('/api/v1/*', (req, res) => {
    const apiPath = req.params[0];
    proxyRequest(req, res, apiPath);
});

module.exports = app;
