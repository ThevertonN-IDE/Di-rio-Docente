// src/utils/PoliticasModal.js

export class PoliticasModal {
  static abaAtiva = 'privacidade';

  static abrir(abaInicial = 'privacidade') {
    this.abaAtiva = abaInicial;
    let modal = document.getElementById('modal-politicas-legais');

    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-politicas-legais';
      document.body.appendChild(modal);
    }

    modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4 select-none';
    modal.innerHTML = `
      <div class="bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        
        <!-- Puxador Mobile -->
        <div class="w-12 h-1.5 bg-slate-300 rounded-full mx-auto sm:hidden -mt-1 mb-1"></div>

        <!-- Cabeçalho -->
        <div class="flex items-center justify-between border-b pb-3 shrink-0">
          <div>
            <h3 class="text-base font-black text-slate-800 flex items-center gap-1.5">
              <span>⚖️</span> Termos, LGPD e Privacidade
            </h3>
            <p class="text-xs text-slate-500">Transparência e segurança jurídica no ambiente escolar</p>
          </div>
          <button id="btn-fechar-politicas" class="touch-target-44 text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none">&times;</button>
        </div>

        <!-- Seletor de Abas -->
        <div class="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold overflow-x-auto no-scrollbar shrink-0">
          <button data-aba-legal="privacidade" class="touch-action px-3 py-1.5 rounded-xl transition ${this.abaAtiva === 'privacidade' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
            LGPD & Dados de Menores
          </button>
          <button data-aba-legal="termos" class="touch-action px-3 py-1.5 rounded-xl transition ${this.abaAtiva === 'termos' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
            Termos de Uso
          </button>
          <button data-aba-legal="cookies" class="touch-action px-3 py-1.5 rounded-xl transition ${this.abaAtiva === 'cookies' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
            Cookies & Armazenamento
          </button>
        </div>

        <!-- Área de Conteúdo do Documento com Scroll -->
        <div id="conteudo-documento-legal" class="flex-1 overflow-y-auto pr-1 text-xs text-slate-600 space-y-3.5 leading-relaxed select-text font-sans">
          ${this.gerarConteudoAba(this.abaAtiva)}
        </div>

        <!-- Rodapé do Modal -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span class="text-[11px] text-slate-400">Atualizado conforme Lei Federal 13.709/2018 (LGPD).</span>
          <button id="btn-entendi-politicas" class="touch-action px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition">
            Entendido
          </button>
        </div>

      </div>
    `;

    modal.classList.remove('hidden');

