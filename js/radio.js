"use strict";

/**
 * ------------------------------------------------------------------
 * [Table of contents]
 *
 * 1. Global Variables & Audio State
 * 2. Audio Player Event Listeners (Syncing UI & Loading States)
 * 3. Fetching Stations JSON & Rendering Radio Scale
 * 4. Header Radio Player Controls (Play/Pause/Draggable Timeline)
 * 5. Syncing Independent Station Cards (Grid/List UI)
 * ------------------------------------------------------------------
 */

/* ------------------------------------------------------------------
1. Global Variables & Audio State
------------------------------------------------------------------- */
// Create Audio Element globally so it persists across PJAX
const audioPlayer = new Audio()
window.audioPlayer = audioPlayer
let isPlaying = false
let stations = []

// Tuning Sound Effect
const tuningAudio = new Audio('assets/sound/140157__copyc4t__fm-radio-tuning-sweeps.flac')
tuningAudio.loop = true // Loop when the sound ends
window.tuningAudio = tuningAudio

// Audio Player Events for "Please wait..." message
audioPlayer.addEventListener('waiting', () => {
  const waitMsg = document.querySelector('.please-wait-msg')
  if (waitMsg) waitMsg.style.opacity = '1'
})

audioPlayer.addEventListener('playing', () => {
  const waitMsg = document.querySelector('.please-wait-msg')
  if (waitMsg) waitMsg.style.opacity = '0'

  // Sync top UI
  const radioPlayBtn = document.querySelector('.radio-play-btn')
  if (radioPlayBtn) {
    radioPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>'
    radioPlayBtn.classList.add('playing')
  }
})

audioPlayer.addEventListener('canplay', () => {
  const waitMsg = document.querySelector('.please-wait-msg')
  if (waitMsg) waitMsg.style.opacity = '0'
})

audioPlayer.addEventListener('pause', () => {
  const waitMsg = document.querySelector('.please-wait-msg')
  if (waitMsg) waitMsg.style.opacity = '0'

  // Sync top UI
  const radioPlayBtn = document.querySelector('.radio-play-btn')
  if (radioPlayBtn) {
    radioPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>'
    radioPlayBtn.classList.remove('playing')
  }
})

audioPlayer.addEventListener('error', () => {
  const waitMsg = document.querySelector('.please-wait-msg')
  if (waitMsg) {
    waitMsg.style.opacity = '0'
    console.error('Audio stream error')
  }
})

// Scale Settings
const minFreq = 88
const maxFreq = 120
let currentFreq = 88 // Starting frequency
let isSearching = false
let searchDirection = 1 // 1 for right, -1 for left
let searchInterval
const searchSpeed = 0.1 // Frequency step per tick

// Fetch stations from JSON
fetch('assets/data/stations.json')
  .then(response => response.json())
  .then(data => {
    stations = data
    console.log('Stations loaded:', stations)
    // Check if there's a stored frequency, otherwise default to the first station
    const storedFreq = localStorage.getItem('radioFrequency')
    if (storedFreq) {
      currentFreq = parseFloat(storedFreq)
    } else if (stations.length > 0) {
      currentFreq = stations[0].frequency
    }

    // Init UI immediately for the first load
    window.rebindRadioUI()
  })
  .catch(error => console.error('Error loading stations:', error))

// We define startSearch and stopSearch globally so they can access the variables
function startSearch (direction) {
  if (isSearching) return

  // Prevent searching left if already at minFreq, or right if at maxFreq
  if (direction === -1 && currentFreq <= minFreq) return
  if (direction === 1 && currentFreq >= maxFreq) return

  isSearching = true
  searchDirection = direction

  // Stop current audio if playing
  audioPlayer.pause()
  isPlaying = false
  const radioPlayBtn = document.querySelector('.radio-play-btn')
  if (radioPlayBtn) {
    radioPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>'
    radioPlayBtn.classList.remove('playing')
  }

  // Play tuning sound effect
  tuningAudio.play().catch(e => console.log('Tuning audio play prevented:', e))

  searchInterval = setInterval(() => {
    currentFreq += searchSpeed * searchDirection
    localStorage.setItem('radioFrequency', currentFreq)

    // Check bounds and stop if reached
    if (currentFreq >= maxFreq && searchDirection === 1) {
      currentFreq = maxFreq
      window.rebindRadioUI() // Update UI
      stopSearch(null) // Stop without finding a station
      return
    }
    if (currentFreq <= minFreq && searchDirection === -1) {
      currentFreq = minFreq
      window.rebindRadioUI() // Update UI
      stopSearch(null) // Stop without finding a station
      return
    }

    window.rebindRadioUI() // Update UI position

    // Check if we hit a station
    const epsilon = searchSpeed / 2
    const foundStation = stations.find(station => Math.abs(station.frequency - currentFreq) <= epsilon)

    if (foundStation) {
      stopSearch(foundStation)
    }
  }, 50) // Tick every 50ms
}

