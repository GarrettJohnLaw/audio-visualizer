import React, { useEffect, useRef } from 'react'

const AudioVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)

  useEffect(() => {
    const startAudio = async () => {
      try {
        // Request permission and get the audio stream from the user's microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

        // Create a new audio context
        const audioContext = new AudioContext()
        audioContextRef.current = audioContext

        // Create an analyser node
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 2048
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

      // Get the time domain data (waveform)
      analyser.getByteTimeDomainData(dataArray)

      // Clear the canvas with a transparent fill for smooth fading effects
      canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.1)' // Fade effect
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT)

      // Start drawing a more abstract, circular visualization
      const centerX = WIDTH / 2
      const centerY = HEIGHT / 2
      const radius = Math.min(WIDTH, HEIGHT) / 4

      // Define a color gradient
      const gradient = canvasCtx.createLinearGradient(0, 0, WIDTH, HEIGHT)
      gradient.addColorStop(0, '#ff5f6d')
      gradient.addColorStop(1, '#ffc371')

      canvasCtx.lineWidth = 3
      canvasCtx.strokeStyle = gradient

      canvasCtx.beginPath()

      const sliceAngle = (Math.PI * 2) / dataArray.length
      let angle = 0

      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0 // Normalize the value
        const x = centerX + (radius + v * 50) * Math.cos(angle)
        const y = centerY + (radius + v * 50) * Math.sin(angle)

        if (i === 0) {
          canvasCtx.moveTo(x, y)
        } else {
          canvasCtx.lineTo(x, y)
        }

        angle += sliceAngle
      }

      canvasCtx.closePath()
      canvasCtx.stroke()

      // Optional: Add some abstract particles that respond to the audio
      //   for (let i = 0; i < 5; i++) {
      //     const particleX = centerX + (radius + Math.random() * 100) * Math.cos(angle + i)
      //     const particleY = centerY + (radius + Math.random() * 100) * Math.sin(angle + i)
      //     const size = Math.random() * 3 + 1

      //     canvasCtx.beginPath()
      //     canvasCtx.arc(particleX, particleY, size, 0, Math.PI * 2)
      //     canvasCtx.fillStyle = `rgba(255, 255, 255, ${Math.random()})`
      //     canvasCtx.fill()
      //   }
    }

    startAudio()

    return () => {
      // Cleanup on component unmount
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#000',
      }}
    >
      <canvas ref={canvasRef} width={800} height={400} style={{ border: '2px solid white' }} />
    </div>
  )
}

export default AudioVisualizer
