const lookupProfile = () => {
  chrome.tabs.query(
    { active: true, currentWindow: true },
    (tabs) => {
      const currentTab = tabs[0]
      chrome.runtime.sendMessage(
        {call: "profileLookupCached", url: currentTab.url},
        (response) => {
          const elLoading = document.getElementById("profile-loading")
          const elEnabled = document.getElementById("profile-enabled")
          const elDisabled = document.getElementById("profile-disabled")
          const elLink = document.getElementById("profile-link")
          const elExplain = document.getElementById("profile-explain")
          if (response) {
            elLink.textContent = `@${response.profile}`
            elLink.setAttribute("href", `https://donohub.com/${response.profile}`)
            elExplain.textContent = `DonoHub profile is linked by this ${response.type === "host" ? "domain" : response.type}`
            elLoading.classList.add("hidden")
            elEnabled.classList.remove("hidden")
            elDisabled.classList.add("hidden")
          } else {
            elLoading.classList.add("hidden")
            elDisabled.classList.remove("hidden")
            elEnabled.classList.add("hidden")
          }
        }
      )
    }
  )
}

document.addEventListener('DOMContentLoaded', () => {
  lookupProfile()
})
