import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SWRConfig } from 'swr'
import './index.css'
import App from './App.tsx'
import OpticalCablePage from './pages/OpticalCablePage.tsx'

function resolvePage(): 'dashboard' | 'optical-cable' {
	const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
	if (pathname.endsWith('/optical-cable')) return 'optical-cable'
	const view = new URLSearchParams(window.location.search).get('view')
	return view === 'optical-cable' ? 'optical-cable' : 'dashboard'
}

const page = resolvePage()
const PageComponent = page === 'optical-cable' ? OpticalCablePage : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        dedupingInterval: 10_000,
        errorRetryCount: 2,
      }}
    >
      <PageComponent />
    </SWRConfig>
  </StrictMode>,
)
