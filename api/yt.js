const express = require('express');
const axios = require('axios');
const app = express();

// 試行するInvidiousインスタンスのリスト
const invidiousInstances = [
    'https://lekker.gay',
    'https://nyc1.iv.ggtyler.dev',
    'https://invidious.nikkosphere.com',
    'https://invidious.rhyshl.live',
    'https://invid-api.poketube.fun',
    'https://inv.tux.pizza',
    'https://pol1.iv.ggtyler.dev',
    'https://yewtu.be',
    'https://youtube.alt.tyil.nl'
];

// Invidious APIへのリクエストを処理する汎用関数
async function proxyRequest(req, res, apiPath) {
    if (invidiousInstances.length === 0) {
        return res.status(503).json({ error: 'No Invidious instances configured' });
    }

    // クエリパラメータを保持する
    const queryParams = new URLSearchParams(req.query).toString();
    
    for (const instance of invidiousInstances) {
        try {
            // APIパスとクエリパラメータを組み合わせて完全なURLを作成
            const apiUrl = `${instance}/api/v1/${apiPath}?${queryParams}`;
            console.log(`Trying instance for ${apiPath}: ${instance}`);

            const response = await axios.get(apiUrl, { timeout: 5000 });
            
            // 成功: 最初の有効な応答をそのまま返す
            if (response.data) {
                return res.json(response.data);
            }
        } catch (error) {
            console.error(`Request to ${instance} failed:`, error.message);
        }
    }

    // 全てのインスタンスで失敗した場合
    res.status(500).json({ error: `Failed to fetch data from any specified instance for ${apiPath}` });
}

// すべてのAPIリクエストを処理する単一のエンドポイント
app.get('/api/v1/*', (req, res) => {
    // URLの/api/v1/以降のパスをすべて取得
    const apiPath = req.params[0];
    proxyRequest(req, res, apiPath);
});

module.exports = app;
