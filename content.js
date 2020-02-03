const mainSelector = "main[role='main']"
const primarySelector = "div[data-testid='primaryColumn']"
const logoURL = chrome.runtime.getURL("logo-green256.png")

// TODO need real network request here + cache
const lookupUsernameFromTwitter = (twitterUsername) => {
  const rando = Math.floor(Math.random() * 100000) + 1
  if (rando % 5 === 0) {
    return `user_${rando}`
  } else {
    return null
  }
}

/*
if (document.location.host !== "twitter.com") {
  return
}
*/

// busy wait for <main> element to be created - this element seems to
// persist between page navigation (e.g. visiting Settings page)
const t = setInterval(() => {
  let targetNode
  if (targetNode = document.querySelector(mainSelector)) {
    clearInterval(t)
    handleMainMutation(targetNode)
  }
}, 300)

const primaryObserver = new MutationObserver((mutationsList, observer) => {
  // Use traditional 'for loops' for IE 11
  mutationsList.forEach((mutation) => {
    if (mutation.type === 'childList') {
      (mutation.addedNodes || []).forEach((x) => {
        // timeline view, when you're seeing a bunch of tweets
        x.querySelectorAll("a[title][href][aria-label]").forEach((x) => {
          let match
          if (match = x.href.match(/twitter\.com\/([^\/]+)\/status/)) {
            const username = match[1]
            if (username) {
              chrome.runtime.sendMessage(
                {call: "lookupUsernameFromTwitter", username: username},
                (response) => {
                  let dhUsername;
                  if (dhUsername = response) {
                    const a = document.createElement("a")
                    a.setAttribute("href", `https://donohub.com/${dhUsername}`)
                    a.setAttribute("title", `Visit @${dhUsername} on DonoHub`)
                    a.setAttribute("target", "_blank")
                    a.setAttribute("style", "padding-left: 3px; position: relative; top: 2px;")
                    const img = document.createElement("img")
                    img.setAttribute("src", logoURL)
                    img.setAttribute("style", "height: 1em")
                    a.appendChild(img)
                    x.insertAdjacentElement("afterend", a)
                  }
                }
              )
            }
          }
        })
        // TODO when you're focused on a specific tweet
        /*
        x.querySelectorAll('a[role="link"][href$="/likes"][data-focusable]').forEach((x) => {
          const btn = document.createElement("span")
          btn.innerText = "😎"
          //const img = document.createElement("img")
          //img.src = chrome.runtime.getURL("logo-green16.png")
          x.insertAdjacentElement("afterend", btn)
        })
        */
      })
    }
  })
})

// this mutation observer waits for the primary column, where timeline tweets
// will be displayed, to be inserted
const handleMainMutation = (targetNode) => {
  const observer = new MutationObserver((mutationsList, observer) => {
    mutationsList.forEach((mutation) => {
      if (mutation.type === 'childList') {
        (mutation.addedNodes || []).forEach((x) => {
          if (primaryNode = document.querySelector(primarySelector)) {
            primaryObserver.observe(primaryNode, {
              childList: true,
              subtree: true
            })
          }
        })
      }
    })
  })

  // Start observing the target node for configured mutations
  observer.observe(targetNode, {
    childList: true,
    subtree: true
  })

  // Later, you can stop observing
  //observer.disconnect();
}