function stopSearch (station) {
  clearInterval(searchInterval)
  isSearching = false

  // Pause tuning sound where it stopped
  tuningAudio.pause()

  // If a station was found, snap to it and play
  if (station) {
    currentFreq = station.frequency
    localStorage.setItem('radioFrequency', currentFreq)
    window.rebindRadioUI() // Snap UI position and image

    // Play audio
    const waitMsg = document.querySelector('.please-wait-msg')
    if (waitMsg) waitMsg.style.opacity = '1'

    audioPlayer.src = station.url
    audioPlayer.play()
      .then(() => {
        isPlaying = true
        const radioPlayBtn = document.querySelector('.radio-play-btn')
        if (radioPlayBtn) {
          radioPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>'
          radioPlayBtn.classList.add('playing')
        }
      })
      .catch(error => {
        console.error('Audio playback failed:', error)
      })
  }
}

// PJAX friendly rebinding function
window.rebindRadioUI = function () {
  const btnLeft = document.getElementById('btn-scale-left')
  const btnRight = document.getElementById('btn-scale-right')
  const needle = document.getElementById('radio-needle')
  const radioPlayBtn = document.querySelector('.radio-play-btn')
  const radioImage = document.querySelector('.radio-shkala-box .rectangle')
  const shkalaBox = document.querySelector('.radio-shkala-box')

  // Create Please Wait message if it doesn't exist
  let waitMsg = document.querySelector('.please-wait-msg')
  if (!waitMsg && shkalaBox) {
    waitMsg = document.createElement('div')
    waitMsg.className = 'please-wait-msg'
    waitMsg.innerText = 'Please wait...'
    waitMsg.style.position = 'absolute'
    waitMsg.style.bottom = '15px'
    waitMsg.style.right = '40px'
    waitMsg.style.fontFamily = '"Outfit", Helvetica, sans-serif'
    waitMsg.style.fontSize = '12px'
    waitMsg.style.color = '#ff4d00' // Var primary-orange
    waitMsg.style.fontWeight = '600'
    waitMsg.style.opacity = '0'
    waitMsg.style.transition = 'opacity 0.3s ease'
    waitMsg.style.pointerEvents = 'none'
    shkalaBox.appendChild(waitMsg)
  }

  // Restore Needle Position
  if (needle) {
    const percentage = ((currentFreq - minFreq) / (maxFreq - minFreq)) * 100
    needle.style.left = `${percentage}%`
  }

  // Restore Radio Image
  const currentStation = stations.find(s => Math.abs(s.frequency - currentFreq) < 0.05)
  if (radioImage && currentStation && currentStation.image) {
    radioImage.src = currentStation.image
  }

  // Restore Play Button State
  if (radioPlayBtn) {
    if (isPlaying) {
      radioPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>'
      radioPlayBtn.classList.add('playing')
    } else {
      radioPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>'
      radioPlayBtn.classList.remove('playing')
    }

    // Remove old listeners by replacing the node (safest way to avoid duplicate listeners)
    const newPlayBtn = radioPlayBtn.cloneNode(true)
    radioPlayBtn.parentNode.replaceChild(newPlayBtn, radioPlayBtn)

    newPlayBtn.addEventListener('click', () => {
      if (isPlaying) {
        audioPlayer.pause()
        isPlaying = false
      } else if (audioPlayer.src) {
        const waitMsg = document.querySelector('.please-wait-msg')
        if (waitMsg) waitMsg.style.opacity = '1'
        audioPlayer.play()
        isPlaying = true
      } else {
        startSearch(1)
      }
    })
  }

  // Restore Arrow Listeners
  if (btnLeft && btnRight) {
    const newLeft = btnLeft.cloneNode(true)
    btnLeft.parentNode.replaceChild(newLeft, btnLeft)
    newLeft.addEventListener('click', () => startSearch(-1))

    const newRight = btnRight.cloneNode(true)
    btnRight.parentNode.replaceChild(newRight, btnRight)
    newRight.addEventListener('click', () => startSearch(1))
  }
}

// Also listen for regular DOMContentLoaded for the first page load
document.addEventListener('DOMContentLoaded', () => {
  window.rebindRadioUI()
})
