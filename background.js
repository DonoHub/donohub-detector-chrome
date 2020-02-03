import { formatDuration } from './util.js'

const pageDatabase = {}
const hostDatabase = {}
const twitterDatabase = {}
const cacheWellKnown = {}
const cacheTwitterUsers = {}

chrome.browserAction.setBadgeText({ 'text': '?'});
chrome.browserAction.setBadgeBackgroundColor({ 'color': "#777" });
chrome.browserAction.setPopup({ 'popup': "popup.html" })

chrome.contextMenus.removeAll(() => {
  chrome.contextMenus.create({
    title: "View browsing report",
    contexts: ["browser_action"],
    onclick: function() {
      const win = window.open('report.html', '_blank');
      win.focus();
    }
  })
  chrome.contextMenus.create({
    title: "Edit configuration",
    contexts: ["browser_action"],
    onclick: function() {
      const win = window.open('options.html', '_blank');
      win.focus();
    }
  })
  chrome.contextMenus.create({
    title: "View source on GitHub",
    contexts: ["browser_action"],
    onclick: function() {
      const win = window.open('https://github.com/DonoHub/donohub-extension-chrome', '_blank');
      win.focus();
    }
  })
})

const checkStatus200 = (response) => {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    throw "Not a 200 OK response"
  }
}

const parseText = (response) => response.text()

const parseWellKnown = (body) => {
  // const match = file.match(/^@([a-zA-Z0-9\_]+)$/m)
  const lines = body.split(/\r?\n/)
  const match = lines && lines[0] && lines[0].match(/^@([a-zA-Z0-9\_]+)$/)
  if (match && match[1]) {
    return match[1]
  } else {
    throw "Malformed .well-known/donohub.txt file"
  }
}

const profileLookupCached = (url) => {
  let profile;
  if (profile = pageDatabase[url]) {
    return { profile: profile, type: "page" }
  } else {
    const u = new URL(url)
    if (profile = hostDatabase[u.host]) {
      return { profile: profile, type: "host" }
    } else {
      return null
    }
  }
}

// TODO turn this into a Promise?
const profileLookupPageMeta = (tabId, url) => {
  // TODO cache lookups in a local data structure?
  chrome.tabs.executeScript(
    tabId,
    {
      code: `var el = document.querySelector('head > meta[name="donohub:profile"]'); el && el.attributes.content.value;`,
    },
    (result) => {
      const profile = (result && result[0])
      if (profile) {
        // DonoHub-enabled page :)
        pageDatabase[url] = profile
      }
    }
  )
}

const profileLookupDomainWellKnown = (url) => {
  const u = new URL(url)
  if (["http:", "https:"].includes(u.protocol)) {
    const urlPrefix = `${u.protocol}//${u.host}`
    const wellKnownUrl = `${urlPrefix}/.well-known/donohub.txt`
    const cache = cacheWellKnown[urlPrefix]
    // .well-known lookups are cached for 1 day
    if (cache && (Date.now() - cache.t) < 86400000) {
      console.debug(`Cache hit: ${wellKnownUrl} status=${cache["status"]} (expires in ${(86400000 - (Date.now() - cache.t)) / 1000} seconds)`)
      if (cache["status"] === "found") {
        return cache["value"]
      } else {
        // other statuses are "pending" and "not_found"
        return
      }
    } else {
      cacheWellKnown[urlPrefix] = { status: "pending", t: Date.now() }
    }
    fetch(wellKnownUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
      },
    })
    .then(checkStatus200)
    .then(parseText)
    .then(parseWellKnown)
    .then((profile) => {
      // DonoHub-enabled domain :)
      hostDatabase[u.host] = profile
      cacheWellKnown[urlPrefix] = {
        status: "found",
        value: profile,
        t: Date.now(),
      }
    })
    .catch((e) => {
      console.debug(`Marking ${wellKnownUrl} not_found because: `, e)
      cacheWellKnown[urlPrefix] = {
        status: "not_found",
        t: Date.now(),
      }
    })
  }
}

const lookupUsernameFromTwitter = (twitterUsername) => {
  const cache = cacheTwitterUsers[twitterUsername]
  // Twitter profile lookups are cached for 1 day
  if (cache && (Date.now() - cache.t) < 86400000) {
    console.debug(`Twitter cache hit: @${twitterUsername} status=${cache["status"]} (expires in ${(86400000 - (Date.now() - cache.t)) / 1000} seconds)`)
    if (cache["status"] === "found") {
      return cache["value"]
    } else {
      // other statuses are "pending" and "not_found"
      return
    }
  } else {
    cacheTwitterUsers[twitterUsername] = { status: "pending", t: Date.now() }
  }

  // TODO replace random function w/ network fetch()
  new Promise(
    (resolve, reject) => {
      const rando = Math.floor(Math.random() * 100000) + 1
      if (rando % 5 === 0) {
        resolve(`user_${rando}`)
      } else {
        // not found
        reject(Error("Random number not modulo 5"))
      }
    }
  )
  .then((profile) => {
    // DonoHub-enabled Twitter profile :)
    twitterDatabase[twitterUsername] = profile
    cacheTwitterUsers[twitterUsername] = {
      status: "found",
      value: profile,
      t: Date.now(),
    }
    return profile
  })
  .catch((e) => {
    console.debug(`Marking Twitter profile @${twitterUsername} not_found because: `, e)
    cacheTwitterUsers[twitterUsername] = {
      status: "not_found",
      t: Date.now(),
    }
    return null
  })
}

