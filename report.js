import { formatDurationHHMMSS } from './util.js'

const emptyTable = () => {
  const el = document.getElementById("report-table")
  while (el.firstChild) {
    el.removeChild(el.firstChild)
  }
}

const generateProfileReport = () => {
  emptyTable()
  const table = document.getElementById("report-table")
  // headers
  const thead = document.createElement("thead")
  table.appendChild(thead)
  const tr = document.createElement("tr")
  thead.appendChild(tr);
  ["Profile", "Total time viewed (hh:mm:ss)"].forEach((x) => {
    const el = document.createElement("th")
    el.setAttribute("scope", "col")
    el.innerText = x
    tr.appendChild(el)
  })
  // rows
  const tbody = document.createElement("tbody")
  table.appendChild(tbody)
  chrome.storage.local.get(null, (storage) => {
    const rows = Object.keys(storage)
      .filter((key) => key.startsWith("@d."))
      .map((key) => ([key.substring(3), storage[key]]))
      .sort((a,b) => b[1].d - a[1].d)
    rows.forEach((row) => {
      const key = row[0]
      const tr2 = document.createElement("tr")
      tbody.appendChild(tr2)
      const profile = document.createElement("td")
      tr2.appendChild(profile)
      profile.setAttribute("align", "right")
      const profileA = document.createElement("a")
      profile.appendChild(profileA)
      profileA.setAttribute("href", `https://donohub.com/${key}`)
      profileA.innerText = `@${key}`
      const duration = document.createElement("td")
      duration.setAttribute("align", "right")
      tr2.appendChild(duration)
      duration.innerText = formatDurationHHMMSS(row[1].d * 1000)
    })
  })
}

const generateHostReport = () => {
  emptyTable()
  const table = document.getElementById("report-table")
  // headers
  const thead = document.createElement("thead")
  table.appendChild(thead)
  const tr = document.createElement("tr")
  thead.appendChild(tr);
  ["Host", "Total time viewed (hh:mm:ss)"].forEach((x) => {
    const el = document.createElement("th")
    el.setAttribute("scope", "col")
    el.innerText = x
    tr.appendChild(el)
  })
  // rows
  const tbody = document.createElement("tbody")
  table.appendChild(tbody)
  chrome.storage.local.get(null, (storage) => {
    const rows = Object.keys(storage)
      .filter((key) => key.startsWith("hd."))
      .map((key) => ([key.substring(3), storage[key]]))
      .sort((a,b) => b[1].d - a[1].d)
    rows.forEach((row) => {
      const key = row[0]
      const tr2 = document.createElement("tr")
      tbody.appendChild(tr2)
      const td1 = document.createElement("td")
      tr2.appendChild(td1)
      td1.setAttribute("align", "right")
      const td1A = document.createElement("a")
      td1.appendChild(td1A)
      td1A.setAttribute("href", key)
      td1A.innerText = key
      const duration = document.createElement("td")
      duration.setAttribute("align", "right")
      tr2.appendChild(duration)
      duration.innerText = formatDurationHHMMSS(row[1].d * 1000)
    })
  })
}

const generateURLReport = () => {
  emptyTable()
  const table = document.getElementById("report-table")
  // headers
  const thead = document.createElement("thead")
  table.appendChild(thead)
  const tr = document.createElement("tr")
  thead.appendChild(tr);
  ["URL", "Profile", "Total time viewed (hh:mm:ss)"].forEach((x) => {
    const el = document.createElement("th")
    el.setAttribute("scope", "col")
    el.innerText = x
    tr.appendChild(el)
  })
  // rows
  const tbody = document.createElement("tbody")
  table.appendChild(tbody)
  chrome.storage.local.get(null, (storage) => {
    const rows = Object.keys(storage)
      .filter((key) => key.startsWith("pd."))
      .map((key) => ([key.substring(3), storage[key]]))
      .sort((a,b) => b[1].d - a[1].d)
    rows.forEach((row) => {
      const url = row[0]
      const profile = row[1].p
      const duration = row[1].d
      const tr2 = document.createElement("tr")
      tbody.appendChild(tr2)
      // URL
      const td1 = document.createElement("td")
      tr2.appendChild(td1)
      td1.setAttribute("align", "right")
      const td1A = document.createElement("a")
      td1.appendChild(td1A)
      td1A.setAttribute("href", url)
      td1A.innerText = url
      // Profile
      const td2 = document.createElement("td")
      tr2.appendChild(td2)
      const td2A = document.createElement("a")
      td2.appendChild(td2A)
      td2A.setAttribute("href", `https://donohub.com/${profile}`)
      td2A.innerText = `@${profile}`
      td2.setAttribute("align", "right")
      // Total time viewed
      const td3 = document.createElement("td")
      td3.setAttribute("align", "right")
      tr2.appendChild(td3)
      td3.innerText = formatDurationHHMMSS(duration * 1000)
    })
  })
}

const drawSelectedReport = (target) => {
  if (target.value === "profile") {
    generateProfileReport()
  } else if (target.value === "host") {
    generateHostReport()
  } else {
    generateURLReport()
  }
}

document.addEventListener('DOMContentLoaded', () => {
  drawSelectedReport(document.getElementById("reportSelect"))
})

document.querySelector('#reportSelect').addEventListener('change', (event) => {
  drawSelectedReport(event.target)
})
