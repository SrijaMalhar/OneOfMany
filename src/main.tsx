import '@fontsource-variable/atkinson-hyperlegible-next/wght.css'
import '@fontsource/redaction/latin-400.css'
import '@fontsource/redaction/latin-700.css'
import '@fontsource/redaction-50/latin-400.css'
import './styles.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Root from './Root'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
