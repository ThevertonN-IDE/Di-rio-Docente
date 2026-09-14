// src/app.js (Atualizado com Guard de Autenticação e PWA)
import { registerSW } from 'virtual:pwa-register';
import { SyncManager } from './core/localDb.js';
import { Router } from './core/router.js';
import { AuthService } from './services/AuthService.js';
import { LoginView } from './views/LoginView.js';
import { DashboardViewModel } from './viewmodels/DashboardViewModel.js';
import { DashboardView } from './views/DashboardView.js';
import { TurmaViewModel } from './viewmodels/TurmaViewModel.js';
import { TurmaView } from './views/TurmaView.js';
import { DiarioViewModel } from './viewmodels/DiarioViewModel.js';
import { DiarioView } from './views/DiarioView.js';
import { ProvaViewModel } from './viewmodels/ProvaViewModel.js';
import { ProvaView } from './views/ProvaView.js';
import { RelatorioView } from './views/RelatorioView.js';
import { BackupService } from './services/BackupService.js';
import { Toast } from './utils/ui.js';

// Registra a atualização automática do Service Worker (Offline PWA)
registerSW({ immediate: true });

// Inicia monitoramento de conectividade e fila offline
SyncManager.init();

async function iniciarApp() {
  const usuario = await AuthService.getUsuarioAtual();
  const header = document.querySelector('header');

  // 1. Se não estiver autenticado: oculta navegação e renderiza tela de login
  if (!usuario) {
    if (header) header.classList.add('hidden');
    const loginView = new LoginView('app', () => {
      window.location.reload();
    });
    loginView.render();
    return;
  }

  // 2. Se autenticado: exibe o header com as ferramentas ativas
  if (header) {
    header.classList.remove('hidden');

    // Listener do botão de Backup (apenas com login ativo)
    const btnBackup = document.getElementById('btn-gerar-backup');
    if (btnBackup && !btnBackup.dataset.bound) {
      btnBackup.dataset.bound = 'true';
      btnBackup.addEventListener('click', async () => {
        btnBackup.disabled = true;
        btnBackup.innerText = 'Exportando...';
        try {
          await BackupService.gerarSnapshotCompleto();
          Toast.show('Backup JSON baixado com sucesso!', 'success');
        } catch (err) {
          Toast.show('Erro ao exportar backup: ' + err.message, 'error');
        } finally {
          btnBackup.disabled = false;
          btnBackup.innerHTML = '💾 Fazer Backup';
        }
      });
    }

    // Botão de Logout
    if (!document.getElementById('btn-logout')) {
      const nav = header.querySelector('nav');
      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'btn-logout';
      logoutBtn.className = 'text-rose-600 hover:text-rose-800 text-xs font-bold transition ml-2 cursor-pointer';
      logoutBtn.innerText = 'Sair';
      logoutBtn.addEventListener('click', async () => {
        await AuthService.sair();
        window.location.reload();
      });
      nav?.appendChild(logoutBtn);
    }
  }

  // 3. Roteador SPA
  const rotas = {
    dashboard: (container) => {
      const vm = new DashboardViewModel();
      const view = new DashboardView(container.id, vm, (rota, id) => {
        window.location.hash = id ? `#${rota}/${id}` : `#${rota}`;
      });
      vm.carregarDashboard();
    },

    turma: (container, turmaId) => {
      const vm = new TurmaViewModel(turmaId);
      new TurmaView(container.id, vm);
      vm.carregarDados();
    },

    diario: (container, turmaId) => {
      const vm = new DiarioViewModel(turmaId);
      new DiarioView(container.id, vm);
      vm.carregarDiario();
    },

    provas: (container) => {
      const vm = new ProvaViewModel();
      const view = new ProvaView(container.id, vm);
      view.render();
    },

    relatorios: (container, turmaId) => {
      const view = new RelatorioView(container.id, turmaId);
      view.carregarERenderizar();
    },

    404: (container) => {
      container.innerHTML = `
        <div class="p-12 text-center">
          <h2 class="text-xl font-bold text-slate-800">Página não encontrada</h2>
          <a href="#dashboard" class="text-indigo-600 text-sm font-semibold mt-2 inline-block">Voltar ao início</a>
        </div>
      `;
    }
  };

  const appRouter = new Router(rotas, 'app');
  appRouter.iniciar();
}

iniciarApp();