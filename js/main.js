"use strict";

/**
 * ------------------------------------------------------------------
 * [Table of contents]
 *
 * 1. Main Initialization (Slideshow, Mobile Menu, Station Cards)
 * 2. FAQ Accordion Logic
 * 3. PJAX / Seamless Navigation Logic
 * 4. Search & Global API (Radio-Browser API) Integration
 * ------------------------------------------------------------------
 */

/* ------------------------------------------------------------------
1. Main Initialization
------------------------------------------------------------------- */
function initMainScripts () {
  // Slideshow Logic
  const slides = document.querySelectorAll('.header .slide')

  // Clear any existing slideshow intervals to prevent duplicates after PJAX
  if (window.mainSlideshowInterval) {
    clearInterval(window.mainSlideshowInterval)
  }

  let currentSlide = 0
  if (slides.length > 1) {
    window.mainSlideshowInterval = setInterval(() => {
      slides.forEach(slide => slide.classList.remove('active'))
      currentSlide = (currentSlide + 1) % slides.length
      slides[currentSlide].classList.add('active')
    }, 5000) // Change slide every 5 seconds
  }

  // Mobile Menu Logic
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn')
  const mobileDropdownMenu = document.querySelector('.mobile-dropdown-menu')
  const mobileMenuClose = document.querySelector('.mobile-menu-close')

  if (mobileMenuBtn && mobileDropdownMenu && mobileMenuClose) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileDropdownMenu.classList.add('open')
      document.body.style.overflow = 'hidden' // Prevent scrolling when menu is open
    })

    mobileMenuClose.addEventListener('click', () => {
      mobileDropdownMenu.classList.remove('open')
      document.body.style.overflow = '' // Restore scrolling
    })
  }

  // Scroll Down Logic
  const scrollDownBtn = document.querySelector('.vertical-line')
  if (scrollDownBtn) {
    scrollDownBtn.style.cursor = 'pointer'
    scrollDownBtn.addEventListener('click', () => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      })
    })
  }

  // Scroll Top Logic
  const scrollTopBtns = document.querySelectorAll('.scroll-top-btn')
  scrollTopBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    })
  })

  // Close Radio Shkala Logic
  const closeRadioBtns = document.querySelectorAll('.close-radio-shkala')
  closeRadioBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      const shkalaBox = this.closest('.radio-shkala-box')
      if (shkalaBox) {
        shkalaBox.style.display = 'none'
      }
    })
  })
}

// Global function for stations.html
window.hideStationCard = function (cardId) {
  const card = document.getElementById(cardId)
  if (card) card.style.display = 'none'
}

document.addEventListener('DOMContentLoaded', () => {
  initMainScripts()
  if (typeof window.rebindRadioUI === 'function') {
    window.rebindRadioUI()
  }
  if (typeof window.rebindStationCards === 'function') {
    window.rebindStationCards()
  }
  if (typeof window.initSearchRadio === 'function') {
    window.initSearchRadio()
  }
  if (typeof window.initBackgroundSync === 'function') {
    window.initBackgroundSync()
  }
})

// PJAX Interceptor for seamless page transitions
document.addEventListener('click', function (e) {
  const link = e.target.closest('a')
  if (link && link.host === window.location.host && !link.hasAttribute('download') && link.target !== '_blank') {
    const href = link.getAttribute('href')
    if (!href || href === '#' || href.startsWith('#') || href.startsWith('javascript:')) {
      return
    }
    // Only intercept if it's an internal HTML link and not an anchor link to same page
    if (link.pathname.endsWith('.html') || link.pathname === '/') {
      if (link.pathname === window.location.pathname && link.hash) {
        return
      }
      e.preventDefault()
      const url = link.href

      // Stop search radio if playing before transitioning
      if (window.searchAudioPlayer) {
        window.searchAudioPlayer.pause()
      }

      fetch(url)
        .then(res => res.text())
        .then(html => {
          const parser = new DOMParser()
          const newDoc = parser.parseFromString(html, 'text/html')

          // Replace title
          document.title = newDoc.title

          // Replace body class to ensure page-specific styling transitions correctly
          document.body.className = newDoc.body.className

          // Replace main container so we don't destroy scripts at the end of body
          const currentContainer = document.querySelector('.main-container')
          const newContainer = newDoc.querySelector('.main-container')

          if (currentContainer && newContainer) {
            currentContainer.innerHTML = newContainer.innerHTML
            currentContainer.className = newContainer.className
          } else {
            document.body.innerHTML = newDoc.body.innerHTML
          }

          window.scrollTo(0, 0)
          history.pushState(null, '', url)

          // Close mobile menu if it is open
          const mobileDropdownMenu = document.querySelector('.mobile-dropdown-menu')
          if (mobileDropdownMenu && mobileDropdownMenu.classList.contains('open')) {
            mobileDropdownMenu.classList.remove('open')
            document.body.style.overflow = ''
          }

          // Update mobile menu content to reflect active state
          const newMobileMenu = newDoc.querySelector('.mobile-dropdown-menu')
          if (mobileDropdownMenu && newMobileMenu) {
            mobileDropdownMenu.innerHTML = newMobileMenu.innerHTML
          }

          initMainScripts()
          if (typeof window.rebindRadioUI === 'function') {
            window.rebindRadioUI()
          }
          if (typeof window.rebindStationCards === 'function') {
            window.rebindStationCards()
          }
          if (typeof window.initSearchRadio === 'function') {
            window.initSearchRadio()
          }
          if (typeof window.syncBackgroundVideo === 'function') {
            window.syncBackgroundVideo()
          }
        })
        .catch(err => {
          console.error('PJAX error, falling back to standard navigation', err)
          window.location.href = url
        })
    }
  }
})

