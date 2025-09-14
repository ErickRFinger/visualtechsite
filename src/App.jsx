import { useState, useEffect, useRef } from 'react'
import visualLogo from './logo/Visual.png'
import './App.css'
import React from 'react'

// Sistema de animações de scroll otimizado - SEM LOOP INFINITO
function useScrollAnimation() {
  const elementRef = useRef(null)

  useEffect(() => {
    const currentElement = elementRef.current
    if (!currentElement) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !entry.target.classList.contains('animate-in')) {
            entry.target.classList.add('animate-in')
          }
        })
      },
      { 
        threshold: 0.1, 
        rootMargin: '0px 0px -50px 0px' 
      }
    )

    observer.observe(currentElement)

    return () => {
      observer.unobserve(currentElement)
      observer.disconnect()
    }
  }, [])

  return elementRef
}

const TABS = {
  QUEM_SOMOS: 'Quem Somos?',
  SERVICOS: 'Serviços',
  PRODUTOS: 'Loja',
  ORCAMENTOS: 'Orçamentos',
  TECNICO: 'Técnico',
  PLANOS: 'Nossos Planos',
  PACOTES: 'Pacotes',
  DESENVOLVIMENTO: 'Desenvolvimento',
}

function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

const quemSomosTexto = `A VisualTech é uma empresa fundada em 2024 por Erick Finger, dedicada a oferecer soluções completas e inovadoras em tecnologia e computação. Atuamos desde a montagem e manutenção de computadores até o desenvolvimento de sistemas personalizados e tecnologias próprias, sempre com foco em qualidade, confiança e excelência no atendimento.`

