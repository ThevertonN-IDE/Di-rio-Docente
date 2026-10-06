// src/views/LandingPageView.js
import { AssinaturaModal } from '../utils/AssinaturaModal.js';

export class LandingPageView {
  static render(container, { onAbrirLogin, onAbrirCadastro }) {
    container.innerHTML = `
      <div class="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none">
        
        <!-- BARRA SUPERIOR FIXA -->
        <header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
          <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">📓</span>
              <span class="font-black text-lg text-slate-800 tracking-tight">Diário Docente</span>
            </div>
            
            <div class="flex items-center gap-2 sm:gap-3">
              <button id="btn-lp-login" class="touch-action min-h-[44px] px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 transition">
                Entrar
              </button>
              <button id="btn-lp-cadastro-topo" class="touch-action min-h-[44px] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95">
                Criar Conta
              </button>
            </div>
          </div>
        </header>

        <!-- HERO SECTION (PRIMEIRA DOBRA) -->
        <section class="py-12 sm:py-20 px-4 max-w-4xl mx-auto text-center space-y-5">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-xs font-bold">
            <span>✨</span> O sistema do professor moderno
          </div>

          <h1 class="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Menos burocracia no diário, <br class="hidden sm:inline">
            <span class="text-indigo-600">mais tempo para ensinar.</span>
          </h1>

          <p class="text-xs sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Gestão rápida de turmas, faltas, notas e geração de avaliações em folha A4 com diagramação limpa e suporte a equações matemáticas em LaTeX.
          </p>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button id="btn-lp-comecar-gratis" class="touch-action w-full sm:w-auto min-h-[44px] px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition active:scale-95">
              Começar Gratuitamente
            </button>
            <a href="#tabela-planos" class="touch-action w-full sm:w-auto min-h-[44px] px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition text-center flex items-center justify-center">
              Ver Planos & Preços
            </a>
          </div>
        </section>

        <!-- RECURSOS PRINCIPAIS -->
        <section class="py-12 bg-white border-y border-slate-200">
          <div class="max-w-6xl mx-auto px-4">
            <div class="text-center max-w-xl mx-auto mb-10">
              <h2 class="text-xl sm:text-2xl font-black text-slate-800">Recursos feitos para a rotina em sala de aula</h2>
              <p class="text-xs text-slate-500 mt-1">Desenvolvido para eliminar o retrabalho manual.</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span class="text-2xl block">📄</span>
                <h3 class="font-bold text-slate-800 text-sm">Estúdio de Provas A4</h3>
                <p class="text-xs text-slate-600 leading-relaxed">Gere provas, testes e listas de exercícios prontos para impressão em folha A4 com cabeçalho escolar padronizado.</p>
              </div>

              <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span class="text-2xl block">📐</span>
                <h3 class="font-bold text-slate-800 text-sm">Fórmulas em LaTeX</h3>
                <p class="text-xs text-slate-600 leading-relaxed">Assistente visual com mais de 60 operadores matemáticos, renderização KaTeX imediata e exportação para Overleaf.</p>
              </div>

              <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span class="text-2xl block">📊</span>
                <h3 class="font-bold text-slate-800 text-sm">Diário Escolar Ágil</h3>
                <p class="text-xs text-slate-600 leading-relaxed">Registro de chamadas, cálculo de médias com pesos e relatórios de alunos sem complicação de planilhas.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- TABELA DE PLANOS (PRICING) -->
        <section id="tabela-planos" class="py-14 max-w-5xl mx-auto px-4">
          <div class="text-center max-w-xl mx-auto mb-10">
            <h2 class="text-xl sm:text-2xl font-black text-slate-800">Escolha o plano ideal para você</h2>
            <p class="text-xs text-slate-500 mt-1">Comece grátis e faça upgrade quando suas turmas aumentarem.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            
            <!-- PLANO GRATUITO -->
            <div class="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-6">
              <div class="space-y-4">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Plano Gratuito</span>
                <div class="text-3xl font-black text-slate-800">R$ 0 <span class="text-xs font-normal text-slate-400">/sempre</span></div>
                <ul class="text-xs text-slate-600 space-y-2.5">
                  <li class="flex items-center gap-2"><span>✓</span> <strong>1 Turma ativa</strong></li>
                  <li class="flex items-center gap-2"><span>✓</span> Diário de chamadas e notas</li>
                  <li class="flex items-center gap-2"><span>✓</span> Criador de avaliações em A4</li>
                  <li class="flex items-center gap-2"><span>✓</span> Inserção de fórmulas LaTeX</li>
                  <li class="flex items-center gap-2 text-slate-400"><span>✕</span> Turmas ilimitadas</li>
                  <li class="flex items-center gap-2 text-slate-400"><span>✕</span> Digitalização com IA</li>
                </ul>
              </div>
              <button id="btn-lp-escolher-gratis" class="touch-action min-h-[44px] w-full py-2.5 border border-slate-300 font-bold text-xs text-slate-700 rounded-xl hover:bg-slate-50 transition">
                Criar Conta Gratuita
              </button>
            </div>

            <!-- PLANO PRO -->
            <div class="bg-white p-6 rounded-2xl border-2 border-indigo-600 shadow-xl flex flex-col justify-between space-y-6 relative">
              <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow-xs">
                Mais Popular
              </div>
              <div class="space-y-4">
                <span class="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Professor Pro</span>
                <div class="text-3xl font-black text-slate-800">R$ 19,90 <span class="text-xs font-normal text-slate-400">/30 dias</span></div>
                <ul class="text-xs text-slate-600 space-y-2.5">
                  <li class="flex items-center gap-2"><span>✓</span> <strong>Turmas ilimitadas</strong></li>
                  <li class="flex items-center gap-2"><span>✓</span> <strong>Digitalização de provas com IA</strong></li>
                  <li class="flex items-center gap-2"><span>✓</span> Exportação para Overleaf / TeX</li>
                  <li class="flex items-center gap-2"><span>✓</span> Todos os modelos de cabeçalho A4</li>
                  <li class="flex items-center gap-2"><span>✓</span> Ativação direta via Pix</li>
                </ul>
              </div>
              <button id="btn-lp-escolher-pro" class="touch-action min-h-[44px] w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white rounded-xl shadow-xs transition active:scale-95">
                Assinar Plano Pro
              </button>
            </div>

            <!-- PLANO ESCOLAR -->
            <div class="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-6">
              <div class="space-y-4">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Institucional</span>
                <div class="text-3xl font-black text-slate-800">Escolas <span class="text-xs font-normal text-slate-400">/equipe</span></div>
                <ul class="text-xs text-slate-600 space-y-2.5">
                  <li class="flex items-center gap-2"><span>✓</span> Acesso para toda a equipe docente</li>
                  <li class="flex items-center gap-2"><span>✓</span> Banco de questões compartilhado</li>
                  <li class="flex items-center gap-2"><span>✓</span> Logotipo escolar oficial na folha A4</li>
                  <li class="flex items-center gap-2"><span>✓</span> Suporte e treinamento</li>
                </ul>
              </div>
              <a 
                href="https://wa.me/5584999999999?text=Ol%C3%A1!%20Tenho%20interesse%20no%20plano%20institucional%20do%20Di%C3%A1rio%20Docente%20para%20minha%20escola." 
                target="_blank" 
                class="touch-action min-h-[44px] w-full py-2.5 border border-slate-300 font-bold text-xs text-slate-700 rounded-xl hover:bg-slate-50 transition text-center flex items-center justify-center"
              >
                Falar no WhatsApp
              </a>
            </div>

          </div>
        </section>

        <!-- RODAPÉ -->
        <footer class="mt-auto py-6 bg-slate-900 text-slate-400 text-xs border-t border-slate-800 text-center">
          <p>© 2026 Diário Docente. Todos os direitos reservados.</p>
        </footer>

      </div>
    `;

    // Listeners dos botões de ação
    container.querySelector('#btn-lp-login')?.addEventListener('click', () => onAbrirLogin?.());
    container.querySelector('#btn-lp-cadastro-topo')?.addEventListener('click', () => onAbrirCadastro?.());
    container.querySelector('#btn-lp-comecar-gratis')?.addEventListener('click', () => onAbrirCadastro?.());
    container.querySelector('#btn-lp-escolher-gratis')?.addEventListener('click', () => onAbrirCadastro?.());
    container.querySelector('#btn-lp-escolher-pro')?.addEventListener('click', () => {
      // Se não estiver logado, encaminha para criar conta ou abre o modal Pix diretamente
      AssinaturaModal.abrir('');
    });
  }
}