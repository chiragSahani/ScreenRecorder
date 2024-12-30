import React, { useState, useRef, useEffect } from 'react';
import { Video, Camera, StopCircle, Circle } from 'lucide-react';

interface Filter {
  name: string;
  color: string;
}

const filters: Filter[] = [
  { name: 'None', color: 'transparent' },
  { name: 'Orange', color: 'rgba(244, 160, 7, 0.3)' },
  { name: 'Brown', color: 'rgba(235, 11, 11, 0.3)' },
  { name: 'Pink', color: 'rgba(255, 192, 203, 0.3)' }
];

export default function ScreenRecorder() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTime, setRecordedTime] = useState('00:00:00');
  const [selectedFilter, setSelectedFilter] = useState<Filter>(filters[0]);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    startCamera();
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      clearInterval(timerRef.current);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  };

  const startRecording = () => {
    if (!videoRef.current?.srcObject) return;
    
    const stream = videoRef.current.srcObject as MediaStream;
    mediaRecorderRef.current = new MediaRecorder(stream);
    chunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${new Date().toISOString()}.webm`;
      a.click();
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
    startTimer();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      setRecordedTime('00:00:00');
    }
  };

  const startTimer = () => {
    let seconds = 0;
    timerRef.current = setInterval(() => {
      seconds++;
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      setRecordedTime(
        `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    }, 1000);
  };

  const captureScreenshot = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    
    const link = document.createElement('a');
    link.download = `screenshot-${new Date().toISOString()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="relative h-screen w-screen bg-gray-900">
      <div className="relative h-full w-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ backgroundColor: selectedFilter.color }}
        />
      </div>

      {/* Controls */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 space-y-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex h-16 w-16 items-center justify-center rounded-full border-4 border-white transition-all hover:scale-105 ${
            isRecording ? 'bg-red-500' : 'bg-transparent'
          }`}
        >
          {isRecording ? (
            <StopCircle className="h-8 w-8 text-white" />
          ) : (
            <Circle className="h-8 w-8 text-white" />
          )}
        </button>
        <button
          onClick={captureScreenshot}
          className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-transparent transition-all hover:scale-105"
        >
          <Camera className="h-8 w-8 text-white" />
        </button>
      </div>

      {/* Timer */}
      {isRecording && (
        <div className="absolute left-8 bottom-8">
          <h2 className="font-mono text-3xl font-bold text-cyan-400">
            {recordedTime}
          </h2>
        </div>
      )}

      {/* Filters */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 space-y-2">
        {filters.map((filter) => (
          <button
            key={filter.name}
            onClick={() => setSelectedFilter(filter)}
            className={`h-12 w-12 rounded-lg border-2 transition-all hover:scale-105 ${
              selectedFilter.name === filter.name
                ? 'border-cyan-400'
                : 'border-white'
            }`}
            style={{ backgroundColor: filter.color }}
          />
        ))}
      </div>
    </div>
  );
}