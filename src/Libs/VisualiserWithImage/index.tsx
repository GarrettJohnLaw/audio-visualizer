import React, { useEffect, useRef } from 'react'

const AudioVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const imgRef = useRef<HTMLImageElement>(new Image())

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }
    }

    // Set initial canvas size and add resize event listener
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const startAudio = async () => {
      try {
        // Request permission and get the audio stream from the user's microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

        // Create a new audio context
        const audioContext = new AudioContext()
        audioContextRef.current = audioContext

        // Create an analyser node
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 1024 // Lower fftSize for better low-frequency response
        analyserRef.current = analyser

        // Connect the microphone stream to the analyser
        const source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)

        // Create a data array to hold the frequency data
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        dataArrayRef.current = dataArray

        // Start the animation loop to visualize the audio
        draw()
      } catch (err) {
        console.error('Error accessing microphone:', err)
      }
    }

    const draw = () => {
      const canvas = canvasRef.current
      const canvasCtx = canvas?.getContext('2d')
      const analyser = analyserRef.current
      const dataArray = dataArrayRef.current

      if (!canvas || !canvasCtx || !analyser || !dataArray) return

      const WIDTH = canvas.width
      const HEIGHT = canvas.height

      requestAnimationFrame(draw)

      // Get audio frequency data (waveform)
      analyser.getByteTimeDomainData(dataArray)

      // Clear the canvas and draw the background image
      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT)
      if (imgRef.current) {
        canvasCtx.drawImage(imgRef.current, 0, 0, WIDTH, HEIGHT)
      }

      // Set up wave motion parameters
      const baseAmplitude = 20 // Base amplitude for calm wave effect
      const frequencyFactor = 0.005 // Controls wave frequency based on audio input
      const audioAmplitude = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length

      // Adjust wave parameters based on audio dynamics
      const waveHeight = baseAmplitude + audioAmplitude / 10 // Higher amplitude for louder sounds
      const waveSpeed = 0.002 + audioAmplitude / 50000 // Speed up with audio intensity

      // Generate wave distortion effect
      for (let y = 0; y < HEIGHT; y += 5) {
        // Calculate wave offset based on audio data
        const offset = dataArray[y % dataArray.length] / 128.0 - 1
        const waveOffset =
          Math.sin((y + Date.now() * waveSpeed) * frequencyFactor) * offset * waveHeight

        // Apply wave distortion effect with smooth blending
        canvasCtx.drawImage(canvas, 0, y, WIDTH, 5, waveOffset, y, WIDTH, 5)
      }
    }

    imgRef.current.src = 'ocean-sunset.jpg' // Path to the uploaded image
    startAudio()

    return () => {
      // Cleanup on component unmount
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      window.removeEventListener('resize', resizeCanvas) // Remove resize event listener
    }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#000',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
}

export default AudioVisualizer
