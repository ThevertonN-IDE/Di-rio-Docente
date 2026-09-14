// src/utils/charts.js
export function renderizarGraficoDiagnostico(canvasId, mediasArray) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;

  // Destrói gráfico antigo se já existir no mesmo canvas
  const chartExistente = Chart.getChart(ctx);
  if (chartExistente) chartExistente.destroy();

  // Categorização de desempenho
  const faixas = {
    'Crítico (0 - 4.9)': 0,
    'Recuperação (5.0 - 6.9)': 0,
    'Bom (7.0 - 8.9)': 0,
    'Excelente (9.0 - 10)': 0
  };

  mediasArray.forEach(mediaStr => {
    const val = parseFloat(mediaStr);
    if (isNaN(val)) return;
    if (val < 5.0) faixas['Crítico (0 - 4.9)']++;
    else if (val < 7.0) faixas['Recuperação (5.0 - 6.9)']++;
    else if (val < 9.0) faixas['Bom (7.0 - 8.9)']++;
    else faixas['Excelente (9.0 - 10)']++;
  });

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(faixas),
      datasets: [{
        label: 'Quantidade de Alunos',
        data: Object.values(faixas),
        backgroundColor: [
          'rgba(244, 63, 94, 0.8)',  // Vermelho
          'rgba(245, 158, 11, 0.8)', // Âmbar
          'rgba(59, 130, 246, 0.8)',  // Azul
          'rgba(16, 185, 129, 0.8)'  // Verde esmeralda
        ],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, precision: 0 }
        }
      }
    }
  });
}