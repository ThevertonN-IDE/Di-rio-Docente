// src/app.js
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
import { atualizarCorTema } from './utils/theme.js';

// 1. Registro nativo do Service Worker PWA (Offline & Cache)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW em desenvolvimento/preview:', err);
    });
  });
}

// 2. Inicia monitoramento de conectividade e fila de sincronização
SyncManager.init();

async function iniciarApp() {
  const usuario = await AuthService.getUsuarioAtual();
  const header = document.getElementById('app-header');

  // Se não houver login: aplica cor de login, esconde header e exibe tela de login
  if (!usuario) {
    atualizarCorTema('login');
    if (header) header.classList.add('hidden');
    
    const loginView = new LoginView('app', () => {
      window.location.hash = '#dashboard';
      window.location.reload();
    });
    loginView.render();
    return;
  }

  // Se autenticado: exibe o cabeçalho e inicializa menus
  if (header) {
    header.classList.remove('hidden');

    // Menu Mobile (Hambúrguer)
    const btnMobile = document.getElementById('btn-mobile-menu');
    const menuMobile = document.getElementById('menu-mobile');
    btnMobile?.addEventListener('click', () => {
      menuMobile?.classList.toggle('hidden');
    });

    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => menuMobile?.classList.add('hidden'));
    });

    // Ação unificada de backup completo (JSON)
    const dispararBackup = async (btn) => {
      btn.disabled = true;
      btn.innerText = 'Exportando...';
      try {
        await BackupService.gerarSnapshotCompleto();
        Toast.show('Backup JSON baixado com sucesso!', 'success');
      } catch (err) {
        Toast.show('Erro ao exportar: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '💾 Fazer Backup';
      }
    };

    const btnBackupDesktop = document.getElementById('btn-gerar-backup');
    const btnBackupMobile = document.getElementById('btn-gerar-backup-mobile');
    btnBackupDesktop?.addEventListener('click', () => dispararBackup(btnBackupDesktop));
    btnBackupMobile?.addEventListener('click', () => dispararBackup(btnBackupMobile));

    // Botão Sair Desktop
    if (!document.getElementById('btn-logout')) {
      const navDesktop = document.getElementById('nav-desktop');
      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'btn-logout';
      logoutBtn.className = 'text-rose-600 hover:text-rose-800 text-xs font-bold transition ml-2 cursor-pointer';
      logoutBtn.innerText = 'Sair';
      logoutBtn.addEventListener('click', async () => {
        await AuthService.sair();
        window.location.reload();
      });
      navDesktop?.appendChild(logoutBtn);
    }

    // Botão Sair Mobile
    const mobileLogoutSlot = document.getElementById('mobile-logout-slot');
    if (mobileLogoutSlot && !document.getElementById('btn-logout-mobile')) {
      const logoutMobile = document.createElement('button');
      logoutMobile.id = 'btn-logout-mobile';
      logoutMobile.className = 'text-rose-600 hover:text-rose-800 text-xs font-bold transition p-2 cursor-pointer';
      logoutMobile.innerText = 'Sair da Conta';
      logoutMobile.addEventListener('click', async () => {
        await AuthService.sair();
        window.location.reload();
      });
      mobileLogoutSlot.appendChild(logoutMobile);
    }
  }

  // Rotas do SPA
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