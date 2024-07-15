// ==UserScript==
// @name         YouTube NowPlaying on Nostr
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Post YouTube URL on load YouTube videos
// @author       https://github.com/mopeneko
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        none
// @match        https://www.youtube.com/watch?*
// @require      https://cdn.jsdelivr.net/npm/nostr-tools@2.7.1/lib/nostr.bundle.js
// ==/UserScript==

window.addEventListener('yt-page-data-fetched', async () => {
    'use strict';

    console.info('YouTube NowPlaying on Nostr v0.0.1');

    const sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

    for (let i = 1; i <= 10; i++) {
        if (typeof window.nostr !== 'undefined') {
            break;
        }

        if (i === 10) {
            console.error('Install a NIP-07 browser extension to use');
            return;
        }

        await sleep(100);
    }

    const url = new URL(window.location.href);
    if (!url.searchParams.has('v')) {
        console.error('Invalid page URL');
        return;
    }

    const searchParam = new URLSearchParams({ v: url.searchParams.get('v') });
    url.search = searchParam.toString();

    const event = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: `Now Playing: ${url}`,
    };

    const signedEvent = await window.nostr.signEvent(event);

    const relay = await NostrTools.Relay.connect('wss://relay-jp.nostr.wirednet.jp');
    try {
        await relay.publish(signedEvent);
        console.info('Published event', signedEvent);
    } catch (e) {
        console.error(e);
    } finally {
        relay.close();
    }
});
