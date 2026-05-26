"use strict";

// Independent audio player for station cards
const cardsAudioPlayer = new Audio()
window.cardsAudioPlayer = cardsAudioPlayer
let isCardsPlaying = false

const ALL_STATION_URLS = [
  'https://az1.mediacp.eu/listen/100greatestclassicalmusic/radio.mp3',
  'https://a.files.bbci.co.uk/ms6/live/3441A116-B12E-4D2F-ACA8-C1984642FA4B/audio/simulcast/hls/nonuk/pc_hd_abr_v2/cf/bbc_radio_one.m3u8',
  'https://icecast.omroep.nl/radio2-bb-mp3',
  'http://strm112.1.fm/samba_mobile_mp3',
  'https://icecast.omroep.nl/3fm-bb-mp3',
  'https://icecast.omroep.nl/radio4-bb-mp3',
  'https://icestreaming.rai.it/13.mp3',
  'https://playerservices.streamtheworld.com/api/livestream-redirect/ACIR22_s01AAC.aac'
]

window.rebindStationCards = function () {
  const cardPlayBtns = document.querySelectorAll('.sp-card-play-btn, .card-play-btn')
  cardPlayBtns.forEach(btn => {
    const streamUrl = btn.getAttribute('data-stream-url')
    const card = btn.closest('.stations-page-card, .station-card')

    // Remove old listeners by cloning
    const newBtn = btn.cloneNode(true)
    btn.parentNode.replaceChild(newBtn, btn)

    // Restore correct icon state based on what's currently playing in THIS player
    if (isCardsPlaying && cardsAudioPlayer.getAttribute('src') === streamUrl) {
      newBtn.innerHTML = '<i class="fa-light fa-pause"></i>'
      newBtn.classList.add('playing')
      if (card) card.classList.add('is-playing')
    } else {
      newBtn.innerHTML = '<i class="fa-light fa-play"></i>'
      newBtn.classList.remove('playing')
      if (card) card.classList.remove('is-playing')
    }

    // Add event listener
    newBtn.addEventListener('click', (e) => {
      e.preventDefault()

      // If clicking the currently playing stream
      if (cardsAudioPlayer.getAttribute('src') === streamUrl && isCardsPlaying) {
        cardsAudioPlayer.pause()
      } else {
        cardsAudioPlayer.setAttribute('src', streamUrl)
        cardsAudioPlayer.play().catch(err => console.error('Card audio playback failed:', err))
      }
    })
  })

  // Rebind Listen Live button
  const listenLiveBtns = document.querySelectorAll('.listen-live-button')
  listenLiveBtns.forEach(btn => {
    const newBtn = btn.cloneNode(true)
    btn.parentNode.replaceChild(newBtn, btn)

    const textSpan = newBtn.querySelector('.btn-text')
    if (isCardsPlaying) {
      newBtn.classList.add('is-playing')
      if (textSpan) textSpan.textContent = 'STOP LIVE'
    } else {
      newBtn.classList.remove('is-playing')
      if (textSpan) textSpan.textContent = 'LISTEN LIVE'
    }

    newBtn.addEventListener('click', (e) => {
      e.preventDefault()
      if (isCardsPlaying) {
        cardsAudioPlayer.pause()
      } else if (cardsAudioPlayer.getAttribute('src')) {
        // If there's a loaded source, play it
        cardsAudioPlayer.play().catch(err => console.error('Listen Live playback failed:', err))
      } else {
        // If no source is loaded, try to play a random stream
        const randomUrl = ALL_STATION_URLS[Math.floor(Math.random() * ALL_STATION_URLS.length)]
        cardsAudioPlayer.setAttribute('src', randomUrl)
        cardsAudioPlayer.play().catch(err => console.error('Listen Live playback failed:', err))
      }
    })
  })

  // Rebind Listen Now button
  const listenNowBtns = document.querySelectorAll('.listen-now')
  listenNowBtns.forEach(btn => {
    const newBtn = btn.cloneNode(true)
    btn.parentNode.replaceChild(newBtn, btn)

    const icon = newBtn.querySelector('i')

    if (isCardsPlaying) {
      newBtn.classList.add('is-playing')
      if (icon) icon.className = 'fa-solid fa-pause'
    } else {
      newBtn.classList.remove('is-playing')
      if (icon) icon.className = 'fa-solid fa-play'
    }

    newBtn.addEventListener('click', (e) => {
      e.preventDefault()
      if (isCardsPlaying) {
        cardsAudioPlayer.pause()
      } else if (cardsAudioPlayer.getAttribute('src')) {
        cardsAudioPlayer.play().catch(err => console.error('Listen Now playback failed:', err))
      } else {
        const randomUrl = ALL_STATION_URLS[Math.floor(Math.random() * ALL_STATION_URLS.length)]
        cardsAudioPlayer.setAttribute('src', randomUrl)
        cardsAudioPlayer.play().catch(err => console.error('Listen Now playback failed:', err))
      }
    })
  })
}

