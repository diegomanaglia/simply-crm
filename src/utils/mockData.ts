import { Pipeline, Phase, Deal, Temperature, Tag } from '@/types/crm';

const generateId = () => Math.random().toString(36).substring(2, 15);

const firstNames = [
  'João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Juliana', 'Fernando', 'Camila',
  'Ricardo', 'Beatriz', 'Lucas', 'Amanda', 'Marcos', 'Larissa', 'Gabriel',
  'Fernanda', 'Rafael', 'Patrícia', 'Bruno', 'Mariana', 'Diego', 'Isabela',
  'Thiago', 'Carolina', 'Gustavo', 'Letícia', 'André', 'Priscila', 'Rodrigo', 'Vanessa',
  'Felipe', 'Renata', 'Eduardo', 'Daniela', 'Leandro', 'Aline', 'Vinícius', 'Cristina',
  'Henrique', 'Tatiana', 'Alexandre', 'Natália', 'Matheus', 'Jéssica', 'Paulo', 'Adriana'
];

const lastNames = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves',
  'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho',
  'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha',
  'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado'
];

const companies = [
  'Tech Solutions', 'Digital Corp', 'Inovação SA', 'StartUp Brasil', 'Cloud Systems',
  'Data Analytics', 'Smart Business', 'Future Tech', 'Alpha Consulting', 'Beta Software',
  'Gamma Industries', 'Delta Services', 'Epsilon Group', 'Zeta Ventures', 'Omega Solutions',
  'Prime Tecnologia', 'Elite Digital', 'Master Systems', 'Pro Business', 'Max Serviços'
];

const dealTitles = [
  'Implementação de CRM', 'Consultoria em TI', 'Desenvolvimento de App', 'Migração Cloud',
  'Sistema ERP', 'Automação de Marketing', 'Integração de Sistemas', 'Análise de Dados',
  'Suporte Técnico Anual', 'Licenças de Software', 'Treinamento de Equipe', 'Auditoria de Segurança',
  'Projeto de E-commerce', 'Redesign de Site', 'Gestão de Redes Sociais', 'SEO e Marketing',
  'Infraestrutura de TI', 'Backup e Recuperação', 'Monitoramento 24/7', 'Consultoria Estratégica',
  'Plataforma SaaS', 'API de Pagamentos', 'Sistema de Vendas', 'Portal do Cliente',
  'Aplicativo Mobile', 'Dashboard Analytics', 'Chatbot Inteligente', 'Automação RPA'
];

const sources = [
  'Site', 'Google Ads', 'Facebook', 'Instagram', 'LinkedIn', 'Indicação',
  'Evento', 'Webinar', 'Email Marketing', 'Cold Call', 'Parceiro', 'Orgânico'
];

const tagOptions: { name: string; color: string }[] = [
  { name: 'Urgente', color: '#ef4444' },
  { name: 'VIP', color: '#8b5cf6' },
  { name: 'Recorrente', color: '#22c55e' },
  { name: 'Novo Cliente', color: '#3b82f6' },
  { name: 'Renovação', color: '#f59e0b' },
  { name: 'Enterprise', color: '#6366f1' },
  { name: 'PME', color: '#14b8a6' },
  { name: 'Startup', color: '#ec4899' },
  { name: 'Governo', color: '#64748b' },
  { name: 'Educação', color: '#06b6d4' }
];

const temperatures: Temperature[] = ['cold', 'warm', 'hot'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCPF(): string {
  const n = () => randomNumber(0, 9);
  return `${n()}${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}-${n()}${n()}`;
}

function generateCNPJ(): string {
  const n = () => randomNumber(0, 9);
  return `${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}/0001-${n()}${n()}`;
}

function generatePhone(): string {
  const ddd = randomNumber(11, 99);
  const n = () => randomNumber(0, 9);
  return `(${ddd}) 9${n()}${n()}${n()}${n()}-${n()}${n()}${n()}${n()}`;
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.br', 'empresa.com.br'];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomItem(domains)}`;
}

function generateRandomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - randomNumber(0, daysAgo));
  date.setHours(randomNumber(8, 18), randomNumber(0, 59), 0, 0);
  return date.toISOString();
}

function generateTags(): Tag[] {
  const numTags = randomNumber(0, 3);
  const selectedTags: Tag[] = [];
  const availableTags = [...tagOptions];
  
  for (let i = 0; i < numTags && availableTags.length > 0; i++) {
    const index = randomNumber(0, availableTags.length - 1);
    const tag = availableTags.splice(index, 1)[0];
    selectedTags.push({
      id: generateId(),
      name: tag.name,
      color: tag.color
    });
  }
  
  return selectedTags;
}

