import Navbar from './NavBar'
import Footer from './Footer'
import styles from './index.module.less'

export default function Layout({ children }) {
  return (
    <>
      <Navbar />
      <div id='app-content' className={styles.layoutContainer}>
        {children}
      </div>
      <Footer />
    </>
  )
}
