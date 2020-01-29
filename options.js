// https://stackoverflow.com/a/18650828/215168
// Licensed CC-BY-SA
function formatBytes(a,b){if(0==a)return"0 Bytes";var c=1024,d=b||2,e=["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"],f=Math.floor(Math.log(a)/Math.log(c));return parseFloat((a/Math.pow(c,f)).toFixed(d))+" "+e[f]}

const saveConfig = () => {
  chrome.storage.local.set(
    {
      "config.timer_display": document.getElementById("timer_display").value,
    },
    () => {
      var status = document.getElementById("status");
      status.innerHTML = "Configuration updated!";
      setTimeout(function() {
        status.innerHTML = "";
      }, 750);
    }
  )
}

const restoreConfig = () => {
  chrome.storage.local.get({"config.timer_display": "page"}, function(x) {
    document.getElementById("timer_display").value = x["config.timer_display"]
  })
}

const displayStorageSize = () => {
  const storageSpaceUsed = document.getElementById("storageSpaceUsed")
  chrome.storage.local.getBytesInUse(null, (x) => {
    storageSpaceUsed.innerText = formatBytes(x)
  })
}

const clearHistory = () => {
  const messageSuccess = () => {
    const status = document.getElementById("historyStatus")
    status.innerHTML = "History cleared!"
    setTimeout(
      () => { status.innerHTML = "" },
      750
    )
  }
  chrome.storage.local.get(null, (storage) => {
    // clear page durations
    const toRemove = Object.keys(storage).filter(
      (key) => !key.startsWith("config.")
    )
    chrome.storage.local.remove(toRemove, () => {
      // clear .well-known cache
      const cacheWellKnown = chrome.extension.getBackgroundPage().cacheWellKnown
      for (const x in cacheWellKnown) delete cacheWellKnown[x]
      displayStorageSize()
      messageSuccess()
    })
  })
}

document.addEventListener('DOMContentLoaded', restoreConfig)
document.addEventListener('DOMContentLoaded', displayStorageSize)
document.querySelector('#save').addEventListener('click', saveConfig)
document.querySelector('#clearHistory').addEventListener('click', () => {
  const yesBtnWrapper = document.getElementById("clearHistoryYesWrapper")
  yesBtnWrapper.classList.remove("hidden")
})
document.querySelector('#clearHistoryYes').addEventListener('click', () => {
  clearHistory()
  const yesBtnWrapper = document.getElementById("clearHistoryYesWrapper")
  yesBtnWrapper.classList.add("hidden")
})