function App() {
  const [form, setForm] = useState({ 
    nome: '', 
    email: '', 
    telefone: '', 
    mensagem: '',
    empresa: '',
    tipoServico: '',
    urgencia: '',
    orcamentoPor: '',
    horarioContato: ''
  })
  const [showWelcome, setShowWelcome] = useState(true)
  const [tab, setTab] = useState(TABS.QUEM_SOMOS)
  const [detectedMobile, setDetectedMobile] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [produtos, setProdutos] = useState([])
  const [loadingProdutos, setLoadingProdutos] = useState(false)

  // Função para buscar produtos da planilha Google Sheets
  const buscarProdutos = async () => {
    setLoadingProdutos(true)
    try {
      // URL da planilha convertida para CSV
      const sheetUrl = 'https://docs.google.com/spreadsheets/d/1owH6uqguBmgg61xGGw9ul_QTTYfox1ffsPEnvcUTtkE/export?format=csv&gid=0'
      
      const response = await fetch(sheetUrl)
      const csvText = await response.text()
      
      // Converter CSV para array de objetos - método mais robusto
      const lines = csvText.split('\n').filter(line => line.trim())
      const produtosData = []
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue
        
        // Dividir por vírgula, mas tratar aspas corretamente
        const values = []
        let current = ''
        let inQuotes = false
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j]
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        values.push(current.trim()) // Último valor
        
        if (values.length >= 7 && values[0] && values[0] !== '') {
          // Processar URL da imagem da coluna D (índice 3)
          let fotoUrl = values[3] ? values[3].replace(/"/g, '').trim() : ''
          
          // Converter URL do Imgur para formato direto (baseado no sistema do site de vendas)
          if (fotoUrl && fotoUrl !== '') {
            if (fotoUrl.includes('imgur.com')) {
              // Converter diferentes formatos do Imgur
              if (fotoUrl.includes('/a/')) {
                // Album: https://imgur.com/a/abc123 -> não pode converter diretamente
                console.log('⚠️ URL de album do Imgur detectada:', fotoUrl)
                fotoUrl = 'https://via.placeholder.com/400x300/6B7280/FFFFFF?text=Album+Imgur'
              } else if (fotoUrl.includes('i.imgur.com')) {
                // Já está no formato correto
                console.log('✅ URL do Imgur já está no formato correto')
              } else {
                // Converter https://imgur.com/p8jsjyx para https://i.imgur.com/p8jsjyx.jpg
                const imgurId = fotoUrl.split('/').pop().split('?')[0] // Remove query params
                fotoUrl = `https://i.imgur.com/${imgurId}.jpg`
                console.log('🔄 URL do Imgur convertida:', fotoUrl)
              }
            } else if (fotoUrl.includes('drive.google.com')) {
              // Converter Google Drive para formato direto
              const fileId = fotoUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)
              if (fileId) {
                fotoUrl = `https://drive.google.com/uc?id=${fileId[1]}`
                console.log('🔄 URL do Google Drive convertida:', fotoUrl)
              }
            } else if (!fotoUrl.startsWith('http')) {
              // Se não começar com http, usar placeholder
              console.log('⚠️ URL inválida, usando placeholder:', fotoUrl)
              fotoUrl = 'https://via.placeholder.com/400x300/6B7280/FFFFFF?text=Imagem+Não+Disponível'
            }
          } else {
            // Se não há URL, usar placeholder
            fotoUrl = 'https://via.placeholder.com/400x300/6B7280/FFFFFF?text=Sem+Imagem'
          }
          
          const produto = {
            nome: values[0].replace(/"/g, ''),
            id: values[1].replace(/"/g, ''),
            descricao: values[2].replace(/"/g, ''),
            foto: fotoUrl,
            estoque: values[4].replace(/"/g, ''),
            valor: values[5].replace(/"/g, ''),
            categoria: values[6].replace(/"/g, '')
          }
          produtosData.push(produto)
        }
      }
      
      setProdutos(produtosData)
      console.log('Produtos carregados:', produtosData.length)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      // Produtos padrão com imagens que funcionam 100%
      setProdutos([
        {
          nome: 'NOTEBOOK NITRO 5',
          id: '1',
          descricao: 'NOTEBOOK NITRO 5 - RYZEN 7 4800H, GTX 1650, 20GB RAM E SSD NVME DE 960GB - 15.6" 144HZ',
          foto: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGY0NmV1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5OT1RFQk9PSzwvdGV4dD48L3N2Zz4=',
          estoque: '1',
          valor: 'R$ 4.500,00',
          categoria: 'NOTEBOOK'
        },
        {
          nome: 'PROCESSADOR I5 11400',
          id: '2',
          descricao: 'PROCESSADOR INTEL CORE I5 11400',
          foto: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDU5NjY5Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QUk9DRVNTQURPUjwvdGV4dD48L3N2Zz4=',
          estoque: '1',
          valor: 'R$ 950,00',
          categoria: 'PROCESSADOR'
        },
        {
          nome: 'PLACA MÃE H510M-D',
          id: '3',
          descricao: 'PLACA MÃE ASUS H510M-D - LGA1200',
          foto: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGMyNjI2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QTEFDQSBNAUU8L3RleHQ+PC9zdmc+',
          estoque: '1',
          valor: 'R$ 550,00',
          categoria: 'PLACA-MÃE'
        },
        {
          nome: 'SSD M2 WD GREEN 120GB',
          id: '4',
          descricao: 'SSD WD GREEN DE 120GB DE ARMAZENAMENTO, CONEXÃO M2',
          foto: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjN2MzYWVkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TU0QgTTI8L3RleHQ+PC9zdmc+',
          estoque: '3',
          valor: 'R$ 110,00',
          categoria: 'DISCO'
        },
        {
          nome: 'SSD SATA HIKVISION 240GB',
          id: '5',
          descricao: 'SSD HIKVISION DE 240GB DE ARMAZENAMENTO, CONEXÃO SATA',
          foto: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWE1ODBjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TU0QgU0FUQTwvdGV4dD48L3N2Zz4=',
          estoque: '2',
          valor: 'R$ 130,00',
          categoria: 'DISCO'
        },
        {
          nome: 'HD SEAGATE BARRACUDA 1TB - DESKTOP',
          id: '8',
          descricao: 'HD SEAGATE DE 1 TB DE ARMAZENAMENTO - MODELO DE DESKTOP',
          foto: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTZhMzRhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5IRCBTRUFHQVRFPC90ZXh0Pjwvc3ZnPg==',
          estoque: '16',
          valor: 'R$ 150,00',
          categoria: 'DISCO'
        }
      ])
    } finally {
      setLoadingProdutos(false)
    }
  }

  React.useEffect(() => {
    setDetectedMobile(isMobileDevice())
    const timer = setTimeout(() => setShowWelcome(false), 2500)
    
    // Carregar produtos inicialmente
    buscarProdutos()
    
    // Configurar sincronização automática a cada 2 minutos
    const syncInterval = setInterval(buscarProdutos, 120000) // 2 minutos
    
    return () => {
      clearTimeout(timer)
      clearInterval(syncInterval)
    }
  }, [])

  // Scroll para o topo sempre que trocar de aba
  React.useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    })
  }, [tab])

  // Event listener para tecla Q - Solicitar orçamento
  React.useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key.toLowerCase() === 'q' && !showWelcome) {
        // Simular clique no botão "Solicite um Orçamento"
        const orcamentoButton = document.querySelector('.cta-btn')
        if (orcamentoButton) {
          orcamentoButton.click()
          // Adicionar notificação de atalho usado
          addNotification('Atalho de teclado ativado! Tecla Q pressionada.', 'success')
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [showWelcome])

  // Fechar busca quando clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowSearch(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fechar menu mobile quando clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('.menu-central') && !event.target.closest('.mobile-menu-toggle')) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [mobileMenuOpen])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const addNotification = (message, type = 'success') => {
    const id = Date.now()
    const newNotification = { id, message, type }
    setNotifications(prev => [...prev, newNotification])
    
    // Auto-remove após 5 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const results = []
    const searchTerm = query.toLowerCase()

      // Busca inteligente com produtos dinâmicos
      const searchData = [
        // Serviços
        { type: 'serviço', title: 'Formatação Windows 10', tab: TABS.SERVICOS, keywords: ['formatação', 'windows', '10', 'formata', 'sistema', 'reset'] },
        { type: 'serviço', title: 'Formatação Windows 11', tab: TABS.SERVICOS, keywords: ['formatação', 'windows', '11', 'formata', 'sistema', 'reset'] },
        { type: 'serviço', title: 'Montagem de Computador', tab: TABS.SERVICOS, keywords: ['montagem', 'computador', 'pc', 'desktop', 'gabinete', 'hardware'] },
        { type: 'serviço', title: 'Otimização de Sistema', tab: TABS.SERVICOS, keywords: ['otimização', 'sistema', 'windows', 'performance', 'velocidade', 'lento'] },
        { type: 'serviço', title: 'Limpeza + Otimização', tab: TABS.SERVICOS, keywords: ['limpeza', 'otimização', 'manutenção', 'computador', 'sistema'] },
        { type: 'serviço', title: 'Clonagem de Sistema', tab: TABS.SERVICOS, keywords: ['clonagem', 'clone', 'backup', 'sistema', 'disco', 'hd'] },
        
        // Produtos dinâmicos da planilha
        ...produtos.map(produto => ({
          type: 'produto',
          title: produto.nome,
          tab: TABS.PRODUTOS,
          keywords: [
            produto.nome.toLowerCase(),
            produto.categoria.toLowerCase(),
            produto.valor.toLowerCase(),
            ...produto.descricao.toLowerCase().split(' '),
            ...produto.nome.toLowerCase().split(' ')
          ]
        })),
        
        // Pacotes
        { type: 'pacote', title: 'Pacote Empresarial', tab: TABS.PACOTES, keywords: ['pacote', 'empresarial', 'gestor', 'empresa', 'produtividade'] },
        { type: 'pacote', title: 'Pacote Gaming', tab: TABS.PACOTES, keywords: ['pacote', 'gaming', 'jogos', 'overlay', 'performance', 'fps'] },
        
        // Planos
        { type: 'plano', title: 'Plano Mensal - Otimização', tab: TABS.PLANOS, keywords: ['plano', 'mensal', 'mensalidade', 'otimização', 'sistema', 'mensal'] },
        
        // Desenvolvimento
        { type: 'desenvolvimento', title: 'Sites Institucionais', tab: TABS.DESENVOLVIMENTO, keywords: ['site', 'web', 'institucional', 'empresa', 'landing', 'página'] },
        { type: 'desenvolvimento', title: 'E-commerce', tab: TABS.DESENVOLVIMENTO, keywords: ['ecommerce', 'loja', 'venda', 'online', 'shop', 'comércio'] },
        { type: 'desenvolvimento', title: 'Sistemas Empresariais', tab: TABS.DESENVOLVIMENTO, keywords: ['sistema', 'empresarial', 'crm', 'erp', 'gestão', 'software'] },
        
        // Técnico
        { type: 'perfil', title: 'Perfil Técnico - Erick Finger', tab: TABS.TECNICO, keywords: ['técnico', 'perfil', 'erick', 'finger', 'desenvolvedor', 'programador'] },
        
        // Orçamentos
        { type: 'contato', title: 'Solicitar Orçamento', tab: TABS.ORCAMENTOS, keywords: ['orçamento', 'orcamento', 'preço', 'valor', 'cotação', 'solicitar'] }
      ]

    // Busca inteligente com pontuação
    searchData.forEach(item => {
      let score = 0
      const words = searchTerm.split(' ')
      
      words.forEach(word => {
        if (item.keywords.some(keyword => keyword.includes(word) || word.includes(keyword))) {
          score += 2 // Match exato
        } else if (item.title.toLowerCase().includes(word)) {
          score += 1 // Match no título
        }
      })
      
      if (score > 0) {
        results.push({ ...item, score })
      }
    })

    // Ordenar por relevância (score)
    results.sort((a, b) => b.score - a.score)
    
    // Limitar a 8 resultados mais relevantes
    setSearchResults(results.slice(0, 8))
  }

  const handleSearchResultClick = (result) => {
    setTab(result.tab)
    setSearchQuery('')
    setSearchResults([])
    setShowSearch(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validação básica
    if (!form.nome.trim() || !form.email.trim() || !form.telefone.trim() || !form.mensagem.trim() || !form.tipoServico) {
      addNotification('Por favor, preencha todos os campos obrigatórios!', 'error')
      return
    }
    
    setIsLoading(true)
    
    try {
      // Simular envio com delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Simular envio
      addNotification('Formulário enviado com sucesso! Redirecionando para WhatsApp...', 'success')
      
      // Construir mensagem detalhada para WhatsApp
      const mensagemWhatsApp = `*NOVA SOLICITAÇÃO DE ORÇAMENTO* 🚀

*👤 Informações Pessoais:*
• Nome: ${form.nome}
• Email: ${form.email}
• Telefone: ${form.telefone}
${form.empresa ? `• Empresa: ${form.empresa}` : ''}

*🎯 Detalhes do Projeto:*
• Tipo de Serviço: ${form.tipoServico}
${form.urgencia ? `• Urgência: ${form.urgencia}` : ''}
• Descrição: ${form.mensagem}

*📅 Preferências:*
${form.orcamentoPor ? `• Orçamento por: ${form.orcamentoPor}` : ''}
${form.horarioContato ? `• Melhor horário: ${form.horarioContato}` : ''}

_Formulário enviado via site da VisualTech_`
      
      // Limpar formulário
      setForm({ 
        nome: '', 
        email: '', 
        telefone: '', 
        mensagem: '',
        empresa: '',
        tipoServico: '',
        urgencia: '',
        orcamentoPor: '',
        horarioContato: ''
      })
      
      // Abrir WhatsApp após 2 segundos
      setTimeout(() => {
        window.open(`https://wa.me/5549920014159?text=${encodeURIComponent(mensagemWhatsApp)}`)
      }, 2000)
    } catch (error) {
      addNotification('Erro ao enviar formulário. Tente novamente.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (showWelcome) {
    return (
      <div className="loading-screen">
        <div className="loading-background">
          <div className="loading-particles"></div>
          <div className="loading-grid"></div>
        </div>
        
        <div className="loading-content">
          <div className="loading-logo-container">
            <img src={visualLogo} alt="Logo VisualTech" className="loading-logo" />
            <div className="logo-glow"></div>
            <div className="logo-pulse"></div>
          </div>
          
          <div className="loading-text-container">
            <h1 className="loading-title">
              <span className="loading-text-line">Seja bem-vindo a</span>
              <span className="loading-text-line highlight">VisualTech</span>
            </h1>
            
            <div className="loading-subtitle">
              {detectedMobile ? (
                <>
                  <div className="device-indicator mobile">
                    <span className="device-icon">📱</span>
                    <span className="device-text">Acesso Mobile Detectado</span>
                  </div>
                  <p className="loading-message">
                    Conectando ao futuro da tecnologia<br/>
                    <span className="loading-accent">via dispositivo móvel</span>
                  </p>
                </>
              ) : (
                <>
                  <div className="device-indicator desktop">
                    <span className="device-icon">💻</span>
                    <span className="device-text">Acesso Desktop Detectado</span>
                  </div>
                  <p className="loading-message">
                    Inicializando sistema avançado<br/>
                    <span className="loading-accent">experiência completa ativada</span>
                  </p>
                </>
              )}
            </div>
          </div>
          
          <div className="loading-progress-container">
            <div className="loading-progress-bar">
              <div className="loading-progress-fill"></div>
              <div className="loading-progress-glow"></div>
            </div>
            <div className="loading-status">
              <span className="loading-status-text">Carregando módulos do sistema...</span>
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
          
          <div className="loading-features">
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>Sistema Otimizado</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <span>Segurança Avançada</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🚀</span>
              <span>Performance Máxima</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="layout-visualtech">
      {/* Sistema de Notificações */}
      <div className="notifications-container">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification notification-${notification.type}`}
            onClick={() => removeNotification(notification.id)}
          >
            <span className="notification-message">{notification.message}</span>
            <button className="notification-close" onClick={() => removeNotification(notification.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
      
      <header className="header-visualtech-central">
        <img src={visualLogo} alt="Logo Visual Tech" className="logo-central" />
        
                 {/* Campo de Busca Moderno */}
         <div className="search-container">
           <div className="search-input-wrapper">
             <div className="search-input-container">
                <input
                  type="text"
                  placeholder="Busque aqui..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setShowSearch(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowSearch(false)
                      setSearchQuery('')
                      setSearchResults([])
                    }
                    if (e.key === 'Enter' && searchResults.length > 0) {
                      handleSearchResultClick(searchResults[0])
                    }
                  }}
                  className="search-input"
                  autoComplete="off"
                  spellCheck="false"
                />
               <div className="search-actions">
                 {searchQuery && (
                   <button 
                     className="search-clear-btn"
                     onClick={() => {
                       setSearchQuery('')
                       setSearchResults([])
                     }}
                     title="Limpar busca"
                   >
                     ✕
                   </button>
                 )}
                 <span className="search-icon">🔍</span>
               </div>
             </div>
             
             
           </div>
           
           {/* Resultados da Busca Modernos */}
           {showSearch && (
             <div className="search-results">
               {searchResults.length > 0 ? (
                 <>
                   <div className="search-header">
                     <span className="results-count">{searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''}</span>
                     <span className="search-tip">Pressione Enter para o primeiro resultado</span>
                   </div>
                   <div className="results-list">
                     {searchResults.map((result, index) => (
                       <div
                         key={index}
                         className={`search-result-item ${result.type}`}
                         onClick={() => handleSearchResultClick(result)}
                         onMouseEnter={(e) => e.currentTarget.classList.add('hover')}
                         onMouseLeave={(e) => e.currentTarget.classList.remove('hover')}
                       >
                         <div className="result-icon">
                           {result.type === 'serviço' && '🔧'}
                           {result.type === 'produto' && '💾'}
                           {result.type === 'pacote' && '📦'}
                           {result.type === 'plano' && '📋'}
                           {result.type === 'desenvolvimento' && '💻'}
                           {result.type === 'perfil' && '👨‍💻'}
                           {result.type === 'contato' && '📞'}
                         </div>
                         <div className="result-content">
                           <span className="result-title">{result.title}</span>
                           <span className="result-type-label">{result.type}</span>
                         </div>
                         <div className="result-action">
                           <span className="action-arrow">→</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 </>
               ) : searchQuery.trim() !== '' ? (
                 <div className="search-no-results">
                   <div className="no-results-icon">🔍</div>
                   <div className="no-results-content">
                     <span className="no-results-text">Nenhum resultado encontrado para "{searchQuery}"</span>
                     <span className="no-results-suggestion">Tente outros termos como: montagem, otimização, site, app</span>
                   </div>
                 </div>
               ) : (
                 <div className="search-welcome">
                   <div className="welcome-icon">✨</div>
                   <div className="welcome-content">
                     <span className="welcome-title">Bem-vindo à VisualTech!</span>
                     <span className="welcome-subtitle">Digite para buscar nossos serviços e soluções</span>
                   </div>
                 </div>
               )}
             </div>
           )}
         </div>
        
        {/* Menu Mobile */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
        </button>
        
        {/* Menu Desktop */}
        <nav className={`menu-central ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <button 
            className={tab === TABS.QUEM_SOMOS ? 'active' : ''} 
            onClick={() => {
              setTab(TABS.QUEM_SOMOS)
              setMobileMenuOpen(false)
            }}
          >
            {TABS.QUEM_SOMOS}
          </button>
          <button 
            className={tab === TABS.SERVICOS ? 'active' : ''} 
            onClick={() => {
              setTab(TABS.SERVICOS)
              setMobileMenuOpen(false)
            }}
          >
            {TABS.SERVICOS}
          </button>
          <button 
            className={tab === TABS.PRODUTOS ? 'active' : ''} 
            onClick={() => {
              setTab(TABS.PRODUTOS)
              setMobileMenuOpen(false)
            }}
          >
            {TABS.PRODUTOS}
          </button>
          <button 
            className={tab === TABS.DESENVOLVIMENTO ? 'active' : ''} 
            onClick={() => {
              setTab(TABS.DESENVOLVIMENTO)
              setMobileMenuOpen(false)
            }}
          >
            {TABS.DESENVOLVIMENTO}
          </button>
          <button 
            className={tab === TABS.PLANOS ? 'active' : ''} 
            onClick={() => {
              setTab(TABS.PLANOS)
              setMobileMenuOpen(false)
            }}
          >
            {TABS.PLANOS}
          </button>
          <button 
            className={tab === TABS.PACOTES ? 'active' : ''} 
            onClick={() => {
              setTab(TABS.PACOTES)
              setMobileMenuOpen(false)
            }}
          >
            {TABS.PACOTES}
          </button>
          <button 
            className={tab === TABS.TECNICO ? 'active' : ''} 
            onClick={() => {
              setTab(TABS.TECNICO)
              setMobileMenuOpen(false)
            }}
          >
            {TABS.TECNICO}
          </button>
        </nav>
      </header>
      <main className="main-visualtech">
        {tab === TABS.QUEM_SOMOS && (
          <section className="tela-inicial-visualtech">
            {/* Hero Section Moderno */}
            <div className="hero-section scroll-animate">
              <div className="hero-background">
                <div className="hero-glow"></div>
                <div className="hero-particles"></div>
              </div>
              
              <div className="hero-content">
                <div className="hero-logo-container">
                  <img src={visualLogo} alt="Logo VisualTech" className="hero-logo" />
                  <div className="logo-glow"></div>
                </div>
                
                <h1 className="hero-title">
                  Bem-vindo à <span className="hero-highlight">VisualTech</span>
                </h1>
                
                <p className="hero-subtitle">
                  Transformando ideias em <span className="text-gradient">soluções digitais</span><br/>
                  que impulsionam seu negócio
                </p>
                
                <div className="hero-stats">
                  <div className="stat-item">
                    <span className="stat-number">200+</span>
                    <span className="stat-label">Computadores Montados</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">50+</span>
                    <span className="stat-label">Projetos Entregues</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">24/7</span>
                    <span className="stat-label">Suporte Técnico</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões de Redes Sociais */}
            <section className="social-hero-section scroll-animate">
              <div className="social-hero-container">
                <h3 className="social-hero-title">Conecte-se Conosco</h3>
                <p className="social-hero-subtitle">Entre em contato e descubra como podemos ajudar</p>
                
                <div className="social-hero-buttons">
                  <a className="whatsapp-btn hero-social" href="https://wa.me/5549920014159" target="_blank" rel="noopener noreferrer">
                    <span className="social-icon">💬</span>
                    WhatsApp
                  </a>
                  <a className="instagram-btn hero-social" href="https://instagram.com/visualtechgba" target="_blank" rel="noopener noreferrer">
                    <span className="social-icon">📸</span>
                    Instagram
                  </a>
                </div>
              </div>
            </section>

            {/* Seção de Diferenciais */}
            <section className="diferenciais-section scroll-animate">
              <div className="diferenciais-header">
                <h2 className="section-title">Por que escolher a VisualTech?</h2>
                <p className="section-subtitle">
                  Nossa abordagem única combina tecnologia de ponta com atendimento humanizado
                </p>
              </div>
              
              <div className="diferenciais-grid">
                <div className="diferencial-card premium">
                  <div className="card-icon">🚀</div>
                  <h3>Performance Máxima</h3>
                  <p>Sistemas otimizados que garantem velocidade e eficiência em todos os projetos</p>
                  <div className="card-glow"></div>
                </div>
                
                <div className="diferencial-card premium">
                  <div className="card-icon">🛡️</div>
                  <h3>Segurança e Confiança</h3>
                  <p>Proteção avançada para seus dados e sistemas com as melhores práticas do mercado</p>
                  <div className="card-glow"></div>
                </div>
                
                <div className="diferencial-card premium">
                  <div className="card-icon">🤝</div>
                  <h3>Suporte Humanizado</h3>
                  <p>Atendimento personalizado e suporte técnico disponível sempre que precisar</p>
                  <div className="card-glow"></div>
                </div>
                
                <div className="diferencial-card premium">
                  <div className="card-icon">⚡</div>
                  <h3>Inovação Constante</h3>
                  <p>Sempre à frente com as últimas tecnologias e tendências do mercado</p>
                  <div className="card-glow"></div>
                </div>
              </div>
            </section>

            {/* Seção Quem Somos Redesenhada */}
            <section className="quem-somos-section scroll-animate">
              <div className="quem-somos-container">
                <div className="quem-somos-header">
                  <h2 className="section-title">Quem Somos?</h2>
                  <p className="section-subtitle">
                    Conheça a história e os valores da VisualTech
                  </p>
                </div>
                
                <div className="quem-somos-content">
                  <div className="quem-somos-text">
                    <p>{quemSomosTexto}</p>
                  </div>
                  
                  <div className="quem-somos-cta">
                    <button 
                      className="cta-btn" 
                      onClick={() => setTab(TABS.ORCAMENTOS)}
                      title="Pressione Q para ativar rapidamente"
                    >
                      <span className="btn-content">
                        <span className="btn-icon">🚀</span>
                        Solicite um Orçamento
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </section>
        )}
        {tab === TABS.SERVICOS && (
          <section className="servicos-section scroll-animate">
            <div className="servicos-container">
              <div className="servicos-header">
                <h2 className="section-title">Nossos Serviços</h2>
                <p className="section-subtitle">
                  Soluções tecnológicas completas para impulsionar seu negócio
                </p>
                <div className="servicos-divider">
                  <div className="divider-line"></div>
                  <span className="divider-text">Presenciais & Remotos</span>
                  <div className="divider-line"></div>
                </div>
              </div>

              {/* Serviços Presenciais */}
              <div className="servicos-categoria presencial">
                <div className="categoria-header">
                  <div className="categoria-icon presencial">
                    <span className="icon-symbol">🏢</span>
                    <div className="icon-glow"></div>
                  </div>
                  <div className="categoria-info">
                    <h3 className="categoria-title">Serviços Presenciais</h3>
                    <p className="categoria-desc">Atendimento local com suporte técnico especializado</p>
                    <div className="categoria-badge">Presencial</div>
                  </div>
                </div>
                
                <div className="servicos-grid">
                  <div className="servico-card presencial">
                    <div className="servico-header">
                      <div className="servico-icon">🪟</div>
                      <div className="servico-preco">
                        <span className="preco-valor">R$ 180</span>
                      </div>
                    </div>
                    <div className="servico-content">
                      <h4>Formatação Windows 10</h4>
                      <p>Formatação completa com instalação de drivers e programas essenciais</p>
                      <div className="servico-features">
                        <span>✓ Backup de dados</span>
                        <span>✓ Instalação de drivers</span>
                        <span>✓ Programas básicos</span>
                      </div>
                    </div>
                  </div>

                  <div className="servico-card presencial">
                    <div className="servico-header">
                      <div className="servico-icon">🪟</div>
                      <div className="servico-preco">
                        <span className="preco-valor">R$ 200</span>
                      </div>
                    </div>
                    <div className="servico-content">
                      <h4>Formatação Windows 11</h4>
                      <p>Formatação com a versão mais recente do Windows</p>
                      <div className="servico-features">
                        <span>✓ Backup de dados</span>
                        <span>✓ Windows 11 atualizado</span>
                        <span>✓ Configuração inicial</span>
                      </div>
                    </div>
                  </div>

                  <div className="servico-card presencial">
                    <div className="servico-header">
                      <div className="servico-icon">💾</div>
                      <div className="servico-preco">
                        <span className="preco-valor">R$ 250</span>
                      </div>
                    </div>
                    <div className="servico-content">
                      <h4>Clonagem de Sistema</h4>
                      <p>Transferência completa de Windows para outro computador ou disco</p>
                      <div className="servico-features">
                        <span>✓ Preserva configurações</span>
                        <span>✓ Todos os programas</span>
                        <span>✓ Dados pessoais</span>
                      </div>
                    </div>
                  </div>

                  <div className="servico-card presencial">
                    <div className="servico-header">
                      <div className="servico-icon">💻</div>
                      <div className="servico-preco">
                        <span className="preco-valor">R$ 350</span>
                      </div>
                    </div>
                    <div className="servico-content">
                      <h4>Montagem de Computador</h4>
                      <p>Montagem profissional com componentes de qualidade</p>
                      <div className="servico-features">
                        <span>✓ Montagem especializada</span>
                        <span>✓ Teste de funcionamento</span>
                        <span>✓ Garantia do serviço</span>
                      </div>
                    </div>
                  </div>

                  <div className="servico-card presencial">
                    <div className="servico-header">
                      <div className="servico-icon">🧹</div>
                      <div className="servico-preco">
                        <span className="preco-valor">R$ 200</span>
                      </div>
                    </div>
                    <div className="servico-content">
                      <h4>Limpeza + Otimização</h4>
                      <p>Limpeza física e otimização completa do sistema</p>
                      <div className="servico-features">
                        <span>✓ Limpeza interna</span>
                        <span>✓ Troca de pasta térmica</span>
                        <span>✓ Otimização de sistema</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Serviços Remotos */}
              <div className="servicos-categoria remoto">
                <div className="categoria-header">
                  <div className="categoria-icon remoto">
                    <span className="icon-symbol">🌐</span>
                    <div className="icon-glow"></div>
                  </div>
                  <div className="categoria-info">
                    <h3 className="categoria-title">Serviços Remotos</h3>
                    <p className="categoria-desc">Atendimento online rápido e eficiente de qualquer lugar</p>
                    <div className="categoria-badge">Remoto</div>
                  </div>
                </div>
                
                <div className="servicos-grid">
                  <div className="servico-card remoto">
                    <div className="servico-header">
                      <div className="servico-icon">⚡</div>
                      <div className="servico-preco">
                        <span className="preco-valor">R$ 50</span>
                      </div>
                    </div>
                    <div className="servico-content">
                      <h4>Otimização Completa de Sistema</h4>
                      <p>Otimização profunda para máxima performance</p>
                      <div className="servico-features">
                        <span>✓ Limpeza de arquivos</span>
                        <span>✓ Registro do Windows</span>
                        <span>✓ Programas de inicialização</span>
                      </div>
                    </div>
                  </div>

                  <div className="servico-card remoto">
                    <div className="servico-header">
                      <div className="servico-icon">🔧</div>
                      <div className="servico-preco">
                        <span className="preco-valor">R$ 20</span>
                      </div>
                    </div>
                    <div className="servico-content">
                      <h4>Otimização Windows</h4>
                      <p>Otimização básica para melhorar velocidade</p>
                      <div className="servico-features">
                        <span>✓ Limpeza básica</span>
                        <span>✓ Desfragmentação</span>
                        <span>✓ Configurações básicas</span>
                      </div>
                    </div>
                  </div>

                  <div className="servico-card remoto">
                    <div className="servico-header">
                      <div className="servico-icon">🎮</div>
                      <div className="servico-preco">
                        <span className="preco-valor">R$ 35</span>
                      </div>
                    </div>
                    <div className="servico-content">
                      <h4>Otimização + Jogos</h4>
                      <p>Otimização focada em performance para games</p>
                      <div className="servico-features">
                        <span>✓ Otimização para jogos</span>
                        <span>✓ Configurações gráficas</span>
                        <span>✓ FPS melhorado</span>
                      </div>
                    </div>
                  </div>

                  <div className="servico-card remoto">
                    <div className="servico-header">
                      <div className="servico-icon">⚡</div>
                      <div className="servico-preco">
                        <span className="preco-valor">R$ 50</span>
                      </div>
                    </div>
                    <div className="servico-content">
                      <h4>Otimização + Redução Input Lag</h4>
                      <p>Máxima performance com redução de latência</p>
                      <div className="servico-features">
                        <span>✓ Redução de input lag</span>
                        <span>✓ Otimização avançada</span>
                        <span>✓ Configurações pro</span>
                      </div>
                    </div>
                  </div>

                  <div className="servico-card remoto destaque">
                    <div className="servico-header">
                      <div className="servico-icon">📱</div>
                      <div className="servico-preco">
                        <span className="preco-valor">R$ 10</span>
                        <span className="preco-label">por mês</span>
                      </div>
                    </div>
                    <div className="servico-content">
                      <h4>App de Otimização</h4>
                      <p>Acesso ao nosso aplicativo exclusivo de otimização</p>
                      <div className="servico-features">
                        <span>✓ Desenvolvimento próprio</span>
                        <span>✓ Atualizações mensais</span>
                        <span>✓ Suporte incluído</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="servicos-cta">
                <h3>Interessado em nossos serviços?</h3>
                <p>Entre em contato para mais informações ou para agendar seu atendimento</p>
                <div className="cta-buttons">
                  <button 
                    className="cta-btn" 
                    onClick={() => setTab(TABS.ORCAMENTOS)}
                  >
                    Solicitar Orçamento
                  </button>
                  <a 
                    href="https://wa.me/5549920014159?text=Olá! Gostaria de mais informações sobre os serviços da VisualTech." 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="whatsapp-btn"
                  >
                    Falar no WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}
        {tab === TABS.PRODUTOS && (
          <section className="produtos-section scroll-animate">
            <div className="produtos-container">
              <div className="produtos-header">
                <h2 className="section-title">Nossa Loja</h2>
                <p className="section-subtitle">
                  Catálogo completo de produtos de tecnologia com preços atualizados
                </p>
                <div className="sync-status" id="syncStatus" style={{display: loadingProdutos ? 'flex' : 'none'}}>
                  <i className="fas fa-sync-alt"></i>
                  <span>Sincronização automática ativa - verificando a cada 2 minutos</span>
                </div>
              </div>

              <div className="produtos-grid" id="produtosGrid">
                {loadingProdutos ? (
                  <div className="loading-produtos">
                    <div className="loading-spinner"></div>
                    <p>Carregando produtos...</p>
                  </div>
                ) : (
                  produtos.map((produto, index) => (
                    <div key={produto.id || index} className="produto-card">
                      <div className="produto-image-container">
                        <img 
                          src={produto.foto} 
                          alt={produto.nome} 
                          className="produto-image"
                          onLoad={() => console.log('✅ Imagem carregou:', produto.nome)}
                          onError={(e) => {
                            console.log('❌ Erro ao carregar:', produto.nome, 'URL:', produto.foto);
                            e.target.src = `https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=${encodeURIComponent(produto.nome)}`;
                          }} 
                        />
                      </div>
                      <div className="produto-info">
                        <div className="produto-category-badge">{produto.categoria}</div>
                        <h3 className="produto-name">{produto.nome}</h3>
                        <p className="produto-description">{produto.descricao}</p>
                        <div className="produto-price">{produto.valor}</div>
                        <button 
                          className="btn btn-buy" 
                          onClick={() => window.open(`https://wa.me/5549920014159?text=Olá! Gostaria de adquirir o produto: *${produto.nome}* por ${produto.valor}. Podem me ajudar com mais informações?`, '_blank')}
                        >
                          <i className="fab fa-whatsapp"></i>
                          COMPRAR
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Call to Action */}
              <div className="produtos-cta">
                <h3>Interessado em nossos produtos?</h3>
                <p>Entre em contato para mais informações sobre disponibilidade e condições especiais</p>
                <div className="cta-buttons">
                  <a 
                    href="https://wa.me/5549920014159?text=Olá! Gostaria de saber mais sobre os produtos da VisualTech." 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="whatsapp-btn"
                  >
                    Falar no WhatsApp
                  </a>
                  <button 
                    className="cta-btn" 
                    onClick={() => setTab(TABS.ORCAMENTOS)}
                  >
                    Solicitar Orçamento
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
        {tab === TABS.ORCAMENTOS && (
          <section className="orcamentos-section scroll-animate">
            <div className="orcamentos-container">
              <div className="orcamentos-header">
                <div className="orcamentos-icon">💼</div>
                <h2>Solicite um Orçamento Personalizado</h2>
                <p className="orcamentos-subtitle">Preencha os dados abaixo e receba uma proposta sob medida para suas necessidades</p>
              </div>
              
              <div className="orcamentos-content">
                <div className="orcamentos-info">
                  <div className="info-card">
                    <div className="info-icon">⚡</div>
                    <h3>Resposta Rápida</h3>
                    <p>Receba seu orçamento em até 2 horas</p>
                  </div>
                  <div className="info-card">
                    <div className="info-icon">🎯</div>
                    <h3>Sob Medida</h3>
                    <p>Soluções personalizadas para seu projeto</p>
                  </div>
                  <div className="info-card">
                    <div className="info-icon">💰</div>
                    <h3>Melhor Preço</h3>
                    <p>Garantimos a melhor relação custo-benefício</p>
                  </div>
                </div>
                
                <form className="form-orcamento-modern" onSubmit={handleSubmit}>
                  <div className="form-section">
                    <h4 className="section-title">📋 Informações Pessoais</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="nome">Nome Completo *</label>
                        <input 
                          type="text" 
                          id="nome"
                          name="nome" 
                          placeholder="Digite seu nome completo" 
                          value={form.nome} 
                          onChange={handleChange} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="email">E-mail *</label>
                        <input 
                          type="email" 
                          id="email"
                          name="email" 
                          placeholder="seu@email.com" 
                          value={form.email} 
                          onChange={handleChange} 
                          required 
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="telefone">Telefone/WhatsApp *</label>
                        <input 
                          type="tel" 
                          id="telefone"
                          name="telefone" 
                          placeholder="(00) 00000-0000" 
                          value={form.telefone} 
                          onChange={handleChange} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="empresa">Empresa (opcional)</label>
                        <input 
                          type="text" 
                          id="empresa"
                          name="empresa" 
                          placeholder="Nome da sua empresa" 
                          value={form.empresa || ''} 
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-section">
                    <h4 className="section-title">🎯 Detalhes do Projeto</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="tipo-servico">Tipo de Serviço *</label>
                        <select 
                          id="tipo-servico"
                          name="tipoServico" 
                          value={form.tipoServico || ''} 
                          onChange={handleChange}
                          required
                        >
                          <option value="">Selecione o serviço</option>
                          <option value="montagem">Montagem de Computador</option>
                          <option value="manutencao">Manutenção e Reparo</option>
                          <option value="desenvolvimento">Desenvolvimento de Sistema</option>
                          <option value="otimizacao">Otimização de Windows</option>
                          <option value="rede">Configuração de Rede</option>
                          <option value="outro">Outro</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="urgencia">Urgência</label>
                        <select 
                          id="urgencia"
                          name="urgencia" 
                          value={form.urgencia || ''} 
                          onChange={handleChange}
                        >
                          <option value="">Selecione a urgência</option>
                          <option value="baixa">Baixa (1-2 semanas)</option>
                          <option value="media">Média (3-5 dias)</option>
                          <option value="alta">Alta (1-2 dias)</option>
                          <option value="critica">Crítica (mesmo dia)</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group full-width">
                      <label htmlFor="mensagem">Descrição Detalhada *</label>
                      <textarea 
                        id="mensagem"
                        name="mensagem" 
                        placeholder="Descreva detalhadamente sua necessidade, especificações técnicas, prazos e qualquer informação relevante para o orçamento..." 
                        value={form.mensagem} 
                        onChange={handleChange} 
                        rows="4"
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="form-section">
                    <h4 className="section-title">📅 Preferências</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="orcamento-por">Orçamento por</label>
                        <select 
                          id="orcamento-por"
                          name="orcamentoPor" 
                          value={form.orcamentoPor || ''} 
                          onChange={handleChange}
                        >
                          <option value="">Selecione</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="email">E-mail</option>
                          <option value="telefone">Telefone</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="orcamento-por">Melhor horário para contato</label>
                        <select 
                          id="horario-contato"
                          name="horarioContato" 
                          value={form.horarioContato || ''} 
                          onChange={handleChange}
                        >
                          <option value="">Selecione</option>
                          <option value="manha">Manhã (8h-12h)</option>
                          <option value="tarde">Tarde (13h-18h)</option>
                          <option value="noite">Noite (18h-22h)</option>
                          <option value="flexivel">Flexível</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" disabled={isLoading} className={`submit-btn ${isLoading ? 'loading' : ''}`}>
                      {isLoading ? (
                        <>
                          <span className="spinner"></span>
                          <span>Enviando Solicitação...</span>
                        </>
                      ) : (
                        <>
                          <span className="btn-icon">📱</span>
                          <span>Solicitar Orçamento via WhatsApp</span>
                        </>
                      )}
                    </button>
                    <p className="form-note">
                      <span className="note-icon">🔒</span>
                      Seus dados estão seguros e serão usados apenas para contato
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </section>
        )}
        {tab === TABS.PLANOS && (
          <section className="planos-section scroll-animate">
            <div className="planos-container">
              <div className="planos-header">
                <h2 className="section-title">Nossos Planos</h2>
                <p className="section-subtitle">
                  Escolha o plano ideal para suas necessidades de otimização
                </p>
              </div>
              
              <div className="planos-grid">
                <div className="plano-card premium">
                  <div className="plano-header">
                    <div className="plano-icon">⚡</div>
                    <div className="plano-badge">POPULAR</div>
                  </div>
                  
                  <h3>Sistema de Otimização Premium</h3>
                  <p className="plano-description">
                    Acesso completo ao nosso sistema exclusivo de otimização para Windows, 
                    com suporte técnico especializado e atualizações mensais automáticas.
                  </p>
                  
                  <div className="plano-features">
                    <div className="feature-item">
                      <span className="feature-icon">🚀</span>
                      <span>Otimização automática completa</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">🛡️</span>
                      <span>Proteção contra malware</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">📊</span>
                      <span>Relatórios de performance</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">🔄</span>
                      <span>Atualizações mensais</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">💬</span>
                      <span>Suporte técnico prioritário</span>
                    </div>
                  </div>
                  
                  <div className="plano-price">
                    <span className="price-value">R$ 10,00</span>
                    <span className="price-period">/mês</span>
                  </div>
                  
                  <div className="plano-cta">
                    <a 
                      href="https://wa.me/5549920014159?text=Tenho interesse no Plano Mensalidade de Sistema de Otimização Premium" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="whatsapp-btn plano-btn"
                    >
                      <span className="btn-icon">💬</span>
                      Assinar via WhatsApp
                    </a>
                  </div>
                  
                  <div className="plano-guarantee">
                    <span className="guarantee-icon">✅</span>
                    <span>Garantia de 30 dias</span>
                  </div>
                </div>
              </div>
              
              <div className="planos-benefits">
                <h3>Por que escolher nossos planos?</h3>
                <div className="benefits-grid">
                  <div className="benefit-item">
                    <div className="benefit-icon">⚡</div>
                    <h4>Performance Máxima</h4>
                    <p>Sistemas otimizados que garantem velocidade e eficiência</p>
                  </div>
                  <div className="benefit-item">
                    <div className="benefit-icon">🛡️</div>
                    <h4>Segurança Avançada</h4>
                    <p>Proteção completa contra ameaças e vulnerabilidades</p>
                  </div>
                  <div className="benefit-item">
                    <div className="benefit-icon">🔄</div>
                    <h4>Atualizações Constantes</h4>
                    <p>Sempre com as últimas melhorias e correções</p>
                  </div>
                  <div className="benefit-item">
                    <div className="benefit-icon">💬</div>
                    <h4>Suporte Especializado</h4>
                    <p>Atendimento técnico dedicado para resolver suas dúvidas</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
                 {tab === TABS.TECNICO && (
           <section className="tecnica-section scroll-animate">
             <div className="card-sobre-mim">
               <div className="perfil-header">
                 <div className="perfil-avatar">
                   <span className="avatar-icon">👨‍💻</span>
                 </div>
                 <div className="perfil-info">
                   <h2>Erick Finger</h2>
                   <span className="subtitulo-sobre-mim">Desenvolvedor Full-Stack & Especialista em Tecnologia</span>
                   <div className="perfil-stats">
                     <div className="stat-item">
                       <span className="stat-number">4+</span>
                       <span className="stat-label">Anos de Experiência</span>
                     </div>
                     <div className="stat-item">
                       <span className="stat-number">200+</span>
                       <span className="stat-label">PCs Montados</span>
                     </div>
                     <div className="stat-item">
                       <span className="stat-number">50+</span>
                       <span className="stat-label">Projetos Concluídos</span>
                     </div>
                   </div>
                 </div>
               </div>
               
               <div className="experiencia-grid">
                 <div className="experiencia-categoria destaque">
                   <h3>🎓 Formação Acadêmica</h3>
                   <p>Graduando em <strong>Engenharia da Computação</strong>, com diversos cursos especializados em:</p>
                   <ul className="especializacoes">
                     <li>Desenvolvimento Web Full-Stack</li>
                     <li>Inteligência Artificial e Machine Learning</li>
                     <li>Arquitetura de Software</li>
                     <li>Segurança da Informação</li>
                   </ul>
                 </div>

                 <div className="experiencia-categoria destaque">
                   <h3>💻 Stack Tecnológico</h3>
                   <div className="tech-stack">
                     <div className="tech-categoria">
                       <h4>Frontend</h4>
                       <div className="tech-items">
                         <span className="tech-tag">React.js</span>
                         <span className="tech-tag">Vue.js</span>
                         <span className="tech-tag">HTML5</span>
                         <span className="tech-tag">CSS3/SASS</span>
                       </div>
                     </div>
                     <div className="tech-categoria">
                       <h4>Backend</h4>
                       <div className="tech-items">
                         <span className="tech-tag">Node.js</span>
                         <span className="tech-tag">Python</span>
                         <span className="tech-tag">C#</span>
                         <span className="tech-tag">SQL</span>
                       </div>
                     </div>
                     <div className="tech-categoria">
                       <h4>Ferramentas</h4>
                       <div className="tech-items">
                         <span className="tech-tag">Git</span>
                         <span className="tech-tag">Docker</span>
                         <span className="tech-tag">AWS</span>
                         <span className="tech-tag">Figma</span>
                       </div>
                     </div>
                   </div>
                 </div>

                 <div className="experiencia-categoria">
                   <h3>🔧 Hardware & Infraestrutura</h3>
                   <div className="hardware-details">
                     <div className="hardware-item">
                       <span className="hardware-icon">🖥️</span>
                       <div>
                         <strong>Montagem de Computadores</strong>
                         <p>Mais de <strong>200 computadores</strong> montados e configurados para gaming, trabalho e servidores</p>
                       </div>
                     </div>
                     <div className="hardware-item">
                       <span className="hardware-icon">🔧</span>
                       <div>
                         <strong>Manutenção & Otimização</strong>
                         <p>Especialista em diagnóstico, reparo e otimização de sistemas para máxima performance</p>
                       </div>
                     </div>
                     <div className="hardware-item">
                       <span className="hardware-icon">🌐</span>
                       <div>
                         <strong>Redes & Servidores</strong>
                         <p>Configuração de redes domésticas e empresariais, servidores locais e cloud</p>
                       </div>
                     </div>
                   </div>
                 </div>

                 <div className="experiencia-categoria">
                   <h3>⚙️ Sistemas & Aplicações</h3>
                   <div className="sistemas-grid">
                     <div className="sistema-item">
                       <span className="sistema-icon">🪟</span>
                       <strong>Windows</strong>
                       <p>Otimização avançada, troubleshooting e customização para diferentes perfis de usuário</p>
                     </div>
                     <div className="sistema-item">
                       <span className="sistema-icon">🐧</span>
                       <strong>Linux</strong>
                       <p>Administração de servidores, automação com scripts e configuração de ambientes de desenvolvimento</p>
                     </div>
                     <div className="sistema-item">
                       <span className="sistema-icon">☁️</span>
                       <strong>Cloud</strong>
                       <p>Deploy e gerenciamento de aplicações em AWS, Azure e Google Cloud Platform</p>
                     </div>
                   </div>
                 </div>

                 <div className="experiencia-categoria">
                   <h3>📚 Ensino & Compartilhamento</h3>
                   <div className="ensino-details">
                     <div className="ensino-item">
                       <span className="ensino-icon">👨‍🏫</span>
                       <div>
                         <strong>Professor de Tecnologia</strong>
                         <p>Ministrei cursos de programação, hardware e redes para mais de 200 alunos</p>
                       </div>
                     </div>
                     <div className="ensino-item">
                       <span className="ensino-icon">🎤</span>
                       <div>
                         <strong>Palestrante</strong>
                         <p>Participação em eventos de tecnologia, compartilhando conhecimento sobre inovação e desenvolvimento</p>
                       </div>
                     </div>
                     <div className="ensino-item">
                       <span className="ensino-icon">📖</span>
                       <div>
                         <strong>Mentoria</strong>
                         <p>Orientação de desenvolvedores iniciantes e consultoria técnica para startups</p>
                       </div>
                     </div>
                   </div>
                 </div>

                 <div className="experiencia-categoria destaque">
                   <h3>🚀 Projetos Destacados</h3>
                   <div className="projetos-grid">
                     <div className="projeto-card">
                       <h4>🎯 Sistema de Otimização Windows</h4>
                       <p>Aplicativo próprio para otimização automática de sistemas Windows, com mais de 500 usuários ativos</p>
                       <div className="projeto-tech">C# • WPF • Windows API</div>
                     </div>
                     <div className="projeto-card">
                       <h4>🌐 Plataforma VisualTech</h4>
                       <p>Site institucional completo com sistema de orçamentos, busca inteligente e design responsivo</p>
                       <div className="projeto-tech">React • Node.js • CSS3</div>
                     </div>
                     <div className="projeto-card">
                       <h4>📱 App de Gestão Empresarial</h4>
                       <p>Aplicativo mobile para controle de estoque e gestão de clientes para pequenas empresas</p>
                       <div className="projeto-tech">React Native • Firebase • Node.js</div>
                     </div>
                   </div>
                 </div>

                 <div className="experiencia-categoria">
                   <h3>🎯 Metodologias & Práticas</h3>
                   <div className="metodologias-grid">
                     <div className="metodologia-item">
                       <span className="metodologia-icon">🔄</span>
                       <strong>Desenvolvimento Ágil</strong>
                       <p>Scrum, Kanban e metodologias ágeis para entrega contínua e feedback rápido</p>
                     </div>
                     <div className="metodologia-item">
                       <span className="metodologia-icon">🧪</span>
                       <strong>TDD & Testes</strong>
                       <p>Desenvolvimento orientado a testes com Jest, Mocha e ferramentas de qualidade de código</p>
                     </div>
                     <div className="metodologia-item">
                       <span className="metodologia-icon">🔒</span>
                       <strong>Segurança</strong>
                       <p>Implementação de melhores práticas de segurança, autenticação e proteção de dados</p>
                     </div>
                   </div>
                 </div>
               </div>

               <div className="cta-tecnico">
                 <h3>💼 Interessado em trabalhar juntos?</h3>
                 <p>Vamos transformar suas ideias em soluções tecnológicas inovadoras!</p>
                 <div className="cta-buttons">
                   <button 
                     className="cta-btn" 
                     onClick={() => setTab(TABS.ORCAMENTOS)}
                   >
                     Solicitar Orçamento
                   </button>
                   <a 
                     href="https://wa.me/5549920014159?text=Olá! Gostaria de conversar sobre um projeto de desenvolvimento ou consultoria técnica." 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="whatsapp-btn"
                   >
                     Conversar no WhatsApp
                   </a>
                 </div>
               </div>
             </div>
           </section>
         )}
        {tab === TABS.PACOTES && (
          <section className="pacotes-section scroll-animate">
            <div className="pacotes-container">
              <div className="pacotes-header">
                <h2 className="section-title">Nossos Pacotes Especiais</h2>
                <p className="section-subtitle">
                  Soluções completas e personalizadas para empresas e gamers
                </p>
              </div>
              
              <div className="pacotes-grid">
                <div className="pacote-card premium">
                  <div className="pacote-header">
                    <div className="pacote-icon">🏢</div>
                    <div className="pacote-badge">EMPRESARIAL</div>
                  </div>
                  <h3>Pacote Otimização e Gestor Empresarial</h3>
                  <p>Pacote completo incluindo otimização de sistema e gestor empresarial para maximizar a produtividade da sua empresa.</p>
                  <div className="pacote-features">
                    <span>✓ Otimização completa do sistema</span>
                    <span>✓ Gestor empresarial personalizado</span>
                    <span>✓ Suporte técnico especializado</span>
                    <span>✓ Relatórios de produtividade</span>
                  </div>
                  <div className="preco-pacote">
                    <span className="preco-valor">R$ 150,00</span>
                    <span className="preco-periodo">por ano</span>
                  </div>
                  <a href="https://wa.me/5549920014159?text=Tenho interesse no Pacote Otimização e Gestor Empresarial - R$ 150,00 por ano" target="_blank" rel="noopener noreferrer" className="whatsapp-btn">Contratar via WhatsApp</a>
                </div>
                <div className="pacote-card gaming">
                  <div className="pacote-header">
                    <div className="pacote-icon">🎮</div>
                    <div className="pacote-badge">GAMING</div>
                  </div>
                  <h3>Pacote Otimização e Overlay de Jogos</h3>
                  <p>Otimização completa do sistema + overlay personalizado para jogos, melhorando performance e experiência de gameplay.</p>
                  <div className="pacote-features">
                    <span>✓ Otimização focada em jogos</span>
                    <span>✓ Overlay personalizado</span>
                    <span>✓ Melhoria de FPS</span>
                    <span>✓ Configurações gráficas otimizadas</span>
                  </div>
                  <div className="preco-pacote">
                    <span className="preco-valor">R$ 130,00</span>
                    <span className="preco-periodo">por ano</span>
                  </div>
                  <a href="https://wa.me/5549920014159?text=Tenho interesse no Pacote Otimização e Overlay de Jogos - R$ 130,00 por ano" target="_blank" rel="noopener noreferrer" className="whatsapp-btn">Contratar via WhatsApp</a>
                </div>
              </div>
            </div>
          </section>
        )}
        {tab === TABS.DESENVOLVIMENTO && (
          <section className="desenvolvimento-section scroll-animate">
            <div className="desenvolvimento-container">
              <div className="desenvolvimento-header">
                <h2 className="section-title">Desenvolvimento de Software e Sites</h2>
                <p className="section-subtitle">
                  Transforme sua ideia em realidade! Soluções completas de desenvolvimento, 
                  desde sites responsivos até sistemas empresariais complexos
                </p>
                <div className="desenvolvimento-divider">
                  <div className="divider-line"></div>
                  <span className="divider-text">Soluções Completas</span>
                  <div className="divider-line"></div>
                </div>
              </div>
              
              <div className="desenvolvimento-grid">
                <div className="desenvolvimento-card">
                  <div className="card-header">
                    <div className="card-icon">🌐</div>
                    <div className="card-badge">WEB</div>
                  </div>
                  <div className="card-content">
                    <h3>Sites Institucionais</h3>
                    <p>Sites profissionais e responsivos para sua empresa, com design moderno e otimizado para SEO.</p>
                    <div className="card-features">
                      <span>✓ Design responsivo (mobile-first)</span>
                      <span>✓ Otimização para SEO</span>
                      <span>✓ Integração com redes sociais</span>
                      <span>✓ Painel administrativo</span>
                    </div>
                    <div className="card-price">
                      <span className="price-value">R$ 800,00</span>
                      <span className="price-label">a partir de</span>
                    </div>
                    <a href="https://wa.me/5549920014159?text=Tenho interesse em um Site Institucional. Pode me enviar mais detalhes?" target="_blank" rel="noopener noreferrer" className="whatsapp-btn card-btn">Solicitar Orçamento</a>
                  </div>
                </div>

                <div className="desenvolvimento-card">
                  <div className="card-header">
                    <div className="card-icon">🛒</div>
                    <div className="card-badge">E-COMMERCE</div>
                  </div>
                  <div className="card-content">
                    <h3>E-commerce</h3>
                    <p>Lojas virtuais completas para vender seus produtos online com segurança e facilidade.</p>
                    <div className="card-features">
                      <span>✓ Catálogo de produtos</span>
                      <span>✓ Sistema de pagamentos</span>
                      <span>✓ Gestão de estoque</span>
                      <span>✓ Relatórios de vendas</span>
                    </div>
                    <div className="card-price">
                      <span className="price-value">R$ 1.500,00</span>
                      <span className="price-label">a partir de</span>
                    </div>
                    <a href="https://wa.me/5549920014159?text=Tenho interesse em um E-commerce. Pode me enviar mais detalhes?" target="_blank" rel="noopener noreferrer" className="whatsapp-btn card-btn">Solicitar Orçamento</a>
                  </div>
                </div>

                <div className="desenvolvimento-card">
                  <div className="card-header">
                    <div className="card-icon">⚙️</div>
                    <div className="card-badge">SISTEMAS</div>
                  </div>
                  <div className="card-content">
                    <h3>Sistemas Empresariais</h3>
                    <p>Sistemas personalizados para automatizar processos e aumentar a eficiência da sua empresa.</p>
                    <div className="card-features">
                      <span>✓ Gestão de clientes (CRM)</span>
                      <span>✓ Controle de estoque</span>
                      <span>✓ Relatórios gerenciais</span>
                      <span>✓ Integração com APIs</span>
                    </div>
                    <div className="card-price">
                      <span className="price-value">R$ 2.500,00</span>
                      <span className="price-label">a partir de</span>
                    </div>
                    <a href="https://wa.me/5549920014159?text=Tenho interesse em um Sistema Empresarial. Pode me enviar mais detalhes?" target="_blank" rel="noopener noreferrer" className="whatsapp-btn card-btn">Solicitar Orçamento</a>
                  </div>
                </div>
              </div>

              <div className="desenvolvimento-diferenciais">
                <h3>Por que escolher a VisualTech?</h3>
                <div className="diferenciais-grid">
                  <div className="diferencial-item">
                    <div className="diferencial-icon">🚀</div>
                    <h4>Desenvolvimento Ágil</h4>
                    <p>Metodologia ágil com entregas incrementais e feedback constante</p>
                  </div>
                  <div className="diferencial-item">
                    <div className="diferencial-icon">🔒</div>
                    <h4>Segurança</h4>
                    <p>Implementação de melhores práticas de segurança e proteção de dados</p>
                  </div>
                  <div className="diferencial-item">
                    <div className="diferencial-icon">📊</div>
                    <h4>Suporte 24/7</h4>
                    <p>Suporte técnico especializado e manutenção contínua</p>
                  </div>
                  <div className="diferencial-item">
                    <div className="diferencial-icon">💡</div>
                    <h4>Inovação</h4>
                    <p>Tecnologias modernas e soluções inovadoras para seu negócio</p>
                  </div>
                </div>
              </div>

              <div className="desenvolvimento-cta">
                <h3>Pronto para transformar sua ideia em realidade?</h3>
                <p>Entre em contato conosco para uma consulta gratuita e descubra como podemos ajudar seu negócio a crescer!</p>
                <div className="cta-buttons">
                  <a href="https://wa.me/5549920014159?text=Olá! Gostaria de uma consulta gratuita sobre desenvolvimento de software/site para minha empresa." target="_blank" rel="noopener noreferrer" className="cta-btn">Agendar Consulta Gratuita</a>
                  <button 
                    className="cta-btn secondary" 
                    onClick={() => setTab(TABS.ORCAMENTOS)}
                  >
                    Solicitar Orçamento
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <footer className="footer-discreto">© 2025 - Todos os direitos reservados a VisualTech</footer>
    </div>
  )
}


export default App 