    // Fechar
    const fechar = () => modal.classList.add('hidden');
    modal.querySelector('#btn-fechar-politicas').onclick = fechar;
    modal.querySelector('#btn-entendi-politicas').onclick = fechar;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) fechar();
    });

    // Alternar Abas
    modal.querySelectorAll('[data-aba-legal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.abaAtiva = e.currentTarget.dataset.abaLegal;
        modal.querySelectorAll('[data-aba-legal]').forEach(b => {
          const ativo = b.dataset.abaLegal === this.abaAtiva;
          b.className = `touch-action px-3 py-1.5 rounded-xl transition ${ativo ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`;
        });
        const containerTexto = modal.querySelector('#conteudo-documento-legal');
        if (containerTexto) containerTexto.innerHTML = this.gerarConteudoAba(this.abaAtiva);
      });
    });
  }

  static gerarConteudoAba(aba) {
    if (aba === 'privacidade') {
      return `
        <div class="space-y-3.5 text-slate-600">
          <div>
            <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Última atualização: Outubro de 2026</span>
            <h4 class="font-bold text-slate-800 text-sm mt-0.5">Política de Privacidade, LGPD e Proteção a Menores</h4>
          </div>

          <div class="space-y-1">
            <h5 class="font-bold text-slate-700 text-xs">1. Papéis Jurídicos: Quem Controla e Quem Opera os Dados</h5>
            <p>Em estrita consonância com a Lei Geral de Proteção de Dados Pessoais (Lei Federal nº 13.709/2018):</p>
            <ul class="list-disc list-inside space-y-1 pl-1 text-[11px]">
              <li><strong>O Professor ou Instituição Escolar é o CONTROLADOR:</strong> É quem decide quais alunos matricular, insere as notas e registra as presenças no exercício regular de suas atividades docentes. É responsável pela legitimidade da coleta dos registros escolares junto aos responsáveis legais e à instituição.</li>
              <li><strong>O Diário Docente é o OPERADOR:</strong> A plataforma atua unicamente como prestadora de serviços de software e infraestrutura em nuvem, armazenando e organizando os registros sob comando exclusivo do professor logado. Não reivindicamos posse, propriedade intelectual ou comercial sobre esses registros escolares.</li>
            </ul>
          </div>

          <div class="space-y-1">
            <h5 class="font-bold text-slate-700 text-xs">2. Proteção Especial a Alunos Menores de Idade (Art. 14 da LGPD & ECA)</h5>
            <p>O Diário Docente orienta-se pelo <strong>princípio do melhor interesse da criança e do adolescente</strong>:</p>
            <ul class="list-disc list-inside space-y-1 pl-1 text-[11px]">
              <li><strong>Finalidade Exclusivamente Pedagógica:</strong> Todas as informações inseridas sobre discentes servem apenas para emissão de diários, boletins, acompanhamento de frequência e diagramação de folhas A4.</li>
              <li><strong>Vedação Comercial Absoluta:</strong> É terminantemente proibido qualquer cruzamento de dados de alunos para marketing direcionado, publicidade comportamental, criação de perfis comerciais ou repasse financeiro a terceiros.</li>
            </ul>
          </div>

          <div class="space-y-1">
            <h5 class="font-bold text-slate-700 text-xs">3. Minimização de Dados (O que coletamos e o que NÃO solicitamos)</h5>
            <p>Adotamos o princípio de coletar o mínimo estritamente indispensável para a rotina de sala de aula:</p>
            <ul class="list-disc list-inside space-y-1 pl-1 text-[11px]">
              <li><strong>Dados Armazenados do Professor:</strong> Nome, endereço de e-mail e credenciais criptografadas de acesso.</li>
              <li><strong>Dados Operados dos Alunos:</strong> Nome (ou apelido escolar), turma, registro de faltas e notas das avaliações.</li>
              <li><strong>Dados NÃO Coletados:</strong> A plataforma <strong>não solicita nem armazena</strong> CPF de alunos, certidões civis, dados bancários de discentes, informações de saúde física/mental, biometria ou dados de geolocalização.</li>
            </ul>
          </div>

          <div class="space-y-1">
            <h5 class="font-bold text-slate-700 text-xs">4. Segurança da Informação e Isolamento em Nuvem</h5>
            <p>Os registros são processados sobre infraestrutura em nuvem (Supabase) dotada de:</p>
            <ul class="list-disc list-inside space-y-1 pl-1 text-[11px]">
              <li><strong>Criptografia em Trânsito:</strong> Todas as requisições utilizam tráfego seguro via HTTPS/TLS 1.3.</li>
              <li><strong>Isolamento Lógico (Row Level Security):</strong> Regras automáticas no banco garantem que nenhum professor ou terceiro tenha acesso aos dados, notas ou turmas de outros usuários cadastrados.</li>
            </ul>
          </div>

          <div class="space-y-1">
            <h5 class="font-bold text-slate-700 text-xs">5. Direitos do Titular e Exclusão Definitiva (Art. 18 da LGPD)</h5>
            <p>O professor tem autonomia total e imediata para:</p>
            <ul class="list-disc list-inside space-y-1 pl-1 text-[11px]">
              <li>Excluir turmas, alunos ou avaliações a qualquer instante, resultando na eliminação direta dos registros vinculados no banco de dados;</li>
              <li>Baixar um snapshot completo de todos os seus dados a qualquer momento por meio do botão <em>"Fazer Backup"</em> no formato aberto JSON.</li>
            </ul>
          </div>
        </div>
      `;
    }

    if (aba === 'termos') {
      return `
        <div class="space-y-3.5 text-slate-600">
          <div>
            <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Última atualização: Outubro de 2026</span>
            <h4 class="font-bold text-slate-800 text-sm mt-0.5">Termos e Condições Gerais de Uso</h4>
          </div>

          <div class="space-y-1">
            <h5 class="font-bold text-slate-700 text-xs">1. Objeto e Natureza do Serviço</h5>
            <p>O <strong>Diário Docente</strong> é uma plataforma de software voltada ao suporte pedagógico e à produtividade escolar. O sistema oferece ferramentas para diagramação de avaliações em folhas A4, edição de fórmulas matemáticas em KaTeX/LaTeX, gestão de chamadas escolares, cálculo de médias e geração de relatórios de rendimento.</p>
          </div>

          <div class="space-y-1">
            <h5 class="font-bold text-slate-700 text-xs">2. Cadastro e Responsabilidade pelo Acesso</h5>
            <ul class="list-disc list-inside space-y-1 pl-1 text-[11px]">
              <li><strong>Habilitação:</strong> O cadastro destina-se a professores, educadores e gestores escolares maiores de 18 anos ou legalmente habilitados para o exercício da docência.</li>
              <li><strong>Guarda de Credenciais:</strong> O usuário é o único responsável pela confidencialidade de sua senha e por todas as operações realizadas em sua conta.</li>
              <li><strong>Autorização Institucional:</strong> Ao registrar turmas e estudantes, o professor declara estar regularmente autorizado pela respectiva instituição escolar para o registro e manutenção do diário acadêmico.</li>
            </ul>
          </div>

          <div class="space-y-1">
            <h5 class="font-bold text-slate-700 text-xs">3. Planos, Valores e Modelo de Assinatura</h5>
            <ul class="list-disc list-inside space-y-1 pl-1 text-[11px]">
              <li><strong>Plano Gratuito:</strong> Garante o direito de criar e manter 1 (uma) turma ativa com todas as funções básicas de chamadas, notas e confecção de provas, sem custos ou exibição de anúncios comerciais.</li>
              <li><strong>Plano Professor Pro (R$ 19,90):</strong> Concede acesso a turmas ilimitadas, ferramentas de IA e recursos avançados de exportação pelo período contratado de 30 (trinta) dias.</li>
              <li><strong>Ativação via Pix:</strong> O Plano Pro opera no modelo pré-pago sem renovação automática compulsória em cartão de crédito. A ativação ocorre após o envio do comprovante Pix e a correspondente validação cadastral. O término dos 30 dias sem nova contratação apenas congela as turmas excedentes, sem excluir seus dados.</li>
            </ul>
          </div>

          <div class="space-y-1">
            <h5 class="font-bold text-slate-700 text-xs">4. Direitos Autorais e Propriedade dos Dados</h5>
            <ul class="list-disc list-inside space-y-1 pl-1 text-[11px]">
              <li><strong>Material do Professor:</strong> Todas as questões, provas, gabaritos, comentários e planos de aula elaborados pelo usuário pertencem exclusivamente a ele ou à sua instituição de ensino. O Diário Docente não reivindica direitos de autor sobre materiais criados no editor.</li>
              <li><strong>Software:</strong> O código-fonte, layout visual, marcas, ícones e arquitetura do Diário Docente são protegidos pelas leis de propriedade intelectual e direitos autorais, sendo vedada sua reprodução ou engenharia reversa não autorizada.</li>
            </ul>
          </div>

          <div class="space-y-1">
            <h5 class="font-bold text-slate-700 text-xs">5. Limitações de Responsabilidade</h5>
            <ul class="list-disc list-inside space-y-1 pl-1 text-[11px]">
              <li><strong>Revisão Pedagógica:</strong> O usuário é responsável pela revisão final de enunciados, cálculos matemáticos, gabaritos e notas lançadas antes da aplicação impressa ou publicação discente.</li>
              <li><strong>Rotina de Backup:</strong> Embora a plataforma mantenha persistência em nuvem e mecanismos de isolamento, recomenda-se que o usuário utilize a funcionalidade de backup em arquivo JSON para manter cópias locais regulares de seus acervos.</li>
            </ul>
          </div>

          <div class="space-y-1">
            <h5 class="font-bold text-slate-700 text-xs">6. Cancelamento, Encerramento e Foro</h5>
            <p>O usuário pode suspender o uso ou solicitar a exclusão integral de sua conta a qualquer tempo. Estes Termos de Uso são regidos pela legislação da República Federativa do Brasil, elegendo-se o foro da Comarca de Currais Novos/RN para dirimir eventuais controvérsias oriundas de sua aplicação.</p>
          </div>
        </div>
      `;
    }

    // Aba Cookies
    if (aba === 'cookies') {
      return `
        <div class="space-y-3 text-slate-600">
          <div>
            <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Última atualização: Outubro de 2026</span>
            <h4 class="font-bold text-slate-800 text-sm mt-0.5">Política de Cookies e Armazenamento Local</h4>
          </div>

          <div class="space-y-1">
            <h5 class="font-bold text-slate-700 text-xs">1. Princípio da Transparência e Simplicidade</h5>
            <p>O <strong>Diário Docente</strong> preza pela privacidade integral de seus usuários. <strong>Não comercializamos anúncios, não vendemos dados a terceiros e não utilizamos ferramentas de rastreamento comportamental</strong> (como pixels de redes sociais ou cookies de redes de publicidade direcionada).</p>
          </div>

          <div class="space-y-1">
            <h5 class="font-bold text-slate-700 text-xs">2. O que Utilizamos: Armazenamento Local Técnico (Essencial)</h5>
            <p>Empregamos tecnologias padrão dos navegadores (<code>localStorage</code>, <code>sessionStorage</code> e Cache PWA) estritamente para viabilizar as funções da plataforma:</p>
            <ul class="list-disc list-inside space-y-1 pl-1 text-[11px]">
              <li><strong>Sessão e Autenticação:</strong> Gerenciado via Supabase no <code>localStorage</code> para manter o professor conectado com segurança sem pedir senha a cada clique.</li>
              <li><strong>Rascunhos e Persistência Operacional:</strong> Salva localmente suas preferências visuais e rascunhos de provas/aulas em edição, evitando perda de dados caso a internet oscile.</li>
              <li><strong>Cache Offline (PWA):</strong> Mantém arquivos visuais em cache para carregamento instantâneo no celular e computador.</li>
            </ul>
          </div>

          <div class="space-y-1">
            <h5 class="font-bold text-slate-700 text-xs">3. Ausência de Rastreadores de Terceiros</h5>
            <p>Não há coleta de dados para formação de perfis comerciais nem cruzamento de informações com serviços de publicidade. Nenhuma informação sobre alunos ou turmas é exposta a terceiros por meio de cookies.</p>
          </div>

          <div class="space-y-1">
            <h5 class="font-bold text-slate-700 text-xs">4. Gerenciamento pelo Usuário</h5>
            <p>Caso limpe o histórico ou dados do navegador, sua sessão será encerrada e será necessário fazer login novamente. Rascunhos locais não sincronizados com a nuvem poderão ser perdidos.</p>
          </div>
        </div>
      `;
    }
  }
}