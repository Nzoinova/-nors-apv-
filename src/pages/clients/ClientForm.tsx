import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { createCliente } from '@/services/clients'

export default function ClientForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [nome, setNome] = useState('')
  const [nif, setNif] = useState('')
  const [contacto, setContacto] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [endereco, setEndereco] = useState('')

  const mutation = useMutation({
    mutationFn: createCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['resumo-clientes'] })
      navigate('/clientes')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome) return
    mutation.mutate({
      nome,
      nif: nif || null,
      contacto: contacto || null,
      telefone: telefone || null,
      email: email || null,
      endereco: endereco || null,
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link to="/clientes" className="inline-flex items-center gap-1.5 text-sm text-nors-teal hover:underline">
        <ArrowLeft size={16} /> Voltar
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">Novo Cliente</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            Nome / Razão Social <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: TRANSMAGO - CARGA GERAL, LDA."
            required
            className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              NIF
            </label>
            <input
              type="text"
              value={nif}
              onChange={(e) => setNif(e.target.value)}
              placeholder="Nº contribuinte"
              className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Pessoa de Contacto
            </label>
            <input
              type="text"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              placeholder="Nome do contacto"
              className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Telefone
            </label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="+244 9XX XXX XXX"
              className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@empresa.co.ao"
              className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            Endereço
          </label>
          <input
            type="text"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Morada completa"
            className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20"
          />
        </div>

        {mutation.error && (
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">
            Erro: {(mutation.error as Error).message}
          </div>
        )}

        <button
          type="submit"
          disabled={mutation.isPending || !nome}
          className="inline-flex items-center gap-2 bg-nors-teal text-white h-10 px-4 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          <Save size={16} />
          {mutation.isPending ? 'A guardar...' : 'Adicionar Cliente'}
        </button>
      </form>
    </div>
  )
}