window.addEventListener('popstate', function () {
  // Stop search radio if playing before transitioning
  if (window.searchAudioPlayer) {
    window.searchAudioPlayer.pause()
  }

  fetch(window.location.href)
    .then(res => res.text())
    .then(html => {
      const parser = new DOMParser()
      const newDoc = parser.parseFromString(html, 'text/html')
      document.title = newDoc.title
      
      // Replace body class to ensure page-specific styling transitions correctly
      document.body.className = newDoc.body.className

      const currentContainer = document.querySelector('.main-container')
      const newContainer = newDoc.querySelector('.main-container')
      if (currentContainer && newContainer) {
        currentContainer.innerHTML = newContainer.innerHTML
        currentContainer.className = newContainer.className
      } else {
        document.body.innerHTML = newDoc.body.innerHTML
      }

      // Close mobile menu if it is open
      const mobileDropdownMenu = document.querySelector('.mobile-dropdown-menu')
      if (mobileDropdownMenu && mobileDropdownMenu.classList.contains('open')) {
        mobileDropdownMenu.classList.remove('open')
        document.body.style.overflow = ''
      }

      // Update mobile menu content to reflect active state
      const newMobileMenu = newDoc.querySelector('.mobile-dropdown-menu')
      if (mobileDropdownMenu && newMobileMenu) {
        mobileDropdownMenu.innerHTML = newMobileMenu.innerHTML
      }

      initMainScripts()
      if (typeof window.rebindRadioUI === 'function') {
        window.rebindRadioUI()
      }
      if (typeof window.rebindStationCards === 'function') {
        window.rebindStationCards()
      }
      if (typeof window.initSearchRadio === 'function') {
        window.initSearchRadio()
      }
      if (typeof window.syncBackgroundVideo === 'function') {
        window.syncBackgroundVideo()
      }
    })
})