const updateTab = (t, tab) => {
  if (!tab.url) {
    return;
  }
  profileLookupPageMeta(tab.id, tab.url)
  profileLookupDomainWellKnown(tab.url)
}

function handleUpdate(tabId, changeInfo, tab) {
  updateTab(new Date(), tab)
}

function handleReplace(addedTabId, removedTabId) {
  var t = new Date();
  chrome.tabs.get(addedTabId, function(tab) {
    updateTab(t, tab)
  })
}

const handleActivated = (activeInfo) => {
  var t = new Date();
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    updateTab(new Date(), tab)
  })
}

const tick = () => {
  // increment duration for each active tab that has a DonoHub profile
  chrome.tabs.query({ active: true }, (tabs) => {
    const tabURLs = tabs.map((x) => x.url).filter((x) => !!x)
    const distinctURLs = [...new Set(tabURLs)]
    const enabledTabs = new Set()
    const processedHosts = {}
    const processedProfiles = {}
    distinctURLs.forEach((x) => {
      const url = new URL(x)
      let data
      if (data = profileLookupCached(x)) {
        const now = Date.now()
        // set badge logo + title to "enabled"
        tabs.forEach((y) => {
          if (y.url === x) {
            enabledTabs.add(y.id)
            chrome.browserAction.setIcon({
              path: {
                "16":  "logo-green16.png",
                "48":  "logo-green48.png",
                "128": "logo-green128.png",
                "256": "logo-green256.png"
              },
              tabId: y.id,
            })
            chrome.browserAction.setTitle({
              title: `DonoHub active - @${data.profile}`,
              tabId: y.id,
            })
          }
        })
        // update durations
        const pageKey = `pd.${x}`
        const getKey = {
          [pageKey]: {p: data.profile, c: now, d: 0, h: url.host},
          "config.timer_display": "page"
        }
        // host duration
        const hostKey = `hd.${url.host}`
        if (!processedHosts[url.host]) {
          getKey[hostKey] = {c: now, d: 0}
        }
        // profile duration
        const profileKey = `@d.${data.profile}`
        if (!processedProfiles[data.profile]) {
          getKey[profileKey] = {c: now, d: 0}
        }
        chrome.storage.local.get(
          getKey,
          (storage) => {
            const update = {[pageKey]: storage[pageKey]}
            if (storage[hostKey]) {
              update[hostKey] = storage[hostKey]
            }
            if (storage[profileKey]) {
              update[profileKey] = storage[profileKey]
            }
            // increment durations
            update[pageKey].d += 1
            if (update[hostKey]) {
              update[hostKey].d += 1
              processedHosts[url.host] = update[hostKey].d
            }
            if (update[profileKey]) {
              update[profileKey].d += 1
              processedProfiles[data.profile] = update[profileKey].d
            }
            // overwrite page profile in case it changed
            update[pageKey].p = data.profile
            // persist updated durations to storage
            chrome.storage.local.set(update, () => {})
            // redraw badge durations
            if (storage["config.timer_display"] === "page") {
              const textDuration = formatDuration(update[pageKey].d * 1000)
              tabs.forEach((y) => {
                if (y.url === x) {
                  chrome.browserAction.setBadgeText({
                    'tabId': y.id,
                    'text': textDuration
                  })
                }
              })
            } else if (storage["config.timer_display"] === "host") {
              const textDuration = formatDuration(processedHosts[url.host] * 1000)
              tabs.forEach((y) => {
                if (y.url === x) {
                  chrome.browserAction.setBadgeText({
                    'tabId': y.id,
                    'text': textDuration
                  })
                }
              })
            } else if (storage["config.timer_display"] === "profile") {
              const textDuration = formatDuration(processedProfiles[data.profile] * 1000)
              tabs.forEach((y) => {
                if (y.url === x) {
                  chrome.browserAction.setBadgeText({
                    'tabId': y.id,
                    'text': textDuration
                  })
                }
              })
            } else { // storage["config.timer_display"] === "none"
              tabs.forEach((y) => {
                if (y.url === x) {
                  chrome.browserAction.setBadgeText({
                    'tabId': y.id,
                    'text': ''
                  })
                }
              })
            }
          }
        )
      }
    })
    // set disabled tabs' style
    tabs.forEach((x) => {
      if (!enabledTabs.has(x.id)) {
        //console.log("disabling ", x.id)
        chrome.browserAction.setBadgeText({
          'tabId': x.id,
          'text': ''
        })
        chrome.browserAction.setIcon({
          path: {
            "16":  "logo-gray16.png",
            "48":  "logo-gray48.png",
            "128": "logo-gray128.png",
            "256": "logo-gray256.png"
          },
          tabId: x.id,
        })
        chrome.browserAction.setTitle({
          title: "No DonoHub profile found",
          tabId: x.id,
        })
      }
    })
  })
}

setInterval(tick, 1000)
// TODO add timer to warn user if getBytesInUse gets large, to clear cache?

chrome.tabs.onUpdated.addListener(handleUpdate)
chrome.tabs.onReplaced.addListener(handleReplace)
chrome.tabs.onActivated.addListener(handleActivated)

chrome.runtime.onMessage.addListener((request,sender,sendResponse) => {
  if (request.call === "profileLookupCached") {
    const result = profileLookupCached(request.url)
    sendResponse(result)
  } else if (request.call === "lookupUsernameFromTwitter") {
    sendResponse(lookupUsernameFromTwitter(request.username))
  }
})