function generateDeal(phaseId: string): Deal {
  const firstName = randomItem(firstNames);
  const lastName = randomItem(lastNames);
  const company = randomItem(companies);
  const isCompany = Math.random() > 0.5;
  
  const createdAt = generateRandomDate(90);
  return {
    id: generateId(),
    title: `${randomItem(dealTitles)} - ${company}`,
    contactName: `${firstName} ${lastName}`,
    document: isCompany ? generateCNPJ() : generateCPF(),
    phone: generatePhone(),
    email: generateEmail(firstName, lastName),
    value: randomNumber(1, 500) * 1000, // R$ 1.000 a R$ 500.000
    tags: generateTags(),
    source: randomItem(sources),
    temperature: randomItem(temperatures),
    createdAt,
    phaseId,
    activities: [{
      id: generateId(),
      type: 'created' as const,
      timestamp: createdAt,
      description: 'Negócio criado',
    }],
  };
}

function createDefaultPhases(): Phase[] {
  return [
    { id: generateId(), name: 'Entrada', order: 0, isDefault: true, type: 'entry' },
    { id: generateId(), name: 'Qualificação', order: 1, isDefault: false },
    { id: generateId(), name: 'Proposta', order: 2, isDefault: false },
    { id: generateId(), name: 'Negociação', order: 3, isDefault: false },
    { id: generateId(), name: 'Perdido', order: 98, isDefault: true, type: 'lost' },
    { id: generateId(), name: 'Ganho', order: 99, isDefault: true, type: 'won' },
  ];
}

function generateDealsForPipeline(phases: Phase[], count: number): Deal[] {
  const deals: Deal[] = [];
  
  // Distribuição: mais leads nas fases iniciais, menos nas finais
  const distribution = {
    entry: 0.25,
    qualification: 0.25,
    proposal: 0.20,
    negotiation: 0.15,
    lost: 0.08,
    won: 0.07
  };
  
  const entryPhase = phases.find(p => p.type === 'entry')!;
  const qualificationPhase = phases.find(p => p.name === 'Qualificação')!;
  const proposalPhase = phases.find(p => p.name === 'Proposta')!;
  const negotiationPhase = phases.find(p => p.name === 'Negociação')!;
  const lostPhase = phases.find(p => p.type === 'lost')!;
  const wonPhase = phases.find(p => p.type === 'won')!;
  
  const phaseCounts = [
    { phase: entryPhase, count: Math.floor(count * distribution.entry) },
    { phase: qualificationPhase, count: Math.floor(count * distribution.qualification) },
    { phase: proposalPhase, count: Math.floor(count * distribution.proposal) },
    { phase: negotiationPhase, count: Math.floor(count * distribution.negotiation) },
    { phase: lostPhase, count: Math.floor(count * distribution.lost) },
    { phase: wonPhase, count: Math.floor(count * distribution.won) },
  ];
  
  // Adicionar os deals restantes à fase de entrada
  const totalDistributed = phaseCounts.reduce((sum, p) => sum + p.count, 0);
  phaseCounts[0].count += count - totalDistributed;
  
  phaseCounts.forEach(({ phase, count }) => {
    for (let i = 0; i < count; i++) {
      deals.push(generateDeal(phase.id));
    }
  });
  
  return deals;
}

export function generateMockData(): { pipelines: Pipeline[] } {
  const pipelines: Pipeline[] = [];
  
  // Pipeline 1: Vendas (com 50 leads)
  const vendasPhases = createDefaultPhases();
  pipelines.push({
    id: generateId(),
    name: 'Vendas',
    phases: vendasPhases,
    deals: generateDealsForPipeline(vendasPhases, 50),
    createdAt: generateRandomDate(60)
  });
  
  // Pipeline 2: Marketing Digital (20 leads)
  const marketingPhases = createDefaultPhases();
  pipelines.push({
    id: generateId(),
    name: 'Marketing Digital',
    phases: marketingPhases,
    deals: generateDealsForPipeline(marketingPhases, 20),
    createdAt: generateRandomDate(45)
  });
  
  // Pipeline 3: Parcerias B2B (20 leads)
  const parceriasPhases = createDefaultPhases();
  pipelines.push({
    id: generateId(),
    name: 'Parcerias B2B',
    phases: parceriasPhases,
    deals: generateDealsForPipeline(parceriasPhases, 20),
    createdAt: generateRandomDate(30)
  });
  
  // Pipeline 4: Suporte Enterprise (20 leads)
  const suportePhases = createDefaultPhases();
  pipelines.push({
    id: generateId(),
    name: 'Suporte Enterprise',
    phases: suportePhases,
    deals: generateDealsForPipeline(suportePhases, 20),
    createdAt: generateRandomDate(15)
  });
  
  return { pipelines };
}
