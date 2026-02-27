import { HashRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import ContractsList from '@/pages/contracts/ContractsList'
import ContractDetail from '@/pages/contracts/ContractDetail'
import ContractForm from '@/pages/contracts/ContractForm'
import VehiclesList from '@/pages/vehicles/VehiclesList'
import VehicleForm from '@/pages/vehicles/VehicleForm'
import ServiceOrdersList from '@/pages/service-orders/ServiceOrdersList'
import ServiceOrderForm from '@/pages/service-orders/ServiceOrderForm'
import ClientsList from '@/pages/clients/ClientsList'
import ClientForm from '@/pages/clients/ClientForm'
import Settings from '@/pages/settings/Settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/contratos" element={<ContractsList />} />
            <Route path="/contratos/novo" element={<ContractForm />} />
            <Route path="/contratos/:id" element={<ContractDetail />} />
            <Route path="/viaturas" element={<VehiclesList />} />
            <Route path="/viaturas/nova" element={<VehicleForm />} />
            <Route path="/os" element={<ServiceOrdersList />} />
            <Route path="/os/nova" element={<ServiceOrderForm />} />
            <Route path="/clientes" element={<ClientsList />} />
            <Route path="/clientes/novo" element={<ClientForm />} />
            <Route path="/configuracoes" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  )
}
