import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>TrackProgress - Framework API - GOVUK DDAT</title>
        <meta name="description" content="TrackProgress - Framework API - GOVUK DDAT" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          GOVUK DDAT Skills Framework API
        </h1>
      </main>
    </div>
  )
}