// Sync UI on play
cardsAudioPlayer.addEventListener('playing', () => {
  isCardsPlaying = true
  document.querySelectorAll('.sp-card-play-btn, .card-play-btn').forEach(btn => {
    const card = btn.closest('.stations-page-card, .station-card')
    if (btn.getAttribute('data-stream-url') === cardsAudioPlayer.getAttribute('src')) {
      btn.innerHTML = '<i class="fa-light fa-pause"></i>'
      btn.classList.add('playing')
      if (card) card.classList.add('is-playing')
    } else {
      btn.innerHTML = '<i class="fa-light fa-play"></i>'
      btn.classList.remove('playing')
      if (card) card.classList.remove('is-playing')
    }
  })
  document.querySelectorAll('.listen-live-button').forEach(btn => {
    btn.classList.add('is-playing')
    const textSpan = btn.querySelector('.btn-text')
    if (textSpan) textSpan.textContent = 'STOP LIVE'
  })
  document.querySelectorAll('.listen-now').forEach(btn => {
    btn.classList.add('is-playing')
    const icon = btn.querySelector('i')
    if (icon) icon.className = 'fa-solid fa-pause'
  })
})

// Sync UI on pause/error
cardsAudioPlayer.addEventListener('pause', () => {
  isCardsPlaying = false
  document.querySelectorAll('.sp-card-play-btn, .card-play-btn').forEach(btn => {
    btn.innerHTML = '<i class="fa-light fa-play"></i>'
    btn.classList.remove('playing')
    const card = btn.closest('.stations-page-card, .station-card')
    if (card) card.classList.remove('is-playing')
  })
  document.querySelectorAll('.listen-live-button').forEach(btn => {
    btn.classList.remove('is-playing')
    const textSpan = btn.querySelector('.btn-text')
    if (textSpan) textSpan.textContent = 'LISTEN LIVE'
  })
  document.querySelectorAll('.listen-now').forEach(btn => {
    btn.classList.remove('is-playing')
    const icon = btn.querySelector('i')
    if (icon) icon.className = 'fa-solid fa-play'
  })
})

cardsAudioPlayer.addEventListener('error', () => {
  isCardsPlaying = false
  document.querySelectorAll('.sp-card-play-btn, .card-play-btn').forEach(btn => {
    btn.innerHTML = '<i class="fa-light fa-play"></i>'
    btn.classList.remove('playing')
    const card = btn.closest('.stations-page-card, .station-card')
    if (card) card.classList.remove('is-playing')
  })
  document.querySelectorAll('.listen-live-button').forEach(btn => {
    btn.classList.remove('is-playing')
  })
  document.querySelectorAll('.listen-now').forEach(btn => {
    btn.classList.remove('is-playing')
    const icon = btn.querySelector('i')
    if (icon) icon.className = 'fa-solid fa-play'
  })
  console.error('Card audio stream error')
})

document.addEventListener('DOMContentLoaded', () => {
  window.rebindStationCards()
})

// Station Card UI interactions (moved from inline script)
window.hideStationCard = function (cardId) {
  const card = document.getElementById(cardId)
  if (card) {
    card.style.display = 'none'
  }
}

window.showClearModal = function () {
  const modal = document.getElementById('clearAllModal')
  if (modal) {
    modal.classList.add('active')
  }
}

window.closeClearModal = function () {
  const modal = document.getElementById('clearAllModal')
  if (modal) {
    modal.classList.remove('active')
  }
}

window.confirmClearAll = function () {
  const cards = document.querySelectorAll('.stations-page-card')
  cards.forEach(card => {
    card.style.display = 'none'
  })
  window.closeClearModal()
}
