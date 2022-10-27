import Head from 'next/head'
import styles from './Visualizer.module.scss'
import {useEffect, useRef, useState} from "react";

const NumberOfBars = 100;

export default function Home() {
    const [lineHeights, setLineHeights] = useState<number[]>(Array(NumberOfBars).fill(0));
    const analyserRef = useRef<AnalyserNode>();
    const audioMediaStreamRef = useRef<MediaRecorder>();

    const getAudioBit = () => {
        if (analyserRef.current) {
            const bufferLength = analyserRef.current.frequencyBinCount;
            const data = new Uint8Array(bufferLength);
            analyserRef.current.getByteFrequencyData(data);
            const sliceLength = Math.floor(data.length / NumberOfBars / 2.4);
            const heightsVector: number[] = [];
            for (let i = 0; i < NumberOfBars; i++) {
                const freqSliced = data.slice(i * sliceLength, (i + 1) * sliceLength);
                const mean = freqSliced.reduce((a, b) => a + b, 0) / freqSliced.length * 0.5;
                heightsVector.push(Math.min(mean - mean / 4, 100));
            }
            setLineHeights(heightsVector);
        }
    }

    useEffect(() => {
        let interval: NodeJS.Timer;
        navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
            (window as any).persistAudioStream = stream;
            const audioCtx = new (window as any).AudioContext();
            const analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaStreamSource(stream);
            audioMediaStreamRef.current = new MediaRecorder(stream);
            source.connect(analyser);
            analyser.fftSize = 1024;
            analyserRef.current = analyser;
            interval = setInterval(getAudioBit, 32);
        })
        return () => {
            clearInterval(interval);
        }
    }, [])

    return (
        <div className={styles.container}>
            <Head>
                <title>Ramoliser</title>
                <meta name="description" content="Hehe, cute colors go bouncing on my screen"/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <div className={styles.visualizer}>
                {Array.from(Array(NumberOfBars).keys()).map((i) => (
                    <div key={i} style={{height: `${lineHeights[i]}%`, width: `${100 / NumberOfBars}%`}}
                         className={styles.bar}/>
                ))}
            </div>
        </div>
    )
}