// Standalone Search Radio Logic for stations.html
window.initSearchRadio = function () {
  const searchForm = document.getElementById('stationsSearchForm')
  const searchInput = document.getElementById('stationsSearchInput')
  const searchBtn = document.getElementById('stationsSearchBtn')
  const dropdownMenu = document.getElementById('searchDropdownMenu')

  if (!searchForm || !searchInput || !searchBtn || !dropdownMenu) return

  // Destroy old instance if exists to prevent duplicates
  if (window.searchAudioPlayer) {
    window.searchAudioPlayer.pause()
  }

  window.searchAudioPlayer = new Audio()
  // No need to fetch local stations anymore
  // allStations variable is removed

  // Remove old listeners from button to avoid duplicates in PJAX
  const newSearchBtn = searchBtn.cloneNode(true)
  searchBtn.parentNode.replaceChild(newSearchBtn, searchBtn)

  const newSearchInput = searchInput.cloneNode(true)
  searchInput.parentNode.replaceChild(newSearchInput, searchInput)

  newSearchBtn.addEventListener('click', function (e) {
    e.preventDefault()

    if (newSearchBtn.dataset.state === 'stop') {
      window.searchAudioPlayer.pause()
      setBtnState('play')
    } else if (newSearchBtn.dataset.state === 'play') {
      window.searchAudioPlayer.play()
      setBtnState('stop')
    } else {
      performSearch(newSearchInput.value)
    }
  })

  newSearchInput.addEventListener('input', function () {
    if (newSearchBtn.dataset.state === 'stop' || newSearchBtn.dataset.state === 'play') {
      window.searchAudioPlayer.pause()
      setBtnState('search')
      dropdownMenu.classList.remove('active')
    }
  })

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.stations-search-wrapper')) {
      dropdownMenu.classList.remove('active')
    }
  })

  function setBtnState (state) {
    newSearchBtn.dataset.state = state
    if (state === 'search') {
      newSearchBtn.innerHTML = '<i class="fa-light fa-magnifying-glass"></i>'
      newSearchBtn.classList.remove('playing')
    } else if (state === 'stop') {
      newSearchBtn.innerHTML = '<i class="fa-solid fa-stop"></i>'
      newSearchBtn.classList.add('playing')
    } else if (state === 'play') {
      newSearchBtn.innerHTML = '<i class="fa-solid fa-play"></i>'
      newSearchBtn.classList.add('playing')
    }
  }

  setBtnState('search')

  async function fetchFromRadioBrowser (query) {
    try {
      // Get a random server to balance load, or fallback to de1
      let baseUrl = 'https://de1.api.radio-browser.info'
      try {
        const serversRes = await fetch('https://all.api.radio-browser.info/json/servers')
        const servers = await serversRes.json()
        if (servers && servers.length > 0) {
          baseUrl = 'https://' + servers[0].name
        }
      } catch (e) {
        console.warn('Failed to fetch servers, using fallback', e)
      }

      // Search by name and limit to 15
      const res = await fetch(`${baseUrl}/json/stations/search?name=${encodeURIComponent(query)}&limit=15&hidebroken=true`)
      const data = await res.json()
      return data
    } catch (e) {
      console.error('Radio Browser API search failed', e)
      return []
    }
  }

  async function performSearch (query) {
    query = query.trim()

    if (!query) {
      dropdownMenu.classList.remove('active')
      return
    }

    dropdownMenu.innerHTML = '<div class="search-dropdown-no-results">Searching global database... <i class="fa-solid fa-spinner fa-spin"></i></div>'
    dropdownMenu.classList.add('active')

    const results = await fetchFromRadioBrowser(query)

    dropdownMenu.innerHTML = ''

    if (results.length === 0) {
      dropdownMenu.innerHTML = '<div class="search-dropdown-no-results">No stations found for "' + query + '"</div>'
    } else {
      results.forEach(station => {
        const item = document.createElement('div')
        item.className = 'search-dropdown-item'

        const imgSrc = station.favicon || 'images/logo.png'
        const tags = station.tags ? station.tags.split(',')[0].trim() : 'Radio'
        const country = station.country || 'Unknown'

        item.innerHTML = `
                    <img src="${imgSrc}" class="search-dropdown-item-img" alt="${station.name}" onerror="this.onerror=null; this.src='images/logo.png'">
                    <div class="search-dropdown-item-text">
                        <div class="search-dropdown-item-title">${station.name}</div>
                        <div class="search-dropdown-item-genre">${country} | ${tags}</div>
                    </div>
                `

        item.addEventListener('click', () => {
          dropdownMenu.classList.remove('active')

          window.searchAudioPlayer.src = station.url_resolved || station.url
          window.searchAudioPlayer.play()

          setBtnState('stop')
        })

        dropdownMenu.appendChild(item)
      })
    }
  }
}

// Central Background Video Sync Manager
window.initBackgroundSync = function () {
  const getPlayers = () => {
    const list = []
    if (window.audioPlayer) list.push(window.audioPlayer)
    if (window.cardsAudioPlayer) list.push(window.cardsAudioPlayer)
    if (window.searchAudioPlayer) list.push(window.searchAudioPlayer)
    if (window.tuningAudio) list.push(window.tuningAudio)
    return list
  }

  const syncVideo = () => {
    const video = document.querySelector('.background-video')
    if (!video) return

    // Check if any player is playing
    const activePlayers = getPlayers()
    const isAnyPlaying = activePlayers.some(p => p && !p.paused)

    if (isAnyPlaying) {
      if (!video.classList.contains('active')) {
        video.classList.add('active')
      }
      if (video.paused) {
        video.play().catch(e => console.log('Video play prevented:', e))
      }
    } else {
      if (video.classList.contains('active')) {
        video.classList.remove('active')
      }
      if (!video.paused) {
        video.pause()
      }
    }
  }

  // Add event listeners to a player if not already added
  const attachedPlayers = new WeakSet()
  const attachListeners = (player) => {
    if (!player || attachedPlayers.has(player)) return
    attachedPlayers.add(player)

    const events = ['play', 'playing', 'pause', 'ended', 'error']
    events.forEach(evt => {
      player.addEventListener(evt, syncVideo)
    })
  }

  // Hook all existing players
  const setupSync = () => {
    getPlayers().forEach(attachListeners)
    syncVideo()
  }

  // Poll for newly created searchAudioPlayer or others
  if (window.backgroundSyncInterval) {
    clearInterval(window.backgroundSyncInterval)
  }
  window.backgroundSyncInterval = setInterval(() => {
    getPlayers().forEach(attachListeners)
  }, 500) // Poll every 500ms

  setupSync()
  window.syncBackgroundVideo = syncVideo
}
